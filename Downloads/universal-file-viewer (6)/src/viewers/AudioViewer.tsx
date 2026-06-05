import React, { useState } from 'react';

export const AudioViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col gap-6">
        <div className="text-center">
          <h3 className="font-semibold text-lg">{file?.name || 'Unknown Audio'}</h3>
          <p className="text-gray-500 text-sm">Artist Name - Album</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>1:00</span>
            <span>3:20</span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-6">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">⏪</button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl hover:bg-blue-600">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">⏩</button>
        </div>
      </div>
    </div>
  );
};

export default AudioViewer;
