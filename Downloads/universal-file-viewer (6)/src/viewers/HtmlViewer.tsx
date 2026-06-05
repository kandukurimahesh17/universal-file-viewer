import React, { useState, useEffect } from 'react';

export const HtmlViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const loadHtml = async () => {
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
        console.error('[HtmlViewer] Error loading HTML:', err);
        setError(err.message || 'An error occurred while opening the HTML file.');
      } finally {
        setLoading(false);
      }
    };

    loadHtml();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading HTML...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load HTML</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white text-black">
      <div className="p-2 border-b border-gray-200 bg-gray-100 flex items-center gap-2">
        <span className="font-semibold text-sm">HTML Renderer</span>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <iframe 
          title="html-view" 
          srcDoc={content} 
          sandbox="allow-scripts"
          className="w-full h-full border-0 bg-white" 
        />
      </div>
    </div>
  );
};

export default HtmlViewer;
