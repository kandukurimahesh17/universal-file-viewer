import React, { useState } from 'react';

export const VideoViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`flex flex-col h-full w-full bg-black text-white relative`}>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full aspect-video bg-gray-900 border border-gray-800 flex items-center justify-center relative">
          <span className="text-gray-500">Video Player ({file?.name || 'Unknown'})</span>
          <button 
             onClick={() => setIsPlaying(!isPlaying)}
             className="absolute bg-black/50 hover:bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl">
             {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
      <div className="p-4 bg-gradient-to-t from-black to-transparent flex flex-col gap-2 absolute bottom-0 left-0 right-0">
        <div className="h-1 bg-white/20 cursor-pointer">
          <div className="h-full bg-blue-500 w-1/3"></div>
        </div>
        <div className="flex justify-between items-center text-sm font-mono text-gray-300">
           <span>00:15 / 02:30</span>
           <button className="hover:text-white">Fullscreen</button>
        </div>
      </div>
    </div>
  );
};

export default VideoViewer;
