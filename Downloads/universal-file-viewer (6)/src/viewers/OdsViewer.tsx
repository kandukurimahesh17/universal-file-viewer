import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export const OdsViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    const loadWorkbook = async () => {
      try {
        let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
        if (!finalBlob && file.uri) {
          const res = await fetch(file.uri);
          finalBlob = await res.blob();
        }
        if (!finalBlob) {
          throw new Error('File content is unavailable.');
        }

        const buffer = await finalBlob.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in workbook.');
        }

        setSheets(workbook.SheetNames);
        setActiveTab(workbook.SheetNames[0]);
        
        // Parse active tab
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        setSheetData(json);
      } catch (err: any) {
        console.error('[OdsViewer] Error parsing workbook:', err);
        setError(err.message || 'An error occurred while opening the ODS spreadsheet.');
      } finally {
        setLoading(false);
      }
    };

    loadWorkbook();
  }, [file]);

  const selectSheet = (sheetName: string) => {
    if (!file) return;
    setActiveTab(sheetName);
    try {
      let finalBlob = file.blob;
      if (finalBlob) {
        finalBlob.arrayBuffer().then((buffer: ArrayBuffer) => {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          setSheetData(json);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-8">
        <span className="text-sm text-gray-500">Loading ODS spreadsheet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <span className="text-red-500 font-semibold mb-2">Failed to load ODS file</span>
        <span className="text-xs text-gray-500 max-w-md">{error}</span>
      </div>
    );
  }

  // Generate column labels (A, B, C...) based on max row length
  const maxCols = sheetData.reduce((max, row) => Math.max(max, row ? row.length : 0), 0);
  const colLabels = Array.from({ length: Math.max(5, maxCols) }, (_, i) => {
    let label = '';
    let temp = i;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  });

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="flex-1 overflow-auto bg-white dark:bg-[#121212] p-4 relative">
        <table className="min-w-full border-collapse text-sm table-fixed">
          <thead>
            <tr>
              <th className="border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/50 p-2 w-12 text-center text-gray-500"></th>
              {colLabels.map(c => (
                <th key={c} className="border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/50 p-2 text-center font-normal w-32 min-w-[8rem] truncate">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.length === 0 ? (
              <tr>
                <td colSpan={colLabels.length + 1} className="p-8 text-center text-gray-500 italic">This sheet is empty.</td>
              </tr>
            ) : (
              sheetData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/50 p-2 text-center text-gray-500 font-normal w-12">{rowIdx + 1}</td>
                  {colLabels.map((_, colIdx) => {
                    const value = row ? row[colIdx] : undefined;
                    return (
                      <td key={colIdx} className="border border-green-300 dark:border-green-800 p-2 truncate max-w-[8rem]" title={value !== undefined ? String(value) : ''}>
                        {value !== undefined ? String(value) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sheets.length > 1 && (
        <div className="flex border-t border-green-300 dark:border-green-800 bg-green-50 dark:bg-[#0a1a0f] overflow-x-auto">
          {sheets.map(s => (
            <button 
              key={s} 
              onClick={() => selectSheet(s)}
              className={`px-4 py-2 text-sm border-r border-green-300 dark:border-green-800 shrink-0 ${activeTab === s ? 'bg-white dark:bg-black font-semibold border-b-2 border-b-green-500' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OdsViewer;
