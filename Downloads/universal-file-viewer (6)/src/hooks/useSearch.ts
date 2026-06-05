import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkspaceFile } from '../types/file';
import { SearchEngine, SearchResults } from '../search/SearchEngine';
import { SearchCriteria } from '../search/SearchFilters';

export const useSearch = (files: WorkspaceFile[]) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Default filters
  const [criteria, setCriteria] = useState<SearchCriteria>({
    category: 'all',
    extension: '',
    isFavorite: false,
    isRecent: false,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Combined Results holding both name hits and textual highlights
  const [results, setResults] = useState<SearchResults>({
    metadataMatches: [],
    contentMatches: [],
    combinedCount: 0
  });

  // 1. Keep SearchIndex in perfect synchronization with standard workspace file state
  useEffect(() => {
    if (files && files.length > 0) {
      SearchEngine.initialize(files).then(() => {
        // Run an initial search to populate matches matching current constraints
        performSearch(query, criteria);
      });
    } else {
      SearchEngine.initialize([]);
      setResults({ metadataMatches: [], contentMatches: [], combinedCount: 0 });
    }
  }, [files]);

  // Sync search history on mount
  useEffect(() => {
    setHistory(SearchEngine.getSearchHistory());
  }, []);

  // 2. Perform execution sync
  const performSearch = useCallback((currentQuery: string, currentCriteria: SearchCriteria) => {
    setIsSearching(true);
    try {
      const searchParams: SearchCriteria = {
        ...currentCriteria,
        query: currentQuery
      };
      const response = SearchEngine.executeSearch(searchParams);
      setResults(response);
      setSuggestions(SearchEngine.getSuggestions(currentQuery));
      // Refresh current history in case additions occurred
      setHistory(SearchEngine.getSearchHistory());
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 3. Debounce keyboard input query search
  const debounceRef = useRef<any>(null);
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, criteria);
    }, 180); // ultra-fast 180ms debounce for natural feel

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, criteria, performSearch]);

  // Filter setters
  const setCategoryFilter = useCallback((category: string) => {
    setCriteria(prev => ({ ...prev, category }));
  }, []);

  const setExtensionFilter = useCallback((extension: string) => {
    setCriteria(prev => ({ ...prev, extension }));
  }, []);

  const setSortOption = useCallback((sortBy: SearchCriteria['sortBy'], sortOrder: SearchCriteria['sortOrder'] = 'desc') => {
    setCriteria(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const toggleFavoriteFilter = useCallback(() => {
    setCriteria(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
  }, []);

  const toggleRecentFilter = useCallback(() => {
    setCriteria(prev => ({ ...prev, isRecent: !prev.isRecent }));
  }, []);

  const selectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, []);

  const clearHistory = useCallback(() => {
    SearchEngine.clearSearchHistory();
    setHistory([]);
  }, []);

  const resetFilters = useCallback(() => {
    setCriteria({
      category: 'all',
      extension: '',
      isFavorite: false,
      isRecent: false,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  }, []);

  return {
    query,
    setQuery,
    criteria,
    setCriteria,
    results,
    suggestions,
    history,
    isSearching,
    setCategoryFilter,
    setExtensionFilter,
    setSortOption,
    toggleFavoriteFilter,
    toggleRecentFilter,
    selectSuggestion,
    clearHistory,
    resetFilters,
  };
};

export default useSearch;
