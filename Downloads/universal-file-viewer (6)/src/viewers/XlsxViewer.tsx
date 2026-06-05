import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

export const XlsxViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<any>(null);

  // Search States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ r: number, c: number }[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Virtualization States
  const ROW_HEIGHT = 40;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // Safe utility to parse sheet dates into beautifully formatted human-readable strings
  const formatCellValue = useCallback((val: any): string => {
    if (val instanceof Date && !isNaN(val.getTime())) {
      const day = String(val.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[val.getMonth()];
      const year = val.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return val !== undefined ? String(val) : '';
  }, []);

  // Set up container size listener for virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height || 600);
      }
    });
    observer.observe(el);
    setContainerHeight(el.clientHeight || 600);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSearchTerm('');
    setSearchResults([]);
    setCurrentIndex(-1);
    setScrollTop(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    
    const loadWorkbook = async () => {
      try {
        let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
        if (!finalBlob && file.uri) {
          const res = await fetch(file.uri);
          finalBlob = await res.blob();
        }
        if (!finalBlob) {
          throw new Error('File content is unavailable.');
        }

        const buffer = await finalBlob.arrayBuffer();
        // Option cellDates: true parses dates as real Date objects
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true, cellNF: true, cellText: true });
        
        if (wb.SheetNames.length === 0) {
          throw new Error('No sheets found in workbook.');
        }

        setWorkbook(wb);
        setSheets(wb.SheetNames);
        setActiveTab(wb.SheetNames[0]);
        
        // Parse active tab (raw: false guarantees sheet formats like dates, currencies, and percentages are natively formatted)
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];
        setSheetData(json);
      } catch (err: any) {
        console.error('[XlsxViewer] Error parsing workbook:', err);
        setError(err.message || 'An error occurred while opening the spreadsheet.');
      } finally {
        setLoading(false);
      }
    };

    loadWorkbook();
  }, [file]);

  const selectSheet = (sheetName: string) => {
    if (!workbook) return;
    setActiveTab(sheetName);
    setSearchTerm('');
    setSearchResults([]);
    setCurrentIndex(-1);
    setScrollTop(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    try {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];
      setSheetData(json);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Generate column labels (A, B, C...) based on max row length
  const maxCols = sheetData.reduce((max, row) => Math.max(max, row ? row.length : 0), 0);
  const colLabels = Array.from({ length: Math.max(5, maxCols) }, (_, i) => {
    let label = '';
    let temp = i;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  });

  // Recompute search matches when filter term or sheetData changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentIndex(-1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results: { r: number, c: number }[] = [];

    sheetData.forEach((row, r) => {
      if (!row) return;
      colLabels.forEach((_, c) => {
        const value = row[c];
        const text = formatCellValue(value).toLowerCase();
        if (text.includes(term)) {
          results.push({ r, c });
        }
      });
    });

    setSearchResults(results);
    setCurrentIndex(results.length > 0 ? 0 : -1);
  }, [searchTerm, sheetData, colLabels, formatCellValue]);

  // Handle smooth alignment scrolling and virtualization synchronization when active search match index changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < searchResults.length) {
      const match = searchResults[currentIndex];
      
      // Bring row index into the visible virtualization viewport if not currently rendered
      if (containerRef.current) {
        const targetScrollTop = match.r * ROW_HEIGHT;
        const currentScrollTop = containerRef.current.scrollTop;
        if (
          targetScrollTop < currentScrollTop + ROW_HEIGHT || 
          targetScrollTop > currentScrollTop + containerHeight - ROW_HEIGHT * 2
        ) {
          containerRef.current.scrollTop = Math.max(0, targetScrollTop - (containerHeight / 2) + (ROW_HEIGHT / 2));
        }
      }

      // Smooth horizontal alignment scrolling once rendered in the DOM
      const timer = setTimeout(() => {
        const el = document.getElementById(`cell-${match.r}-${match.c}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, searchResults, containerHeight]);

  // Virtualization Calculations
  const overscan = 10;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const endIndex = Math.min(sheetData.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan);

  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = Math.max(0, (sheetData.length - endIndex) * ROW_HEIGHT);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading spreadsheet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load Spreadsheet</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white bg-[#121212]' : 'text-black bg-white'}`}>
      {/* Search Bar Utility Controls */}
      <div className={`flex items-center gap-2 p-2 px-4 border-b ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            id="xlsx-search-input"
            type="text"
            placeholder="Search in spreadsheet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
              isDark 
                ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-blue-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          {searchTerm && (
            <button
              id="xlsx-clear-search-btn"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-gray-500 dark:text-zinc-400 px-2 font-mono">
              {currentIndex + 1} of {searchResults.length}
            </span>
            <button
              id="xlsx-prev-search-btn"
              onClick={() => setCurrentIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)}
              className={`p-1.5 rounded-lg border ${
                isDark 
                  ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-gray-200' 
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              }`}
              title="Previous match"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              id="xlsx-next-search-btn"
              onClick={() => setCurrentIndex(prev => (prev + 1) % searchResults.length)}
              className={`p-1.5 rounded-lg border ${
                isDark 
                  ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-gray-200' 
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              }`}
              title="Next match"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {searchTerm && searchResults.length === 0 && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium shrink-0">
            No matches found
          </span>
        )}
      </div>

      {/* Spreadsheet Grid Content with Pinned Sticky Header Row and Pinned Sticky Start Column */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-white dark:bg-[#121212] p-0 relative"
      >
        <table className="min-w-full border-separate border-spacing-0 text-sm table-fixed">
          <thead>
            <tr style={{ height: 40 }}>
              <th className="border-b border-r border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 w-12 text-center text-gray-500 font-medium sticky top-0 left-0 z-30"></th>
              {colLabels.map(c => (
                <th 
                  key={c} 
                  className="border-b border-r border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 text-center font-semibold w-32 min-w-[8rem] truncate text-gray-600 dark:text-gray-300 sticky top-0 z-20"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.length === 0 ? (
              <tr>
                <td colSpan={colLabels.length + 1} className="p-8 text-center text-gray-500 italic">This sheet is empty.</td>
              </tr>
            ) : (
              <>
                {/* Virtualization Padding Spacers */}
                {paddingTop > 0 && (
                  <tr style={{ height: paddingTop }}>
                    <td colSpan={colLabels.length + 1} style={{ height: paddingTop, padding: 0, border: 0 }} className="bg-transparent" />
                  </tr>
                )}

                {/* Sliced Visible Window Rows */}
                {sheetData.slice(startIndex, endIndex).map((row, index) => {
                  const rowIdx = startIndex + index;
                  return (
                    <tr key={rowIdx} style={{ height: ROW_HEIGHT }}>
                      <td className="border-b border-r border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 text-center text-gray-500 font-semibold w-12 sticky left-0 z-10">
                        {rowIdx + 1}
                      </td>
                      {colLabels.map((_, colIdx) => {
                        const value = row ? row[colIdx] : undefined;
                        const formattedVal = formatCellValue(value);

                        // Check search matching conditions for this cell
                        const isMatchNode = searchResults.some(res => res.r === rowIdx && res.c === colIdx);
                        const isActiveMatch = currentIndex >= 0 && searchResults[currentIndex]?.r === rowIdx && searchResults[currentIndex]?.c === colIdx;
                        
                        let bgClass = 'bg-white dark:bg-[#141414] text-[#1f1f1f] dark:text-[#e0e0e0]';
                        if (isActiveMatch) {
                          bgClass = 'bg-amber-400 text-black dark:bg-amber-400 dark:text-black font-semibold ring-2 ring-amber-600 ring-offset-1 dark:ring-offset-zinc-900 z-10';
                        } else if (isMatchNode) {
                          bgClass = 'bg-yellow-200/60 dark:bg-yellow-500/30 text-inherit';
                        }

                        return (
                          <td 
                            key={colIdx} 
                            id={`cell-${rowIdx}-${colIdx}`}
                            className={`border-b border-r border-gray-300 dark:border-gray-700 p-2 truncate max-w-[8rem] transition-colors ${bgClass}`}
                            title={formattedVal}
                            style={{ height: ROW_HEIGHT }}
                          >
                            {formattedVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {paddingBottom > 0 && (
                  <tr style={{ height: paddingBottom }}>
                    <td colSpan={colLabels.length + 1} style={{ height: paddingBottom, padding: 0, border: 0 }} className="bg-transparent" />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Sheets / Tabs Panel */}
      {sheets.length > 1 && (
        <div className="flex border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 overflow-x-auto select-none">
          {sheets.map(s => (
            <button 
              key={s} 
              id={`sheet-tab-${s}`}
              onClick={() => selectSheet(s)}
              className={`px-4 py-2 text-sm border-r border-gray-300 dark:border-gray-700 shrink-0 transition-colors duration-150 font-medium ${
                activeTab === s 
                  ? 'bg-white dark:bg-[#141414] text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-500' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default XlsxViewer;
