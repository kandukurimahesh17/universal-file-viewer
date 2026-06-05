import React, { useState } from 'react';

export const ImageViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white bg-[#0f0f0f]' : 'text-black bg-gray-100'}`}>
      <div className="flex items-center justify-center p-2 gap-4 bg-white dark:bg-[#1a1a1a] shadow z-10">
        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Zoom Out</button>
        <span className="text-sm font-mono w-16 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => z + 0.2)} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Zoom In</button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
        <button onClick={() => setRotate(r => r - 90)} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Rotate L</button>
        <button onClick={() => setRotate(r => r + 90)} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded">Rotate R</button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
        <button className="px-3 py-1 bg-blue-500 text-white rounded">Slideshow</button>
      </div>
      <div className="flex-1 overflow-hidden flex items-center justify-center relative">
        <div 
          className="border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center w-64 h-64 bg-gray-200 dark:bg-gray-800 transition-transform duration-200"
          style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
        >
          <span className="text-gray-500">Image</span>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
