import { WorkspaceFile } from '../types/file';

export interface SearchCriteria {
  query?: string;
  category?: string;       // e.g. 'all', 'pdf', 'image', 'audio', 'video', 'doc', 'code', 'zip', 'other'
  extension?: string;      // e.g. '.pdf', '.docx'
  tags?: string[];
  isFavorite?: boolean;
  isRecent?: boolean;
  minSize?: number;        // bytes
  maxSize?: number;        // bytes
  startDate?: number;      // milliseconds timestamp
  endDate?: number;        // milliseconds timestamp
  sortBy?: 'relevance' | 'name' | 'size' | 'date' | 'accessed';
  sortOrder?: 'asc' | 'desc';
}

export class SearchFilters {
  /**
   * Evaluates whether a given WorkspaceFile satisfies the specified SearchCriteria.
   */
  static matches(file: WorkspaceFile, criteria: SearchCriteria): boolean {
    // 1. Category filter
    if (criteria.category && criteria.category !== 'all') {
      if (file.category?.toLowerCase() !== criteria.category.toLowerCase()) {
        return false;
      }
    }

    // 2. Extension filter
    if (criteria.extension) {
      const ext = criteria.extension.toLowerCase();
      const fileNameLower = file.name.toLowerCase();
      if (!fileNameLower.endsWith(ext) && !fileNameLower.endsWith('.' + ext)) {
        return false;
      }
    }

    // 3. Favorites only
    if (criteria.isFavorite && !file.isFavorite) {
      return false;
    }

    // 4. Recent only (accessed or modified within 7 days, or isPinned)
    if (criteria.isRecent) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const fileTime = file.lastAccessedAt || file.lastModified || 0;
      if (fileTime < sevenDaysAgo && !file.isPinned) {
        return false;
      }
    }

    // 5. Size Range
    if (criteria.minSize !== undefined && (file.size || 0) < criteria.minSize) {
      return false;
    }
    if (criteria.maxSize !== undefined && (file.size || 0) > criteria.maxSize) {
      return false;
    }

    // 6. Date Range
    const modTime = file.lastModified || 0;
    if (criteria.startDate !== undefined && modTime < criteria.startDate) {
      return false;
    }
    if (criteria.endDate !== undefined && modTime > criteria.endDate) {
      return false;
    }

    // 7. Tags filter
    if (criteria.tags && criteria.tags.length > 0) {
      const fileTags = file.tags || [];
      const hasAllTags = criteria.tags.every(t => 
        fileTags.some((ft: string) => ft.toLowerCase() === t.toLowerCase())
      );
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sorts the matched search results based on the chosen sort parameters.
   */
  static sort(files: WorkspaceFile[], sortBy: SearchCriteria['sortBy'] = 'relevance', sortOrder: SearchCriteria['sortOrder'] = 'desc'): WorkspaceFile[] {
    const sorted = [...files];
    const coefficient = sortOrder === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return coefficient * a.name.localeCompare(b.name);
      }
      if (sortBy === 'size') {
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        return coefficient * (sizeA - sizeB);
      }
      if (sortBy === 'date') {
        const dateA = a.lastModified || 0;
        const dateB = b.lastModified || 0;
        return coefficient * (dateA - dateB);
      }
      if (sortBy === 'accessed') {
        const accA = a.lastAccessedAt || a.lastModified || 0;
        const accB = b.lastAccessedAt || b.lastModified || 0;
        return coefficient * (accA - accB);
      }
      // Relevance is handled externally during scoring, so default to recency sort if equal relevance
      const tA = a.lastModified || 0;
      const tB = b.lastModified || 0;
      return coefficient * (tA - tB);
    });

    return sorted;
  }
}
