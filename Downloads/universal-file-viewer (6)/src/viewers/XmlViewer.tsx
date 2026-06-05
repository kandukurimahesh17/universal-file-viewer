import React, { useState, useEffect } from 'react';

export const XmlViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const loadXml = async () => {
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
        console.error('[XmlViewer] Error loading XML:', err);
        setError(err.message || 'An error occurred while opening the XML file.');
      } finally {
        setLoading(false);
      }
    };

    loadXml();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading XML...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load XML</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-green-400 bg-black' : 'text-green-700 bg-gray-50'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <span className="font-semibold text-sm">XML Viewer</span>
        <span className="text-xs text-gray-500">Raw Source</span>
      </div>
      <div className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre">
        {content}
      </div>
    </div>
  );
};

export default XmlViewer;
