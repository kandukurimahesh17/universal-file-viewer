import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, Plus, Trash2, RotateCw, 
  ArrowUp, ArrowDown, Download, Share2, 
  ChevronLeft, CheckCircle2, FileText, 
  Check, Loader2, File as FileIcon, ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { DownloadManager } from '../../native/DownloadManager';
import { ShareManager } from '../../native/ShareManager';
import { MediaScanner } from '../../native/MediaScanner';
import { ToolNotifications } from '../../notifications/ToolNotifications';
import { FileAccess } from '../../native/FileAccess';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = 2;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const fileToCanvas = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 800;
      canvas.height = img.height || 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

interface PdfImage {
  id: string;
  file: File;
  previewUrl: string;
  rotation: number;
}
type ProcessStage = 'idle' | 'preparing' | 'optimizing' | 'building' | 'finalizing';

const ToolHeader = ({ title, onClose }: { title: string, onClose?: () => void }) => (
  <header className="relative flex items-center px-4 h-16 bg-[#F3F4F6] dark:bg-[#131314] z-10 sticky top-0 transition-shadow border-b border-transparent">
    <div className="flex items-center gap-3 w-full">
      {onClose && (
        <button onClick={onClose} className="-ml-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#444746] dark:text-[#C4C7C5] transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B57D0] text-white shadow-sm">
        <FileText className="w-5 h-5" />
      </div>
      <h1 className="text-[22px] tracking-tight font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
        {title}
      </h1>
    </div>
  </header>
);

export default function ImageToPdf({ onClose, onAddFile, onOpenFile }: any) {
  const [images, setImages] = useState<PdfImage[]>([]);
  const [documentName, setDocumentName] = useState('');
  
  const [appState, setAppState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [currentStage, setCurrentStage] = useState<ProcessStage>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        rotation: 0
      }));
      setImages(prev => [...prev, ...newImages]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImages(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx !== -1) URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const rotateImage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: img.rotation + 90 } : img));
  };

  const moveUp = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index === 0) return;
    setImages(prev => {
      const updated = [...prev];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      return updated;
    });
  };

  const moveDown = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index === images.length - 1) return;
    setImages(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setAppState('processing');
    setError(null);
    
    try {
      setCurrentStage('preparing');
      setProgressPercent(5);
      await new Promise(res => setTimeout(res, 1200)); 
      
      setCurrentStage('optimizing');
      setProgressPercent(15);
      await new Promise(res => setTimeout(res, 1500)); 

      setCurrentStage('building');
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      
      for (let i = 0; i < images.length; i++) {
        const baseProgress = 20;
        const buildSpace = 70; 
        setProgressPercent(baseProgress + ((i / images.length) * buildSpace));
        
        const imgObj = images[i];
        if (i > 0) doc.addPage();
        
        const imgCanvas = await fileToCanvas(imgObj.file);
        let printCanvas = imgCanvas;
        
        if (imgObj.rotation % 360 !== 0) {
          printCanvas = document.createElement('canvas');
          const ctx = printCanvas.getContext('2d');
          const r = imgObj.rotation % 360;
          if (r === 90 || r === 270 || r === -90 || r === -270) {
            printCanvas.width = imgCanvas.height;
            printCanvas.height = imgCanvas.width;
          } else {
            printCanvas.width = imgCanvas.width;
            printCanvas.height = imgCanvas.height;
          }
          
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
            ctx.translate(printCanvas.width / 2, printCanvas.height / 2);
            ctx.rotate((r * Math.PI) / 180);
            ctx.drawImage(imgCanvas, -imgCanvas.width / 2, -imgCanvas.height / 2);
          }
        }
        
        const dataUrl = printCanvas.toDataURL('image/jpeg', 0.85);
        
        let targetW = pageWidth - margin * 2;
        let targetH = pageHeight - margin * 2;
        const imgRatio = printCanvas.width / printCanvas.height;
        const pageRatio = targetW / targetH;
        
        if (imgRatio > pageRatio) targetH = targetW / imgRatio;
        else targetW = targetH * imgRatio;
        
        const x = margin + (pageWidth - margin * 2 - targetW) / 2;
        const y = margin + (pageHeight - margin * 2 - targetH) / 2;
        
        doc.addImage(dataUrl, 'JPEG', x, y, targetW, targetH);
        
        await new Promise(res => setTimeout(res, 150)); 
      }
      
      setCurrentStage('finalizing');
      setProgressPercent(90);
      
      const blob = doc.output('blob');
      
      setProgressPercent(100);
      await new Promise(res => setTimeout(res, 800)); 
      
      setPdfBlob(blob);
      setPdfSize(blob.size);
      setPdfUrl(URL.createObjectURL(blob));
      setAppState('success');
      setCurrentStage('idle');
      
      ToolNotifications.notifyPdfMerged(getFinalDocumentName() + '.pdf', images.length);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate PDF. Please try again.');
      setAppState('idle');
      setCurrentStage('idle');
    }
  };

  const getFinalDocumentName = () => {
    const defaultName = 'Untitled Document';
    const trimmed = documentName.trim();
    return trimmed.length > 0 ? trimmed : defaultName;
  };

  const downloadPdf = async () => {
    if (!pdfBlob) return;
    try {
      const fileName = `${getFinalDocumentName()}.pdf`;
      const base64 = await FileAccess.blobToBase64(pdfBlob);
      const { path, uri } = await DownloadManager.saveToDevice(fileName, base64);
      if (uri) {
        await MediaScanner.scanFile(uri);
      }
      
      // Save to Workspace
      try {
        const fileId = 'pdf-converted-' + Math.random().toString(36).substr(2, 9);
        const newFileEntry = {
          id: fileId,
          name: fileName,
          path: path || '/' + fileName,
          category: 'pdf' as any,
          size: pdfBlob.size,
          mimeType: 'application/pdf',
          blob: pdfBlob,
          uri: uri,
          lastModified: Date.now(),
          isFavorite: false,
          isPinned: false
        };
        if (onAddFile) onAddFile(newFileEntry);
      } catch (e) {
        // ignore workspace save errors
      }

    } catch (err: any) {
      console.error('Save error:', err);
      setError('Failed to save file securely to device storage. Please check permissions.');
    }
  };

  const openPdf = () => {
    if (!pdfUrl) return;
    setShowPreview(true);
  };

  const sharePdf = async () => {
    if (!pdfBlob) return;
    try {
      await ShareManager.shareFile(`${getFinalDocumentName()}.pdf`, pdfBlob);
    } catch (err) {
      console.log('Share interaction failed', err);
    }
  };
  
  const resetApp = () => {
    setImages([]);
    setDocumentName('');
    setPdfBlob(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setAppState('idle');
  };

  const renderProcessingState = () => {
    const stageOrder: ProcessStage[] = ['preparing', 'optimizing', 'building', 'finalizing'];
    
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
           <h2 className="text-[24px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight mb-8">Creating your PDF</h2>
           <div className="w-full bg-white dark:bg-[#1E1F20] rounded-[24px] p-6 shadow-sm border border-[#E0E2E0] dark:border-[#444746]">
             {renderStageItem('preparing', 'Preparing Images')}
             {renderStageItem('optimizing', 'Optimizing Images')}
             {renderStageItem('building', 'Building PDF Pages')}
             {renderStageItem('finalizing', 'Finalizing PDF')}
           </div>
         </div>
      </div>
    );
  };

  const renderSuccessState = () => (
    <div className="w-full flex flex-col items-center py-10 animate-in zoom-in-95 duration-500">
       <div className="w-24 h-24 bg-[#E6F4EA] dark:bg-[#0F5223] rounded-full flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12 text-[#1E8E3E] dark:text-[#6DD58C]" />
       </div>
       <h2 className="text-[28px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-8 tracking-tight text-center">PDF Generated Successfully</h2>
       <div className="w-full bg-white dark:bg-[#1E1F20] rounded-[24px] p-6 border border-[#E0E2E0] dark:border-[#444746] shadow-sm flex items-center gap-5 mb-10">
         <div className="w-14 h-16 bg-[#FCE8E6] dark:bg-[#5C1E16] rounded-[8px] flex items-center justify-center flex-shrink-0">
           <FileIcon className="w-8 h-8 text-[#EA4335] dark:text-[#F2B8B5]" />
         </div>
         <div className="flex-1 min-w-0">
           <h3 className="font-medium text-[18px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate mb-1">{getFinalDocumentName()}.pdf</h3>
           <div className="flex items-center text-[14px] text-[#444746] dark:text-[#C4C7C5] gap-3">
             <span>{formatSize(pdfSize)}</span>
             <span className="w-1 h-1 rounded-full bg-[#C4C7C5] dark:bg-[#8E918F]" />
             <span>{images.length} page{images.length !== 1 ? 's' : ''}</span>
           </div>
         </div>
       </div>
       <div className="w-full flex flex-col gap-4">
         <button onClick={downloadPdf} className="w-full py-4 bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#062E6F] dark:hover:bg-[#D3E3FD] text-white rounded-full text-[16px] font-medium flex items-center justify-center gap-3 transition-transform active:scale-[0.98]">
           <Download className="w-5 h-5" /> Download PDF
         </button>
         <div className="flex gap-4">
           <button onClick={openPdf} className="flex-1 py-4 bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#0B57D0] dark:bg-[#004A77] dark:hover:bg-[#005D96] dark:text-[#C2E7FF] rounded-full text-[16px] font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
             <ExternalLink className="w-5 h-5" /> Open
           </button>
           <button onClick={sharePdf} className="flex-1 py-4 bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#0B57D0] dark:bg-[#004A77] dark:hover:bg-[#005D96] dark:text-[#C2E7FF] rounded-full text-[16px] font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]">
             <Share2 className="w-5 h-5" /> Share
           </button>
         </div>
         <div className="flex justify-center mt-4">
           <button onClick={resetApp} className="px-6 py-2.5 border border-[#747775] dark:border-[#8E918F] text-[#0B57D0] dark:text-[#A8C7FA] text-[14px] font-medium rounded-full hover:bg-[#F4F7FC] dark:hover:bg-[#A8C7FA]/10 transition-colors flex items-center justify-center gap-2">
             <Plus className="w-4 h-4" /> Create Another PDF
           </button>
         </div>
       </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F3F4F6] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans selection:bg-[#D3E3FD] selection:text-[#0B57D0]">
      
      <ToolHeader title="Image to PDF maker" onClose={onClose} />

      <main className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 pb-24 pt-4 relative">
        
        {error && (
          <div className="w-full p-4 mb-6 bg-[#FCE8E6] dark:bg-[#3B2D2C] text-[#B3261E] dark:text-[#F2B8B5] rounded-[24px] text-sm font-medium">
            {error}
          </div>
        )}

        {appState === 'idle' && (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-white dark:bg-[#1E1F20] rounded-[24px] p-6 shadow-sm border border-[#E0E2E0] dark:border-[#444746] transition-shadow hover:shadow-md">
              <h2 className="text-[20px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-2 tracking-tight">Enter Your Document Name</h2>
              <p className="text-[14px] text-[#444746] dark:text-[#C4C7C5] mb-5">Choose a name for your PDF document before creating it.</p>
              <input 
                type="text" 
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Example: My Travel Photos"
                className="w-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] text-[16px] px-4 py-4 rounded-[16px] outline-none border-2 border-transparent focus:border-[#0B57D0] dark:focus:border-[#A8C7FA] transition-colors placeholder-[#747775] dark:placeholder-[#8E918F]"
              />
            </div>

            {images.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="w-full bg-white dark:bg-[#1E1F20] border border-[#E0E2E0] dark:border-[#444746] rounded-[24px] p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F8F9FA] dark:hover:bg-[#282A2C] transition-colors group" style={{ minHeight: '320px' }}>
                <div className="w-20 h-20 bg-[#F0F4F9] dark:bg-[#282A2C] group-hover:bg-[#D3E3FD] dark:group-hover:bg-[#004A77] rounded-full flex items-center justify-center mb-6 transition-colors">
                  <ImageIcon className="w-10 h-10 text-[#0B57D0] dark:text-[#A8C7FA]" />
                </div>
                <h2 className="text-[22px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-3 tracking-tight">Select images</h2>
                <p className="text-[#444746] dark:text-[#C4C7C5] text-center max-w-sm text-[15px] leading-relaxed mb-8">Upload any image file (JPG, PNG, WebP, SVG, BMP, ICO, etc.) to arrange and convert them into a polished PDF document.</p>
                <button className="px-6 py-3 bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#062E6F] dark:hover:bg-[#D3E3FD] text-white rounded-full text-[14px] font-medium transition-all active:scale-[0.98] flex items-center gap-2">
                   <Plus className="w-5 h-5" /> Choose from device
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-[#1E1F20] rounded-[24px] p-6 shadow-sm border border-[#E0E2E0] dark:border-[#444746]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-[20px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">Images</h2>
                      <p className="text-[14px] text-[#444746] dark:text-[#C4C7C5] mt-1">{images.length} item{images.length !== 1 ? 's' : ''} selected</p>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#F0F4F9] hover:bg-[#E1E5EA] text-[#0B57D0] dark:bg-[#282A2C] dark:hover:bg-[#333537] dark:text-[#A8C7FA] rounded-full text-[14px] font-medium transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add More
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {images.map((img, index) => (
                      <div key={img.id} className="flex items-center gap-4 p-3 bg-[#F8F9FA] dark:bg-[#282A2C] rounded-[16px] group transition-all">
                        <div className="relative w-[72px] h-[72px] bg-[#E1E5EA] dark:bg-[#131314] rounded-[12px] overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img src={img.previewUrl} alt="preview" className="max-w-full max-h-full object-contain" style={{ transform: `rotate(${img.rotation}deg)` }}/>
                          <div className="absolute top-1 left-1 bg-[#1F1F1F]/60 text-white text-[11px] font-medium px-2 py-0.5 rounded-[6px] backdrop-blur-md">{index + 1}</div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <span className="font-medium text-[15px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate mb-0.5">{img.file.name}</span>
                          <span className="text-[13px] text-[#444746] dark:text-[#C4C7C5]">{formatSize(img.file.size)}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 pr-1">
                           <div className="flex flex-col gap-1 mr-2">
                             <button onClick={(e) => moveUp(index, e)} disabled={index === 0} className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] disabled:opacity-30 hover:bg-[#E1E5EA] dark:hover:bg-[#444746] transition-colors"><ArrowUp className="w-4 h-4" /></button>
                             <button onClick={(e) => moveDown(index, e)} disabled={index === images.length - 1} className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] disabled:opacity-30 hover:bg-[#E1E5EA] dark:hover:bg-[#444746] transition-colors"><ArrowDown className="w-4 h-4" /></button>
                           </div>
                           <button onClick={(e) => rotateImage(img.id, e)} className="p-2.5 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E1E5EA] dark:hover:bg-[#444746] transition-colors"><RotateCw className="w-5 h-5" /></button>
                           <button onClick={(e) => removeImage(img.id, e)} className="p-2.5 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#FCE8E6] hover:text-[#B3261E] dark:hover:bg-[#5C1E16] dark:hover:text-[#F2B8B5] transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <button onClick={generatePDF} className="w-full py-4 bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:text-[#062E6F] dark:hover:bg-[#D3E3FD] text-white rounded-full text-[16px] font-medium shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                    Create PDF
                  </button>
                </div>
              </>
            )}
            
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/bmp, image/x-icon, image/gif, image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>
        )}

        {appState === 'processing' && renderProcessingState()}
        {appState === 'success' && pdfUrl && renderSuccessState()}
      </main>

      {/* PDF Fullscreen Preview Overlay */}
      {showPreview && pdfUrl && (
        <div className="fixed inset-0 z-[100] bg-[#F3F4F6] dark:bg-[#131314] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center px-4 h-16 border-b border-[#E0E2E0] dark:border-[#444746] bg-white dark:bg-[#1E1F20]">
            <button onClick={() => setShowPreview(false)} className="p-2 -ml-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors mr-3 text-[#444746] dark:text-[#C4C7C5]">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-[18px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex-1 truncate tracking-tight">{getFinalDocumentName()}.pdf</h2>
          </div>
          <div className="flex-1 w-full bg-[#E1E5EA] dark:bg-[#323639]">
            <iframe src={`${pdfUrl}#toolbar=0`} title="PDF Preview" className="w-full h-full border-0" />
          </div>
        </div>
      )}
    </div>
  );
}
