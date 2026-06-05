import React, { useState, useRef, useEffect } from 'react';
import { 
  FileImage, UploadCloud, CheckCircle2, Download, 
  Check, Loader2, FileText, ChevronLeft, Archive, Plus, X
} from 'lucide-react';
import { PdfService } from '../../services/PdfService';
import { ZipService } from '../../services/ZipService';
import { DownloadManager } from '../../native/DownloadManager';
import { MediaScanner } from '../../native/MediaScanner';
import { FileAccess } from '../../native/FileAccess';
import { ToolNotifications } from '../../notifications/ToolNotifications';
import { WorkspaceFile } from '../../types/file';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = 2;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

type ProcessStage = 'idle' | 'preparing' | 'extracting' | 'finalizing';

export default function PdfToImages({ file, onClose, onAddFile, isDark }: any) {
  const [images, setImages] = useState<{ id: string; blob: Blob; url: string; number: number }[]>([]);
  
  const [appState, setAppState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [currentStage, setCurrentStage] = useState<ProcessStage>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  useEffect(() => {
    if (file && appState === 'idle') {
       processPdf();
    }
  }, [file]);

  const processPdf = async () => {
    if (!file || !file.blob) {
       setError('No valid PDF file selected or file blob is missing.');
       return;
    }
    setAppState('processing');
    setError(null);
    setProgressPercent(5);
    setCurrentStage('preparing');
    try {
      const extractedBlobs = await PdfService.extractImagesFromPdf(file.blob as Blob, (progress, status) => {
        setProgressPercent(progress);
        setProgressText(status);
        if (progress > 10) setCurrentStage('extracting');
        if (progress > 90) setCurrentStage('finalizing');
      });

      const processedImages = extractedBlobs.map((blob, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        blob,
        url: URL.createObjectURL(blob),
        number: index + 1
      }));

      setImages(processedImages);
      setAppState('success');
      setCurrentStage('idle');
      ToolNotifications.notifyImagesExtracted(file.name, processedImages.length);
    } catch (err: any) {
      console.error(err);
      setError('Failed to extract images from PDF. Ensure it is a valid PDF file.');
      setAppState('idle');
      setCurrentStage('idle');
    }
  };

  const getBaseName = () => {
    if (!file) return 'Images';
    return file.name.replace(/\.[^/.]+$/, '');
  };

  const saveWorkspaceFile = async (fileId: string, fileName: string, category: any, size: number, mimeType: string, blob: Blob, uri: string | undefined, path: string | undefined) => {
    const newFileEntry: WorkspaceFile = {
      id: fileId,
      name: fileName,
      path: path || '/' + fileName,
      category,
      size,
      mimeType,
      blob,
      uri,
      lastModified: Date.now(),
      isFavorite: false,
      isPinned: false
    };
    if (onAddFile) onAddFile(newFileEntry);
  };

  const downloadAllAsZip = async () => {
    if (images.length === 0) return;
    try {
      const zipFileName = `${getBaseName()}_images.zip`;
      const filesToZip = images.map(img => ({
        name: `page_${img.number}.jpg`,
        blob: img.blob
      }));
      
      const zipBlob = await ZipService.createZip(filesToZip);
      const base64 = await FileAccess.blobToBase64(zipBlob);
      const { path, uri } = await DownloadManager.saveToDevice(zipFileName, base64);
      if (uri) await MediaScanner.scanFile(uri);

      const fileId = 'zip-' + Math.random().toString(36).substr(2, 9);
      await saveWorkspaceFile(fileId, zipFileName, 'zip', zipBlob.size, 'application/zip', zipBlob, uri, path);
      
      ToolNotifications.notifyFileSaved(zipFileName);
    } catch (err) {
      console.error(err);
      setError('Failed to save ZIP to device storage.');
    }
  };

  const downloadSingleImage = async (img: { blob: Blob; number: number }) => {
    try {
      const fileName = `${getBaseName()}_page_${img.number}.jpg`;
      const base64 = await FileAccess.blobToBase64(img.blob);
      const { path, uri } = await DownloadManager.saveToDevice(fileName, base64);
      if (uri) await MediaScanner.scanFile(uri);

      const fileId = 'img-' + Math.random().toString(36).substr(2, 9);
      await saveWorkspaceFile(fileId, fileName, 'image', img.blob.size, 'image/jpeg', img.blob, uri, path);

      ToolNotifications.notifyFileSaved(fileName);
    } catch (err) {
       console.error(err);
       setError('Failed to save image to device storage.');
    }
  };

  const resetApp = () => {
    if (onClose) onClose();
  };

  const renderProcessingState = () => {
    const stageOrder: ProcessStage[] = ['preparing', 'extracting', 'finalizing'];
    
    const renderStageItem = (stage: ProcessStage, label: string) => {
      const active = currentStage === stage;
      const done = stageOrder.indexOf(stage) < stageOrder.indexOf(currentStage) || appState === 'success';
      
      return (
        <div key={stage} className="flex items-center gap-4 py-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
            done ? 'bg-[#1E8E3E] text-white' : 
            active ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF]' : 
            'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]'
          }`}>
            {done ? <Check className="w-5 h-5" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" /> }
          </div>
          <span className={`text-[16px] transition-colors duration-300 ${
            active ? 'text-[#1F1F1F] dark:text-[#E3E3E3] font-medium' : 
            done ? 'text-[#444746] dark:text-[#C4C7C5]' : 'text-[#747775] dark:text-[#8E918F]'
          }`}>
            {label}
          </span>
        </div>
      );
    };

    return (
      <div className="absolute inset-0 z-50 bg-[#F3F4F6] dark:bg-[#131314] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
         <div className="w-full max-w-sm flex flex-col items-center">
           <div className="relative w-32 h-32 mb-10">
             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
               <circle className="text-[#E0E2E0] dark:text-[#444746]" strokeWidth="6" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
               <circle className="text-[#0B57D0] dark:text-[#A8C7FA] transition-all duration-300 ease-out" strokeWidth="6" strokeDasharray="276" strokeDashoffset={276 - (276 * progressPercent) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="44" cx="50" cy="50" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center flex-col">
               <span className="text-[28px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">{Math.round(progressPercent)}%</span>
             </div>
           </div>
           <h2 className="text-[24px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight mb-8">Extracting Images</h2>
           <div className="w-full bg-white dark:bg-[#1E1F20] rounded-[24px] p-6 shadow-sm border border-[#E0E2E0] dark:border-[#444746]">
             {renderStageItem('preparing', 'Reading PDF Data')}
             {renderStageItem('extracting', 'Rendering High-Res Images')}
             {renderStageItem('finalizing', 'Finalizing Extraction')}
           </div>
           <p className="mt-4 text-[#747775] dark:text-[#8E918F]">{progressText}</p>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F3F4F6] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans selection:bg-[#D3E3FD] selection:text-[#0B57D0]">
      
      <header className="relative flex items-center px-4 h-16 bg-[#F3F4F6] dark:bg-[#131314] z-10 sticky top-0 transition-shadow border-b border-transparent">
        <div className="flex items-center gap-3 w-full">
          {onClose && (
            <button onClick={onClose} className="-ml-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-[#C4C7C5] transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B57D0] text-white shadow-sm">
            <FileImage className="w-5 h-5" />
          </div>
          <h1 className="text-[22px] tracking-tight font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
            PDF to Images
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 pb-24 pt-4 relative">
        {error && (
          <div className="w-full p-4 mb-6 bg-[#FCE8E6] dark:bg-[#3B2D2C] text-[#B3261E] dark:text-[#F2B8B5] rounded-[24px] text-sm font-medium">
            {error}
          </div>
        )}

        {appState === 'idle' && (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!file ? (
              <div onClick={() => onClose && onClose()} className="w-full bg-white dark:bg-[#1E1F20] border border-[#E0E2E0] dark:border-[#444746] rounded-[24px] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F8F9FA] dark:hover:bg-[#282A2C] transition-colors group" style={{ minHeight: '320px' }}>
                <div className="w-20 h-20 bg-[#F0F4F9] dark:bg-[#282A2C] group-hover:bg-[#D3E3FD] dark:group-hover:bg-[#004A77] rounded-full flex items-center justify-center mb-6 transition-colors">
                  <FileText className="w-10 h-10 text-[#0B57D0] dark:text-[#A8C7FA]" />
                </div>
                <h2 className="text-[22px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-3 tracking-tight">No PDF Selected</h2>
                <p className="text-[#444746] dark:text-[#C4C7C5] text-center max-w-sm text-[15px] leading-relaxed mb-8">Please select a PDF document from the Files tab to extract its pages into images.</p>
                <div className="px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#062E6F] dark:hover:bg-[#D3E3FD] text-white rounded-full text-[14px] font-medium transition-all active:scale-[0.98] flex items-center gap-2">
                   Go to Files
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B57D0] mb-4" />
                <p className="text-lg">Initializing...</p>
              </div>
            )}
          </div>
        )}

        {appState === 'processing' && renderProcessingState()}

        {appState === 'success' && (
          <div className="w-full flex flex-col items-center py-6 animate-in fade-in duration-500">
             <div className="w-16 h-16 bg-[#E6F4EA] dark:bg-[#0F5223] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-[#1E8E3E] dark:text-[#6DD58C]" />
             </div>
             <h2 className="text-[24px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-8 tracking-tight text-center">Extraction Complete</h2>
             
             <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
               {images.map((img) => (
                 <div key={img.id} className="relative aspect-[3/4] bg-white dark:bg-[#1E1F20] rounded-xl overflow-hidden group shadow-sm border border-[#E0E2E0] dark:border-[#444746] flex flex-col">
                   <div className="flex-1 w-full relative overflow-hidden bg-[#E1E5EA] dark:bg-[#131314] flex items-center justify-center p-2">
                     <img src={img.url} alt={`Page ${img.number}`} className="max-w-full max-h-full object-contain" />
                     <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white font-medium text-xs">
                        Page {img.number}
                     </div>
                   </div>
                   <button onClick={() => downloadSingleImage(img)} className="w-full flex p-3 items-center justify-center gap-2 bg-white dark:bg-[#1E1F20] hover:bg-gray-50 dark:hover:bg-neutral-800 transition border-t border-gray-100 dark:border-neutral-800 text-[14px] font-medium text-[#0B57D0] dark:text-[#A8C7FA]">
                     <Download className="w-4 h-4"/> Save
                   </button>
                 </div>
               ))}
             </div>

             <div className="w-full flex flex-col gap-4 sticky bottom-4 z-20">
               <button onClick={downloadAllAsZip} className="w-full py-4 bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#062E6F] dark:hover:bg-[#D3E3FD] text-white rounded-full text-[16px] font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all">
                 <Archive className="w-5 h-5" /> Save All as ZIP
               </button>
               <div className="flex justify-center mt-2">
                 <button onClick={resetApp} className="px-6 py-2.5 bg-[#F0F4F9] shadow-sm dark:bg-[#1E1F20] border border-[#E0E2E0] dark:border-[#444746] text-[#1F1F1F] dark:text-[#E3E3E3] text-[14px] font-medium rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                   <ChevronLeft className="w-4 h-4" /> Go Back
                 </button>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
