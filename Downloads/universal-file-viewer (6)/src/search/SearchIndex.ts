import { WorkspaceFile } from '../types/file';

/**
 * Tokenization utility to split strings into searchable terms.
 * Lowers casing, normalizes accents, and filters out empty results.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .split(/[^a-z0-9]+/gi)          // split by any non-alphanumeric character
    .filter(token => token.length > 0);
}

export class SearchIndex {
  // Map of fileId to the actual WorkspaceFile
  private fileMap = new Map<string, WorkspaceFile>();

  // Inverted index for file metadata (tokens mapping to Sets of fileIds)
  private nameInvertedIndex = new Map<string, Set<string>>();

  // Inverted index for file contents (tokens mapping to Sets of fileIds)
  private contentInvertedIndex = new Map<string, Set<string>>();

  // Cache of extracted textual contents (fileId to text content)
  private contentCache = new Map<string, string>();

  // Set of file IDs currently being processed for content search
  private indexingContentInProgress = new Set<string>();

  /**
   * Adds or updates a file in the search index.
   * Filename/metadata is indexed synchronously.
   * Content indexing is triggered asynchronously to prevent blocking the UI.
   */
  async addFile(file: WorkspaceFile): Promise<void> {
    // 1. Remove previous instance if already indexed to prevent duplicates
    if (this.fileMap.has(file.id)) {
      this.removeFile(file.id);
    }

    this.fileMap.set(file.id, file);

    // 2. Index Filename and Extension
    const nameTokens = tokenize(file.name);
    // Include category and extension as explicit metadata tokens
    if (file.category) {
      nameTokens.push(file.category.toLowerCase());
    }
    const dotIndex = file.name.lastIndexOf('.');
    if (dotIndex !== -1) {
      nameTokens.push(file.name.slice(dotIndex + 1).toLowerCase());
    }

    for (const token of nameTokens) {
      if (!this.nameInvertedIndex.has(token)) {
        this.nameInvertedIndex.set(token, new Set());
      }
      this.nameInvertedIndex.get(token)!.add(file.id);
    }

    // Include tags in metadata tokens
    if (file.tags && file.tags.length > 0) {
      for (const tag of file.tags) {
        const tagTokens = tokenize(tag);
        for (const tToken of tagTokens) {
          if (!this.nameInvertedIndex.has(tToken)) {
            this.nameInvertedIndex.set(tToken, new Set());
          }
          this.nameInvertedIndex.get(tToken)!.add(file.id);
        }
      }
    }

    // 3. Queue Content Parsing if textual
    if (this.isTextualFile(file)) {
      this.indexContentAsynchronously(file).catch(err => {
        console.warn(`Background content indexing failed for ${file.name}:`, err);
      });
    }
  }

  /**
   * Removes a file and all its indexed terms from the indexes.
   */
  removeFile(fileId: string): void {
    this.fileMap.delete(fileId);
    this.contentCache.delete(fileId);
    this.indexingContentInProgress.delete(fileId);

    // Clear from metadata index
    for (const [token, ids] of this.nameInvertedIndex.entries()) {
      if (ids.has(fileId)) {
        ids.delete(fileId);
        if (ids.size === 0) {
          this.nameInvertedIndex.delete(token);
        }
      }
    }

    // Clear from content index
    for (const [token, ids] of this.contentInvertedIndex.entries()) {
      if (ids.has(fileId)) {
        ids.delete(fileId);
        if (ids.size === 0) {
          this.contentInvertedIndex.delete(token);
        }
      }
    }
  }

  /**
   * Rebuilds the search index with a complete fresh batch of files.
   */
  async rebuild(files: WorkspaceFile[]): Promise<void> {
    this.fileMap.clear();
    this.nameInvertedIndex.clear();
    this.contentInvertedIndex.clear();
    this.contentCache.clear();
    this.indexingContentInProgress.clear();

    // Synchronously index all metadata first
    const promises: Promise<void>[] = [];
    for (const file of files) {
      promises.push(this.addFile(file));
    }
    await Promise.all(promises);
  }

  /**
   * Retrieves a file by its ID from the index map.
   */
  getFile(fileId: string): WorkspaceFile | undefined {
    return this.fileMap.get(fileId);
  }

  /**
   * Returns all files currently indexed.
   */
  getAllFiles(): WorkspaceFile[] {
    return Array.from(this.fileMap.values());
  }

  /**
   * Safe getter for cached file contents.
   */
  getCachedContent(fileId: string): string | undefined {
    return this.contentCache.get(fileId);
  }

  /**
   * Queries metadata index and calculates relevance scores.
   * Returns array of matches with their hit weights.
   */
  queryMetadata(queryTokens: string[]): Map<string, number> {
    const scores = new Map<string, number>();
    if (queryTokens.length === 0) return scores;

    for (const token of queryTokens) {
      // Direct matches
      const matchedIds = this.findMatchingFileIds(token, this.nameInvertedIndex);
      for (const [id, weight] of matchedIds) {
        scores.set(id, (scores.get(id) || 0) + weight * 10); // Meta matches score highly
      }
    }

    return scores;
  }

  /**
   * Queries textual file content index and calculates relevance scores.
   */
  queryContent(queryTokens: string[]): Map<string, number> {
    const scores = new Map<string, number>();
    if (queryTokens.length === 0) return scores;

    for (const token of queryTokens) {
      const matchedIds = this.findMatchingFileIds(token, this.contentInvertedIndex);
      for (const [id, weight] of matchedIds) {
        scores.set(id, (scores.get(id) || 0) + weight * 2); // Content matches score moderately
      }
    }
    return scores;
  }

  /**
   * Internal sub-matches collector. Supports exact prefixes for autocomplete.
   */
  private findMatchingFileIds(queryToken: string, index: Map<string, Set<string>>): Map<string, number> {
    const matchWeights = new Map<string, number>();

    for (const [indexToken, ids] of index.entries()) {
      if (indexToken === queryToken) {
        // Exact match -> weight 1.0
        for (const id of ids) {
          matchWeights.set(id, (matchWeights.get(id) || 0) + 1.0);
        }
      } else if (indexToken.startsWith(queryToken)) {
        // Partial prefix match -> weight proportional to length matching
        const ratio = queryToken.length / indexToken.length;
        if (ratio >= 0.4) { // Only count if relatively reasonable overlap
          for (const id of ids) {
            matchWeights.set(id, (matchWeights.get(id) || 0) + ratio * 0.5);
          }
        }
      }
    }

    return matchWeights;
  }

  /**
   * Determines if a file is readable text.
   */
  private isTextualFile(file: WorkspaceFile): boolean {
    const name = file.name.toLowerCase();
    const type = (file.mimeType || '').toLowerCase();
    
    return (
      name.endsWith('.txt') ||
      name.endsWith('.json') ||
      name.endsWith('.csv') ||
      name.endsWith('.xml') ||
      name.endsWith('.md') ||
      name.endsWith('.html') ||
      type.includes('text/') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.endsWith('javascript') ||
      type.endsWith('typescript')
    );
  }

  /**
   * Extracts text from blobs or native references and indexes content.
   */
  private async indexContentAsynchronously(file: WorkspaceFile): Promise<void> {
    if (this.contentCache.has(file.id) || this.indexingContentInProgress.has(file.id)) {
      return;
    }

    this.indexingContentInProgress.add(file.id);

    try {
      let text = '';
      if (file.blob && typeof file.blob.text === 'function') {
        text = await file.blob.text();
      } else if (file.uri) {
        // Safe lazy load from Native Platforms
        const { Capacitor } = await import('@capacitor/core');
        const src = Capacitor.convertFileSrc(file.uri);
        const res = await fetch(src);
        text = await res.text();
      }

      if (text) {
        // Clean and limit maximum text size to index (prevent memory bottlenecks with huge files)
        const trimmedText = text.slice(0, 150000); 
        this.contentCache.set(file.id, trimmedText);

        const contentTokens = tokenize(trimmedText);
        for (const token of contentTokens) {
          // Skip extremely common single character content noise except numeric identifiers
          if (token.length <= 1 && !/^\d+$/.test(token)) {
            continue;
          }
          if (!this.contentInvertedIndex.has(token)) {
            this.contentInvertedIndex.set(token, new Set());
          }
          this.contentInvertedIndex.get(token)!.add(file.id);
        }
      }
    } catch (e) {
      // Fail silently without blocking UI thread
      console.warn(`Content reading failed for ${file.name}:`, e);
    } finally {
      this.indexingContentInProgress.delete(file.id);
    }
  }
}
