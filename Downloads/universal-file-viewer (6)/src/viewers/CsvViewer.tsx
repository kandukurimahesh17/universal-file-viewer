import React, { useState, useEffect } from 'react';

export const CsvViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [data, setData] = useState<string[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const parseCsv = async () => {
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
        const rows = text.split('\n').map((line: string) => {
          return line.split(',').map((cell: string) => cell.trim());
        }).filter((row: string[]) => row.length > 0 && !(row.length === 1 && row[0] === ''));
        
        setData(rows);
      } catch (err: any) {
        console.error('[CsvViewer] Error parsing CSV:', err);
        setError(err.message || 'An error occurred while opening the CSV file.');
      } finally {
        setLoading(false);
      }
    };

    parseCsv();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading CSV...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load CSV</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  const header = data[0] || [];
  const body = data.slice(1);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
        <span className="font-semibold text-sm">CSV Viewer</span>
        <span className="text-xs text-gray-500">{data.length} rows</span>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-[#121212]">
        <table className="min-w-full border-collapse text-sm table-fixed">
          <thead>
            <tr>
              {header.map((h, idx) => (
                <th key={idx} className="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-2 text-left font-semibold truncate w-40 max-w-[10rem]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, header.length)} className="p-8 text-center text-gray-500 italic">No rows found in CSV.</td>
              </tr>
            ) : (
              body.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {header.map((_, colIdx) => {
                    const cell = row[colIdx];
                    return (
                      <td key={colIdx} className="border border-gray-300 dark:border-gray-700 p-2 truncate max-w-[10rem]" title={cell !== undefined ? cell : ''}>
                        {cell !== undefined ? cell : ''}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CsvViewer;
