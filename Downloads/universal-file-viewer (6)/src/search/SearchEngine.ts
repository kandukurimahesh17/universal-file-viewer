import { WorkspaceFile } from '../types/file';
import { SearchIndex, tokenize } from './SearchIndex';
import { SearchCriteria } from './SearchFilters';
import { FileSearch } from './FileSearch';
import { ContentSearch, ContentMatchResult } from './ContentSearch';

export interface SearchResults {
  metadataMatches: { file: WorkspaceFile; score: number }[];
  contentMatches: ContentMatchResult[];
  combinedCount: number;
}

export class SearchEngine {
  private static indexInstance: SearchIndex = new SearchIndex();
  private static HISTORY_STORAGE_KEY = 'filemanager_search_history';
  private static MAX_HISTORY_LENGTH = 15;

  /**
   * Safe getter for the singleton index instance.
   */
  static getIndex(): SearchIndex {
    if (!this.indexInstance) {
      this.indexInstance = new SearchIndex();
    }
    return this.indexInstance;
  }

  /**
   * Initializes the search index with an array of workspace files.
   */
  static async initialize(files: WorkspaceFile[]): Promise<void> {
    await this.getIndex().rebuild(files);
  }

  /**
   * Incremental index additions or changes sync helper.
   */
  static async indexFile(file: WorkspaceFile): Promise<void> {
    await this.getIndex().addFile(file);
  }

  /**
   * Incremental index deletions sync helper.
   */
  static deindexFile(fileId: string): void {
    this.getIndex().removeFile(fileId);
  }

  /**
   * Executes a mixed query, searching across metadata and contents.
   */
  static executeSearch(criteria: SearchCriteria): SearchResults {
    const metaMatches = FileSearch.search(this.getIndex(), criteria);
    const contentMatches = ContentSearch.search(this.getIndex(), criteria);

    // Save successful query string in search logs
    if (criteria.query && criteria.query.trim().length >= 2) {
      this.addSearchToHistory(criteria.query.trim());
    }

    return {
      metadataMatches: metaMatches,
      contentMatches,
      combinedCount: metaMatches.length + contentMatches.length
    };
  }

  /**
   * Retrieves persistent list of past successful search streams.
   */
  static getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve search history:", e);
    }
    return [];
  }

  /**
   * Clear search query caches.
   */
  static clearSearchHistory(): void {
    localStorage.removeItem(this.HISTORY_STORAGE_KEY);
  }

  /**
   * Adds a successful transaction query to the history array.
   */
  static addSearchToHistory(query: string): void {
    if (!query) return;
    const history = this.getSearchHistory();
    const cleansed = query.trim();
    
    // De-duplicate: filter previous match entries
    const filtered = history.filter(q => q.toLowerCase() !== cleansed.toLowerCase());
    
    // Add to front of FIFO list
    filtered.unshift(cleansed);

    // Limit maximum bounds
    if (filtered.length > this.MAX_HISTORY_LENGTH) {
      filtered.pop();
    }

    try {
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed saving history slot:", e);
    }
  }

  /**
   * Evaluates partial inputs returning autocomplete suggestion strings.
   * Scans history terms and filename fragments.
   */
  static getSuggestions(partialQuery: string): string[] {
    const text = partialQuery?.trim() || '';
    if (!text) {
      // If empty query, return last 5 historical searches as suggestions
      return this.getSearchHistory().slice(0, 5);
    }

    const suggestions = new Set<string>();
    const lowerPartial = text.toLowerCase();

    // 1. Scan search history for prefix matches
    const history = this.getSearchHistory();
    for (const item of history) {
      if (item.toLowerCase().startsWith(lowerPartial)) {
        suggestions.add(item);
      }
    }

    // 2. Scan filename tokens
    const files = this.getIndex().getAllFiles();
    for (const file of files) {
      const name = file.name;
      if (name.toLowerCase().includes(lowerPartial)) {
        // Suggest clean matching words or the title itself
        const tokens = tokenize(name);
        const matchToken = tokens.find(t => t.startsWith(lowerPartial));
        if (matchToken) {
          suggestions.add(matchToken);
        }
        // Also add full filename without extension
        const dotIdx = name.lastIndexOf('.');
        const cleanName = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
        if (cleanName.toLowerCase().startsWith(lowerPartial)) {
          suggestions.add(cleanName);
        }
      }
    }

    return Array.from(suggestions).slice(0, 6);
  }
}
