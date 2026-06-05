import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import mammoth from 'mammoth';
import { 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Printer, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  RefreshCw,
  X,
  Sliders,
  Type,
  Maximize2,
  Minimize2,
  FileText
} from 'lucide-react';

interface DocxViewerProps {
  file?: any; // WorkspaceFile
  isDark?: boolean;
}

type MarginType = 'standard' | 'narrow' | 'wide' | 'none';
type WidthType = 'a4' | 'letter' | 'reading' | 'full';
type SpacingType = 'tight' | 'standard' | 'onehalf' | 'double';
type ThemeType = 'default' | 'ivory' | 'sepia' | 'dark';

export const DocxViewer: React.FC<DocxViewerProps> = ({ file, isDark }) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  
  // Custom reading experience states
  const [marginSize, setMarginSize] = useState<MarginType>('standard');
  const [widthMode, setWidthMode] = useState<WidthType>('a4');
  const [lineSpacing, setLineSpacing] = useState<SpacingType>('standard');
  const [paperTheme, setPaperTheme] = useState<ThemeType>('default');
  const [showLayoutOptions, setShowLayoutOptions] = useState<boolean>(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  // Load and convert file
  const loadAndConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setRenderedHtml('');
    
    try {
      let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
      if (!finalBlob && file.uri) {
        const res = await fetch(Capacitor.convertFileSrc(file.uri));
        finalBlob = await res.blob();
      }
      
      if (!finalBlob) {
        throw new Error('File content blob is unavailable.');
      }
      
      const buffer = await finalBlob.arrayBuffer();
      // Use mammoth to convert DOCX ArrayBuffer to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      
      setRenderedHtml(result.value || '<p class="text-zinc-500 italic">This document is empty.</p>');
    } catch (err: any) {
      console.error('[DocxViewer] rendering failed:', err);
      setError(err.message || 'An error occurred while parsing the DOCX file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndConvert();
  }, [file]);

  // Handle Search match highlighting
  // Splitting by tags ensures we do not match or substitute query terms inside HTML properties or tag names
  const getHighlightedHtml = () => {
    if (!searchQuery.trim() || !renderedHtml) return renderedHtml;

    try {
      const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      
      const parts = renderedHtml.split(/(<[^>]+>)/);
      const highlightedParts = parts.map((part) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          return part; // do not touch elements/tags
        }
        return part.replace(regex, '<mark class="docx-search-match">$1</mark>');
      });
      
      return highlightedParts.join('');
    } catch (err) {
      console.error('[DocxViewer] Search highlight failed:', err);
      return renderedHtml;
    }
  };

  // Synchronize highlights count and scroll active matches into view
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      const marks = document.querySelectorAll('#docx-rendered-container mark.docx-search-match');
      setTotalMatches(marks.length);

      if (marks.length === 0) {
        setCurrentMatchIndex(0);
        return;
      }

      // Ensure index is bound
      let targetIndex = currentMatchIndex;
      if (targetIndex >= marks.length) {
        targetIndex = 0;
        setCurrentMatchIndex(0);
      }

      // Mark the active one
      marks.forEach((mark, index) => {
        if (index === targetIndex) {
          mark.classList.add('active-search-match');
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          mark.classList.remove('active-search-match');
        }
      });
    }, 60);

    return () => clearTimeout(timer);
  }, [searchQuery, currentMatchIndex, renderedHtml]);

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextMatch();
    }
  };

  // Print DOCX content safely inside iframe to preserve UI and exact formatting choices
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${file?.name || 'Document'}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                padding: 2.5cm;
                line-height: ${lineSpacing === 'tight' ? '1.2' : lineSpacing === 'standard' ? '1.5' : lineSpacing === 'onehalf' ? '1.8' : '2.2'};
                color: #1e293b;
                background-color: #ffffff;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #0f172a;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                font-weight: 700;
              }
              h1 { font-size: 2.25em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
              h2 { font-size: 1.75em; }
              h3 { font-size: 1.35em; }
              p { margin-bottom: 1.1em; text-align: justify; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 2em 0;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #f8fafc;
                font-weight: 600;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1.5cm auto;
                border-radius: 4px;
              }
              ul, ol {
                margin-bottom: 1.2em;
                padding-left: 2em;
              }
              li { margin-bottom: 0.4em; }
              a {
                color: #2563eb;
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="docx-print-content">${renderedHtml}</div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  // Download File Blob
  const handleDownload = () => {
    if (!file?.blob || !(file.blob instanceof Blob)) return;
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || 'document.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.4));
  const handleZoomReset = () => setZoom(1.0);

  // Map settings to explicit Tailwind structure/values
  const getMarginClass = () => {
    switch (marginSize) {
      case 'none': return 'p-2 md:p-4';
      case 'narrow': return 'p-4 md:p-8';
      case 'wide': return 'p-8 md:p-20';
      case 'standard':
      default:
        return 'p-6 md:p-14';
    }
  };

  const getWidthStyle = () => {
    switch (widthMode) {
      case 'full': return 'max-w-full';
      case 'reading': return 'max-w-2xl';
      case 'letter': return 'max-w-[740px]';
      case 'a4':
      default:
        return 'max-w-[820px]';
    }
  };

  const getSpacingClass = () => {
    switch (lineSpacing) {
      case 'tight': return 'line-spacing-tight';
      case 'onehalf': return 'line-spacing-onehalf';
      case 'double': return 'line-spacing-double';
      case 'standard':
      default:
        return 'line-spacing-standard';
    }
  };

  const getThemeClass = () => {
    switch (paperTheme) {
      case 'ivory': return 'bg-[#fefcf8] text-amber-950 border-[#f2eae1]';
      case 'sepia': return 'bg-[#FAF4EB] text-amber-900 border-[#eddcc5]';
      case 'dark': return 'bg-[#121214] text-zinc-200 border-zinc-800';
      case 'default':
      default:
        return isDark 
          ? 'bg-zinc-900 text-zinc-100 border-zinc-800' 
          : 'bg-white text-zinc-850 border-zinc-200';
    }
  };

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-zinc-100 bg-zinc-950' : 'text-zinc-800 bg-zinc-50'}`}>
      {/* Dynamic Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 border-b shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm`}>
        <div className="flex items-center gap-2 pl-1 overflow-hidden">
          <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-indigo-950/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-sm font-semibold truncate leading-none">{file?.name || 'Document'}</h1>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">{(file?.size ? (file.size / 1024).toFixed(1) + ' KB' : 'DOCX Document')}</p>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Toggle / Box */}
          {isSearchActive ? (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Find in document..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                className="bg-transparent focus:outline-none w-32 sm:w-48 text-zinc-900 dark:text-zinc-100 font-sans"
                autoFocus
              />
              {totalMatches > 0 && (
                <span className="text-[10px] text-zinc-400 font-mono px-1">
                  {currentMatchIndex + 1}/{totalMatches}
                </span>
              )}
              <div className="flex items-center border-l dark:border-zinc-800 pl-1.5 ml-1 gap-1">
                <button 
                  onClick={handlePrevMatch} 
                  disabled={totalMatches === 0}
                  className="p-1 hover:bg-zinc-800 rounded disabled:opacity-40"
                  title="Previous match"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={handleNextMatch} 
                  disabled={totalMatches === 0}
                  className="p-1 hover:bg-zinc-800 rounded disabled:opacity-40"
                  title="Next match"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    setIsSearchActive(false);
                    setSearchQuery('');
                  }} 
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsSearchActive(true)}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
              title="Search Text"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Find</span>
            </button>
          )}

          {/* Layout settings toggle */}
          <button 
            onClick={() => setShowLayoutOptions(!showLayoutOptions)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${showLayoutOptions ? 'bg-indigo-600 text-white' : (isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700')}`}
            title="Page & Layout Settings"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden md:inline">Layout Options</span>
          </button>

          {/* Zoom controls */}
          <div className={`flex items-center rounded-lg border overflow-hidden ${isDark ? 'border-zinc-800 bg-zinc-800' : 'border-zinc-200 bg-zinc-100'}`}>
            <button 
              onClick={handleZoomOut}
              className={`p-2 hover:bg-opacity-85 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomReset} 
              className={`px-3 py-1 text-xs font-mono select-none ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button 
              onClick={handleZoomIn}
              className={`p-2 hover:bg-opacity-85 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action Tools */}
          <button 
            onClick={handlePrint}
            title="Print Document"
            className={`p-2 rounded-lg transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
          >
            <Printer className="w-4 h-4" />
          </button>

          {file?.blob && file.blob instanceof Blob && (
            <button 
              onClick={handleDownload}
              title="Download Original file"
              className={`p-2 rounded-lg text-xs font-semibold gap-1 flex items-center transition md:px-3 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Layout Settings panel */}
      {showLayoutOptions && !loading && !error && (
        <div className={`p-3 border-b shrink-0 transition flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-4 ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'}`}>
          {/* Width Type Selector */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Page Scale & Width</span>
            <div className={`flex rounded-lg border p-0.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
              {(['a4', 'letter', 'reading', 'full'] as WidthType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWidthMode(w)}
                  className={`flex-1 text-[11px] px-2 py-1 font-semibold rounded-md capitalize transition ${
                    widthMode === w 
                      ? 'bg-indigo-600 text-white' 
                      : `text-zinc-500 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Margins Type Selector */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Page Margins</span>
            <div className={`flex rounded-lg border p-0.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
              {(['standard', 'narrow', 'wide', 'none'] as MarginType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarginSize(m)}
                  className={`flex-1 text-[11px] px-2 py-1 font-semibold rounded-md capitalize transition ${
                    marginSize === m 
                      ? 'bg-indigo-600 text-white' 
                      : `text-zinc-500 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing Selector */}
          <div className="flex flex-col gap-1.5 min-w-[155px]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Line Spacing</span>
            <div className={`flex rounded-lg border p-0.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
              {(['tight', 'standard', 'onehalf', 'double'] as SpacingType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLineSpacing(s)}
                  className={`flex-1 text-[11px] px-1.5 py-1 font-semibold rounded-md transition ${
                    lineSpacing === s 
                      ? 'bg-indigo-600 text-white' 
                      : `text-zinc-500 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
                  }`}
                >
                  {s === 'tight' ? 'Tight' : s === 'standard' ? '1.15x' : s === 'onehalf' ? '1.5x' : '2.0x'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Paper Color Theme</span>
            <div className={`flex rounded-lg border p-0.5 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
              {(['default', 'ivory', 'sepia', 'dark'] as ThemeType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPaperTheme(t)}
                  className={`flex-1 text-[11px] px-2 py-1 font-semibold rounded-md capitalize transition ${
                    paperTheme === t 
                      ? 'bg-indigo-600 text-white' 
                      : `text-zinc-500 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`
                  }`}
                >
                  {t === 'default' ? 'Default' : t === 'dark' ? 'Night' : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main rendering stage */}
      <div className={`flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start ${isDark ? 'bg-zinc-950/40' : 'bg-zinc-200/50'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3 m-auto select-none">
            <RefreshCw className="w-8 h-8 text-indigo-550 animate-spin" style={{ color: '#6366f1' }} />
            <p className="text-sm text-zinc-500 font-medium">Parsing and formatting DOCX document...</p>
          </div>
        ) : error ? (
          <div className={`max-w-md p-6 rounded-2xl border text-center m-auto flex flex-col items-center gap-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-lg`}>
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <h3 className="font-bold text-lg">Unable to render document</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{error}</p>
            <button 
              onClick={loadAndConvert}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center">
            {/* Page Canvas Container with dynamic scale */}
            <div 
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${100 / zoom}%`,
                transition: 'transform 0.1s ease-out'
              }}
              className={`mx-auto ${getWidthStyle()} transition-all`}
            >
              <div 
                id="docx-rendered-container"
                dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
                className={`docx-content shadow-xl w-full border rounded-xl font-sans transition-all duration-200 ${getMarginClass()} ${getThemeClass()} ${getSpacingClass()}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Built-in Custom CSS injections specifically targeting docx html tags rendering */}
      <style>{`
        /* Core spacing styles */
        .line-spacing-tight p {
          line-height: 1.25 !important;
          margin-bottom: 0.75rem !important;
        }
        .line-spacing-standard p {
          line-height: 1.55 !important;
          margin-bottom: 1rem !important;
        }
        .line-spacing-onehalf p {
          line-height: 1.85 !important;
          margin-bottom: 1.3rem !important;
        }
        .line-spacing-double p {
          line-height: 2.25 !important;
          margin-bottom: 1.75rem !important;
        }

        .docx-content {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          word-break: break-word;
          min-height: 297mm; /* Simulate A4 page proportions */
        }
        
        .docx-content h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-top: 1.755rem;
          margin-bottom: 0.85rem;
          color: inherit;
          border-bottom: 1px solid rgba(120, 120, 120, 0.2);
          padding-bottom: 0.35rem;
          line-height: 1.25;
        }
        
        .docx-content h2 {
          font-size: 1.65rem;
          font-weight: 750;
          margin-top: 1.6rem;
          margin-bottom: 0.75rem;
          color: inherit;
          line-height: 1.3;
        }
        
        .docx-content h3 {
          font-size: 1.35rem;
          font-weight: 700;
          margin-top: 1.35rem;
          margin-bottom: 0.6rem;
          color: inherit;
          line-height: 1.35;
        }
        
        .docx-content h4 {
          font-size: 1.15rem;
          font-weight: 650;
          margin-top: 1.2rem;
          margin-bottom: 0.5rem;
          color: inherit;
          line-height: 1.4;
        }
        
        .docx-content p {
          margin-top: 0px;
          color: inherit;
          font-size: 1rem;
        }
        
        /* Table Layout Improvements so tables fit correctly inside margins and width sets */
        .docx-content table {
          border-collapse: collapse;
          width: 100% !important;
          margin: 1.750rem 0;
          font-size: 0.9rem;
          overflow-x: auto;
          display: block;
          max-width: 100%;
        }
        
        .docx-content th, .docx-content td {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(120, 120, 120, 0.35);
          text-align: left;
          min-width: 90px;
          line-height: 1.4;
        }
        
        .docx-content th {
          background-color: rgba(120, 120, 120, 0.08);
          font-weight: 600;
        }
        
        /* Lists layouts */
        .docx-content ul {
          list-style-type: disc !important;
          padding-left: 2.25rem;
          margin-bottom: 1.1rem;
          line-height: 1.5;
        }
        
        .docx-content ol {
          list-style-type: decimal !important;
          padding-left: 2.25rem;
          margin-bottom: 1.1rem;
          line-height: 1.5;
        }
        
        .docx-content li {
          margin-bottom: 0.45rem;
          margin-top: 0px;
          color: inherit;
        }
        
        .docx-content li p {
          display: inline;
          margin: 0px !important;
          line-height: inherit !important;
        }
        
        .docx-content strong {
          font-weight: 700;
        }
        
        .docx-content em {
          font-style: italic;
        }
        
        .docx-content img {
          max-width: 100%;
          height: auto !important;
          border-radius: 0.375rem;
          display: block;
          margin: 1.5rem auto;
          box-shadow: 0 4px 10px rgb(0 0 0 / 0.08);
        }
        
        .docx-content a {
          color: #6366f1;
          text-decoration: underline;
          text-decoration-thickness: 1px;
          transition: color 0.15s ease;
        }
        
        .docx-content a:hover {
          color: #4f46e5;
        }
        
        /* Highlight Marks for text content search matchers */
        .docx-content mark.docx-search-match {
          background-color: #fef08a;
          color: #1c1917;
          border-radius: 0.125rem;
          padding: 0.05rem 0.15rem;
          transition: all 0.15s ease;
        }
        
        .docx-content mark.docx-search-match.active-search-match {
          background-color: #f97316 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.45);
        }
        
        .dark .docx-content mark.docx-search-match {
          background-color: #854d0e;
          color: #fef08a;
        }
        
        .dark .docx-content mark.docx-search-match.active-search-match {
          background-color: #ea580c !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default DocxViewer;
