import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from '../../types/file';
import { PDFDocument } from 'pdf-lib';
import { X, Download, Save, FileOutput, Minimize, FolderOpen } from 'lucide-react';
import { NotificationManager } from '../../notifications/NotificationManager';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface CompressPdfProps {
  onClose?: () => void;
  onAddFile?: (file: any) => void;
  isDark?: boolean;
  files?: WorkspaceFile[];
  file?: WorkspaceFile;
}

export const CompressPdf: React.FC<CompressPdfProps> = ({ onClose = () => {}, onAddFile, isDark = false, files = [], file }) => {
  const [selectedPdf, setSelectedPdf] = useState<any>(null);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState<string>('');

  useEffect(() => {
    if (file && !selectedPdf) {
      handleAddWorkspaceFile(file);
    }
  }, [file]);

  const handleAddWorkspaceFile = async (wFile: WorkspaceFile) => {
    try {
      let buffer: ArrayBuffer;
      if (wFile.blob) {
        buffer = await wFile.blob.arrayBuffer();
      } else if (wFile.uri) {
        const res = await fetch(wFile.uri);
        buffer = await res.arrayBuffer();
      } else {
        throw new Error('Workspace file path corrupted');
      }

      await PDFDocument.load(buffer, { ignoreEncryption: true });

      setSelectedPdf({
        name: wFile.name,
        size: wFile.size,
        buffer
      });
      setOutputUrl(null);
      setOutputBlob(null);
      setShowWorkspacePicker(false);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Error loading selected workspace document.');
    }
  };

  const handleCompress = async () => {
    if (!selectedPdf) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(selectedPdf.buffer, { ignoreEncryption: true });
      
      const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
      const compiledBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const secureName = `${selectedPdf.name.replace(/\.pdf$/i, '')}_compressed.pdf`;

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const compileUrl = URL.createObjectURL(compiledBlob);

      setOutputBlob(compiledBlob);
      setOutputUrl(compileUrl);
      setOutputName(secureName);

      const storedWorkspace = localStorage.getItem('filemanager_all_files');
      const workspaceFiles: any[] = storedWorkspace ? JSON.parse(storedWorkspace) : [];
      
      const fileId = 'pdf-compress-item-' + Math.random().toString(36).substring(2, 11);
      const newFileEntry: WorkspaceFile = {
        id: fileId,
        name: secureName,
        path: '/' + secureName,
        category: 'pdf',
        size: compiledBlob.size,
        mimeType: 'application/pdf',
        blob: compiledBlob,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        isFavorite: false
      };

      localStorage.setItem('filemanager_all_files', JSON.stringify([newFileEntry, ...workspaceFiles]));

      if (onAddFile) {
        onAddFile(newFileEntry);
      }

      const diff = selectedPdf.size - compiledBlob.size;
      const pct = selectedPdf.size > 0 ? ((diff / selectedPdf.size) * 100).toFixed(1) : '0';
      const msg = diff > 0 
        ? `Saved as "${secureName}". File size reduced by ${pct}%.`
        : `Saved as "${secureName}". (Already optimized)`;

      NotificationManager.success(msg);
    } catch (err) {
      console.error('Compression failed', err);
      NotificationManager.error('Could not compress PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob || !outputName) return;
    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(outputBlob);
      reader.onloadend = async () => {
        try {
          await Filesystem.writeFile({
            path: outputName,
            data: reader.result as string,
            directory: Directory.Documents
          });
          NotificationManager.success(`Saved "${outputName}" to device.`);
        } catch (e) {
          NotificationManager.error('Could not write file natively.');
        }
      };
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(outputBlob);
      link.download = outputName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const workspacePdfs = files.filter(f => f.category === 'pdf' || f.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className={`flex flex-col h-full bg-transparent`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 text-orange-600 rounded-lg">
            <Minimize className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg font-sans">Compress PDF</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Optimize file size for sharing</p>
          </div>
        </div>
        <button onClick={onClose} className={`p-2 rounded-full cursor-pointer transition-colors active:scale-95 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-24">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          
          <div className={`p-6 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-200'}`}>
            {selectedPdf ? (
              <div className="w-full flex flex-col gap-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileOutput className="w-6 h-6 text-orange-500 flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{selectedPdf.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Original Size: {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedPdf(null); setOutputUrl(null); }} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-center gap-4 mt-2">
                  <button onClick={handleCompress} disabled={isProcessing} className="flex-1 flex gap-2 justify-center items-center py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                    <Minimize className="w-4 h-4" /> Compress Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4">
                  <FileOutput className="w-8 h-8" />
                </div>
                <h3 className="font-bold mb-2">Select a PDF to compress</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reduce file size by stripping metadata and optimizing object structure.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowWorkspacePicker(true)} className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold shadow-sm transition active:scale-95">
                    <FolderOpen className="w-4 h-4" /> Open Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          {outputUrl && (
             <div className={`p-6 border rounded-2xl flex flex-col items-center justify-center text-center ${isDark ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                 <Save className="w-6 h-6" />
               </div>
               <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1">Compression Complete</h3>
               <p className="text-sm text-emerald-600 dark:text-emerald-500 mb-2 text-center px-4">
                 Your optimized PDF "{outputName}" has been saved automatically.
               </p>
               <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-5">
                 New Size: {(outputBlob!.size / 1024 / 1024).toFixed(2)} MB 
               </p>
               <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-sm transition active:scale-95">
                 <Download className="w-4 h-4" /> Download to Device
               </button>
             </div>
          )}

        </div>
      </div>

      {showWorkspacePicker && (
        <div className="absolute inset-0 z-[100] bg-black/60 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className="text-sm font-extrabold">Pick PDF from Workspace</h3>
              <button onClick={() => setShowWorkspacePicker(false)} className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {workspacePdfs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No PDFs available.</div>
              ) : (
                workspacePdfs.map(wp => (
                  <div key={wp.id} onClick={() => handleAddWorkspaceFile(wp)} className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${isDark ? 'bg-gray-800/40 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileOutput className="w-5 h-5 text-red-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{wp.name}</p>
                        <p className="text-xs text-gray-500">{(wp.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressPdf;
