import React from 'react';

export const ZipViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  return (
    <div className={`flex flex-col h-full w-full items-center justify-center p-8 ${isDark ? 'text-zinc-100 bg-zinc-900' : 'text-zinc-800 bg-zinc-50'}`}>
      <div className="text-center">
        <h2 className="font-semibold text-lg">{file?.name || 'Archive.zip'}</h2>
        <p className="text-sm mt-2 text-zinc-500">ZIP archive viewing is not yet supported.</p>
      </div>
    </div>
  );
};

export default ZipViewer;
