import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceFile } from '../App';
import { init } from 'pptx-preview';

interface PptxViewerProps {
  file?: WorkspaceFile;
  isDark?: boolean;
}

export const PptxViewer: React.FC<PptxViewerProps> = ({ file, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const previewerRef = useRef<any>(null);
  
  useEffect(() => {
    if (!file?.blob || !(file.blob instanceof Blob) || !containerRef.current) return;
    setLoading(true);
    
    // Clear previous
    containerRef.current.innerHTML = '';
    
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '24px';
    div.style.alignItems = 'center';
    div.style.width = '100%';
    
    containerRef.current.appendChild(div);

    const parentWidth = containerRef.current.parentElement?.clientWidth || 800;
    const viewerWidth = Math.max(320, parentWidth - 48);

    // Initialize PPTX Previewer
    const previewer = init(div, {
      width: viewerWidth,
      mode: 'list' // Displays slides vertically to preserve scrolling
    });
    previewerRef.current = previewer;

    file.blob.arrayBuffer().then((buffer) => {
      previewer.preview(buffer).then(() => {
        setLoading(false);
      }).catch((err) => {
        console.error('Failed to preview PPTX:', err);
        setLoading(false);
      });
    }).catch((err) => {
      console.error('Failed to read file as ArrayBuffer:', err);
      setLoading(false);
    });

    return () => {
      previewerRef.current?.destroy();
      previewerRef.current = null;
    };
  }, [file]);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white bg-[#0f0f0f]' : 'text-black bg-gray-100'}`}>
       <div className="flex items-center justify-between p-2 shadow-sm z-10 shrink-0 border-b dark:border-[#3C4043] bg-white dark:bg-[#303134]">
          <span className="font-medium text-sm ml-2">{file?.name}</span>
       </div>
       <div className="flex-1 flex overflow-hidden">
         <div className="flex-1 overflow-y-auto px-4 py-8 bg-gray-200 dark:bg-[#1a1a1a]">
           {loading && <div className="text-center p-12">Loading Presentation...</div>}
           {/* pptx-preview inherently renders slides vertically. This fulfills "Vertical slides" */}
           <div ref={containerRef} className="w-full flex-col flex items-center h-full max-w-full" />
         </div>
         <div className="w-48 overflow-y-auto border-l bg-white dark:bg-[#202124] dark:border-[#3C4043] shrink-0 p-3 hidden md:block">
           <h3 className={`text-xs font-semibold mb-4 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Thumbnails</h3>
           <p className="text-xs text-gray-500">Thumbnail preview relies on native pptx layout.</p>
         </div>
       </div>
    </div>
  );
};

export default PptxViewer;
