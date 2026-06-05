import { WorkspaceFile } from '../types/file';
import { SearchCriteria, SearchFilters } from './SearchFilters';
import { SearchIndex, tokenize } from './SearchIndex';

export interface ContentMatchResult {
  file: WorkspaceFile;
  score: number;
  snippet: string; // Surrounding matched string snippet
}

export class ContentSearch {
  /**
   * Searches file text content using the advanced SearchIndex content map.
   * Generates helpful context snippets of matching keywords.
   */
  static search(
    index: SearchIndex,
    criteria: SearchCriteria
  ): ContentMatchResult[] {
    const query = criteria.query?.trim() || '';
    if (!query) {
      return [];
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Filter candidate files that pass criteria before checking text matches
    const allFiles = index.getAllFiles();
    const candidates = allFiles.filter(file => SearchFilters.matches(file, criteria));
    const candidateIds = new Set(candidates.map(c => c.id));

    // Resolve content scores using inverted content index
    const contentScores = index.queryContent(queryTokens);
    const results: ContentMatchResult[] = [];

    for (const [fileId, score] of contentScores.entries()) {
      if (!candidateIds.has(fileId)) {
        continue;
      }

      const file = index.getFile(fileId);
      if (!file) continue;

      const fullText = index.getCachedContent(fileId) || '';
      const snippet = this.generateSnippet(fullText, queryTokens[0], query);

      // Boost score if the full exact search query exists as a contiguous substring in content
      const contiguousIndex = fullText.toLowerCase().indexOf(query.toLowerCase());
      let finalScore = score;
      if (contiguousIndex !== -1) {
        finalScore += 40; // High contiguous sub-match weight
      }

      results.push({
        file,
        score: finalScore,
        snippet
      });
    }

    // Sort contents matches descending by relevance score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Produces a clean text slice containing first matched tokens with elegant edge truncations.
   */
  private static generateSnippet(text: string, firstToken: string, fullQuery: string, maxLength = 100): string {
    if (!text) return '';

    // Preferred exact match locator
    let matchIndex = text.toLowerCase().indexOf(fullQuery.toLowerCase());
    let tokenLength = fullQuery.length;

    // Fallback to first query token locator
    if (matchIndex === -1 && firstToken) {
      matchIndex = text.toLowerCase().indexOf(firstToken.toLowerCase());
      tokenLength = firstToken.length;
    }

    // If no match window found, return start of the document
    if (matchIndex === -1) {
      if (text.length > maxLength) {
        return text.slice(0, maxLength).trim() + '...';
      }
      return text.trim();
    }

    // Create surrounding bounds
    const contextPadding = Math.floor((maxLength - tokenLength) / 2);
    const startIndex = Math.max(0, matchIndex - contextPadding);
    const endIndex = Math.min(text.length, matchIndex + tokenLength + contextPadding);

    let snippet = text.slice(startIndex, endIndex).replace(/\s+/g, ' ');

    if (startIndex > 0) {
      snippet = '...' + snippet;
    }
    if (endIndex < text.length) {
      snippet = snippet + '...';
    }

    return snippet.trim();
  }
}
