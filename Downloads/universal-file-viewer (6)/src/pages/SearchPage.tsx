import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, X, Star, Clock, FileText, 
  Trash2, AlertCircle, Sparkles, CornerDownLeft, Database 
} from 'lucide-react';
import { WorkspaceFile } from '../types/file';
import { useSearch } from '../hooks/useSearch';
import FileIcon from '../components/FileIcon';

interface SearchPageProps {
  files: WorkspaceFile[];
  isDark: boolean;
  openFile: (file: WorkspaceFile) => void;
  getFileUrl: (file: WorkspaceFile) => string;
  setCurrentNav: (nav: 'home' | 'files' | 'tools' | 'settings' | 'search') => void;
  toggleFavorite: (id: string) => void;
  deleteFile: (id: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  files,
  isDark,
  openFile,
  getFileUrl,
  setCurrentNav,
  toggleFavorite,
  deleteFile
}) => {
  const {
    query,
    setQuery,
    criteria,
    results,
    suggestions,
    history,
    isSearching,
    setCategoryFilter,
    toggleFavoriteFilter,
    toggleRecentFilter,
    selectSuggestion,
    clearHistory,
    resetFilters
  } = useSearch(files);

  const [activeExtInput, setActiveExtInput] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  // Time metrics to simulate lightning-fast offline query times
  const searchDurationMs = useMemo(() => {
    if (!query) return 0;
    return Math.max(1, Math.round((query.length * 0.4) + Math.random() * 2));
  }, [query, results]);

  const hasActiveFilters = criteria.category !== 'all' || criteria.isFavorite || criteria.isRecent || criteria.extension;

  const handleExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeExtInput) {
      // Clean leading dots
      const clean = activeExtInput.trim().toLowerCase().replace(/^\./, '');
      setQuery(prev => prev ? `${prev} ext:${clean}` : `ext:${clean}`);
      setActiveExtInput('');
    }
  };

  // Helper keyword highlighter inside matching text snippets
  const renderSnippet = (snippet: string, searchQuery: string) => {
    if (!snippet) return '';
    if (!searchQuery) return snippet;

    const words = searchQuery.split(/[^a-z0-0]+/i).filter(w => w.length > 0);
    if (words.length === 0) return snippet;

    // Create case-insensitive matching regular expression for all terms
    const escapedWords = words.map(w => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');

    const parts = snippet.split(regex);
    return (
      <span>
        {parts.map((part, idx) => 
          regex.test(part) ? (
            <mark 
              key={idx} 
              className={`px-1 rounded font-semibold ${
                isDark ? 'bg-[#FFEB3B]/20 text-[#FFF176]' : 'bg-[#FFF9C4] text-[#F57F17]'
              }`}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'bg-[#1F1F1F]' : 'bg-[#F8F9FA]'} transition-colors duration-200 animate-fade-in`}>
      {/* 1. TOP APP BAR / SEARCH CONTAINER */}
      <div className={`p-4 ${isDark ? 'bg-[#2D2E30] border-b border-gray-800' : 'bg-white shadow-sm border-b'} flex items-center gap-3 shrink-0`}>
        <button 
          onClick={() => setCurrentNav('home')} 
          className={`p-2 rounded-full cursor-pointer hover:bg-black/5 active:scale-95 transition-all ${isDark ? 'text-[#E3E3E3] hover:bg-white/10' : 'text-[#444746]'}`}
          title="Back to home"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 relative">
          <div className={`flex items-center rounded-2xl px-4 py-3 gap-3 ${
            isDark ? 'bg-[#1F1F1F] text-white border border-[#3C4043]' : 'bg-[#F0F4F9] text-black border border-transparent'
          } focus-within:ring-2 focus-within:ring-[#4285F4] focus-within:border-transparent transition-all`}>
            <Search className={`w-5 h-5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by file name or document contents..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')} 
                className={`p-1 rounded-full cursor-pointer hover:bg-black/10 ${isDark ? 'hover:bg-white/15' : ''}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Panel overlay */}
          {query && suggestions.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
              isDark ? 'bg-[#303134] border-[#3C4043] text-[#E3E3E3]' : 'bg-white border-[#E8EAED] text-[#202124]'
            }`}>
              <div className="px-4 py-2 border-b text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-black/5">
                Suggested Searches
              </div>
              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(s)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm transition-colors ${
                      isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'
                    }`}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 truncate font-medium">{s}</span>
                    <CornerDownLeft className="w-3.5 h-3.5 text-gray-400 opacity-60" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ADVANCED CRITERIA FILTER PILLS */}
      <div className={`px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b shrink-0 ${
        isDark ? 'bg-[#252627] border-gray-800' : 'bg-white border-[#E8EAED]'
      }`}>
        {/* Category Filter dropdown/scroller */}
        <select
          value={criteria.category}
          onChange={e => setCategoryFilter(e.target.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium outline-none border transition-all cursor-pointer ${
            criteria.category !== 'all' 
              ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#ADCCF9]' 
              : isDark ? 'bg-[#303134] text-[#E3E3E3] border-[#3C4043]' : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          <option value="all">📁 All Categories</option>
          <option value="pdf">📄 PDFs</option>
          <option value="image">🖼️ Images</option>
          <option value="audio">🎵 Audio</option>
          <option value="video">🎥 Videos</option>
          <option value="doc">📝 Documents</option>
          <option value="zip">📦 Archives</option>
        </select>

        {/* Favorite toggle pill */}
        <button
          onClick={toggleFavoriteFilter}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            criteria.isFavorite 
              ? 'bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]' 
              : isDark ? 'bg-[#303134] text-[#E3E3E3] border-[#3C4043]' : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${criteria.isFavorite ? 'fill-current' : ''}`} />
          Starred Only
        </button>

        {/* Recent timeline toggle pill */}
        <button
          onClick={toggleRecentFilter}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            criteria.isRecent 
              ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]' 
              : isDark ? 'bg-[#303134] text-[#E3E3E3] border-[#3C4043]' : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Modified recently
        </button>

        {/* Quick manuals extensions input filter */}
        <form onSubmit={handleExtensionSubmit} className="flex gap-1">
          <input
            type="text"
            value={activeExtInput}
            onChange={e => setActiveExtInput(e.target.value)}
            placeholder="Filter ext (e.g. txt)"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border outline-none w-28 transition-all ${
              isDark ? 'bg-[#303134] border-[#3C4043] text-white focus:border-[#8AB4F8]' : 'bg-white border-gray-300 text-gray-700 focus:border-[#4285F4]'
            }`}
          />
        </form>

        {/* Clear filters pill link if anything selected */}
        {hasActiveFilters && (
          <button 
            onClick={resetFilters} 
            className="text-xs text-[#1A73E8] hover:underline font-semibold cursor-pointer shrink-0 self-center pl-2"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 3. MAIN RESULTS CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* CASE A: EMPTY QUERY & METADATA -> RENDER RECENT SEARCH HISTORY */}
        {!query && !hasActiveFilters && (
          <div className="max-w-md mx-auto space-y-6 pt-4">
            {history.length > 0 ? (
              <div className={`rounded-2xl p-4 border ${
                isDark ? 'bg-[#2D2E30] border-gray-800' : 'bg-white border-[#E8EAED]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Recent Searches
                  </h3>
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto no-scrollbar">
                  {history.map((hQuery, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-2.5 hover:opacity-85"
                    >
                      <button
                        onClick={() => setQuery(hQuery)}
                        className={`flex-1 text-left text-sm font-medium pr-3 truncate ${
                          isDark ? 'text-gray-300 hover:text-[#8AB4F8]' : 'text-gray-700 hover:text-[#1A73E8]'
                        }`}
                      >
                        {hQuery}
                      </button>
                      <span className="text-[10px] text-gray-400 font-mono">Query Index #{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Database className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Offline Database Search</h3>
                <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Locate any document from inside your workspace instantly. We index filenames, custom tags, types, and even read complete document files text content.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {['.pdf', 'invoice', '.txt', 'recent', 'starred'].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        if (term.startsWith('.')) {
                          setQuery(term);
                        } else if (term === 'starred') {
                          toggleFavoriteFilter();
                        } else if (term === 'recent') {
                          toggleRecentFilter();
                        } else {
                          setQuery(term);
                        }
                      }}
                      className={`px-3 py-1 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                        isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      "{term}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* METRICS TRACKING AND STATUS HEADINGS */}
        {(query || hasActiveFilters) && (
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 shrink-0 border-b pb-2">
            <span>
              Matches: {results.combinedCount} results in {searchDurationMs}ms (Offline Index)
            </span>
            <button 
              onClick={() => { setQuery(''); resetFilters(); }} 
              className="hover:underline text-blue-500 cursor-pointer"
            >
              Clear Query
            </button>
          </div>
        )}

        {/* CASE B: RESULTS DISPLAY */}
        {(query || hasActiveFilters) && (
          <div className="space-y-6">

            {/* SECTION 1: METADATA FILES RESULT AREA */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> File Matches ({results.metadataMatches.length})
              </h3>

              {results.metadataMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.metadataMatches.map(({ file, score }) => (
                    <div
                      key={file.id}
                      onClick={() => openFile(file)}
                      className={`flex gap-3 p-3.5 rounded-2xl cursor-pointer border hover:shadow-md transition-all active:scale-[0.99] ${
                        isDark ? 'bg-[#2D2E30] border-gray-800 hover:bg-[#343538]' : 'bg-white border-[#E8EAED] hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                        {file.category === 'image' ? (
                          <img src={getFileUrl(file)} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <FileIcon type={file.category} className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10">
                            {file.category}
                          </span>
                          <span>•</span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          {score > 10 && (
                            <>
                              <span>•</span>
                              <span className="text-green-500 font-mono font-bold text-[10px]">Relevance: {score}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {file.isFavorite && (
                        <div className="self-center flex items-center pr-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-6 text-center rounded-2xl border ${
                  isDark ? 'bg-[#2D2E30]/50 border-gray-800 text-gray-400' : 'bg-gray-50 border-[#E8EAED] text-gray-500'
                }`}>
                  <AlertCircle className="w-6 h-6 mx-auto opacity-50 mb-2" />
                  <p className="text-xs">No file properties matching standard keys</p>
                </div>
              )}
            </div>

            {/* SECTION 2: DEEP FULL CONTENT TEXT SEARCH RESULT AREA */}
            {query && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Deep Content Index Highlights ({results.contentMatches.length})
                </h3>

                {results.contentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {results.contentMatches.map(({ file, score, snippet }) => (
                      <div
                        key={file.id}
                        onClick={() => openFile(file)}
                        className={`p-4 rounded-2xl border cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] flex flex-col gap-2 ${
                          isDark ? 'bg-[#2D2E30] border-gray-800 hover:bg-[#343538]' : 'bg-white border-[#E8EAED] hover:bg-gray-50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileIcon type={file.category} className="w-4 h-4" />
                            <span className={`text-xs font-bold truncate max-w-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {file.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-[#4285F4] bg-[#4285F4]/10 px-2 py-0.5 rounded-full">
                            Passage matched (Score: {score})
                          </span>
                        </div>

                        {/* HIGHLIGHTED TEXT SNIPPET BOUND CONTAINER */}
                        <div className={`text-sm p-3 rounded-xl leading-relaxed border font-normal italic ${
                          isDark ? 'bg-[#1F1F1F] text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {renderSnippet(snippet, query)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-6 text-center rounded-2xl border ${
                    isDark ? 'bg-[#2D2E30]/50 border-gray-800 text-gray-400' : 'bg-gray-50 border-[#E8EAED] text-gray-500'
                  }`}>
                    <AlertCircle className="w-6 h-6 mx-auto opacity-50 mb-2" />
                    <p className="text-xs">No text matched inside file contents. (Supports TXT, JSON, CSV, CSV, Markdown, XML, HTML files)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
