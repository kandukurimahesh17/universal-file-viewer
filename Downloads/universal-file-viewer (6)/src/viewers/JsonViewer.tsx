import React, { useState, useEffect } from 'react';

export const JsonViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const loadJson = async () => {
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
        // Try to format it for high quality aesthetics
        try {
          const parsed = JSON.parse(text);
          setContent(JSON.stringify(parsed, null, 2));
        } catch {
          // If not valid JSON, show raw text
          setContent(text);
        }
      } catch (err: any) {
        console.error('[JsonViewer] Error loading JSON:', err);
        setError(err.message || 'An error occurred while opening the JSON file.');
      } finally {
        setLoading(false);
      }
    };

    loadJson();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading JSON...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load JSON</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-blue-400 bg-black' : 'text-blue-700 bg-gray-50'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <span className="font-semibold text-sm">JSON Viewer</span>
        <span className="text-xs text-gray-500">Formatted View</span>
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre">
        {content}
      </div>
    </div>
  );
};

export default JsonViewer;
