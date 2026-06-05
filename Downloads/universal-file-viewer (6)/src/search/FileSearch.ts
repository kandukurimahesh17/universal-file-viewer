import { WorkspaceFile } from '../types/file';
import { SearchCriteria, SearchFilters } from './SearchFilters';
import { SearchIndex, tokenize } from './SearchIndex';

export class FileSearch {
  /**
   * Analyzes file metadata and returns matching items scored by search relevance.
   * If query is empty, returns items filtered according to options using default ordering.
   */
  static search(
    index: SearchIndex,
    criteria: SearchCriteria
  ): { file: WorkspaceFile; score: number }[] {
    const query = criteria.query?.trim() || '';
    const allFiles = index.getAllFiles();

    // 1. Initial constraint checking: dates, files category, favorites, isRecent, size
    const candidates = allFiles.filter(file => SearchFilters.matches(file, criteria));

    // 2. Short-circuit if no text query is entered
    if (!query) {
      const sorted = SearchFilters.sort(
        candidates,
        criteria.sortBy || 'date',
        criteria.sortOrder || 'desc'
      );
      return sorted.map(file => ({ file, score: 1.0 }));
    }

    // 3. Calculate query token matches from name/tag inverted index
    const queryTokens = tokenize(query);
    const metaScores = index.queryMetadata(queryTokens);

    const scored = candidates.map(file => {
      let score = metaScores.get(file.id) || 0;

      // Bonus ranking scoring criteria for exact matches/prefixes
      const filename = file.name.toLowerCase();
      const qLower = query.toLowerCase();

      if (filename === qLower) {
        score += 150; // Exact filename match
      } else if (filename.startsWith(qLower)) {
        score += 75;  // Starts with prefix
      } else if (filename.includes(qLower)) {
        score += 35;  // Substring containment
      }

      // Small weight bonus to pinned items
      if (file.isPinned) {
        score += 10;
      }
      
      // Small weight bonus to favorited items
      if (file.isFavorite) {
        score += 5;
      }

      return { file, score };
    });

    // 4. Filter out items that had no match overlap with query string
    const results = scored.filter(item => item.score > 0);

    // 5. Final Sort handling
    if (!criteria.sortBy || criteria.sortBy === 'relevance') {
      // Primary search sorting by descending relevance values
      results.sort((a, b) => b.score - a.score);
    } else {
      // Secondary sorting by requested property (date, size, etc.)
      const sortedFiles = SearchFilters.sort(
        results.map(r => r.file),
        criteria.sortBy,
        criteria.sortOrder || 'desc'
      );
      return sortedFiles.map(file => ({
        file,
        score: results.find(r => r.file.id === file.id)?.score || 0
      }));
    }

    return results;
  }
}
