import React, { useState, useEffect } from 'react';

export const TxtViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [content, setContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const loadText = async () => {
      try {
        let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
        if (!finalBlob && file.uri) {
          const res = await fetch(file.uri);
          finalBlob = await res.blob();
        }
        if (!finalBlob) {
          throw new Error('File content is unavailable.');
        }

        const text = await finalBlob.text();
        setContent(text);
      } catch (err: any) {
        console.error('[TxtViewer] Error loading text file:', err);
        setError(err.message || 'An error occurred while opening the text file.');
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading text content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load Text</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  const words = content.split(/\s+/).filter(w => w.length > 0).length;

  const getHighlightedContent = () => {
    if (!searchQuery.trim()) return content;
    const escaped = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return content.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-300 dark:bg-yellow-800 text-black dark:text-white px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white bg-[#1e1e1e]' : 'text-black bg-white'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
        <span className="text-sm font-medium">Text Viewer</span>
        <div className="flex items-center gap-4 text-xs">
          <span>{words} words</span>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none w-32 focus:w-48 transition-all" 
            />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {getHighlightedContent()}
      </div>
    </div>
  );
};

export default TxtViewer;
