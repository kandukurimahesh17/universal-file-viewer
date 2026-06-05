import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Trash2, 
  FileText, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  FolderOpen, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  AlertCircle,
  Printer,
  Copy,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { NotificationManager } from '../../notifications/NotificationManager';
import { ToolNotifications } from '../../notifications/ToolNotifications';
import { WorkspaceFile } from '../../types/file';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up react-pdf global worker for client-side rendering
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SelectedPdf {
  name: string;
  size: number;
  pageCount: number;
  buffer: ArrayBuffer;
}

interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

interface PasswordStrengthResult {
  score: number;
  label: string;
  colorClass: string;
  progressClass: string;
}

interface ProtectPdfProps {
  onClose?: () => void;
  onAddFile?: (file: any) => void;
  isDark?: boolean;
  files?: WorkspaceFile[];
  file?: WorkspaceFile;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const checkPasswordStrength = (pwd: string): PasswordStrengthResult => {
  if (!pwd) {
    return { 
      score: 0, 
      label: 'No Password Entered', 
      colorClass: 'text-gray-400', 
      progressClass: 'w-0 bg-transparent' 
    };
  }
  
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (pwd.length < 6) {
    return { 
      score: 1, 
      label: 'Weak (Too Short)', 
      colorClass: 'text-red-500 dark:text-red-400', 
      progressClass: 'w-1/4 bg-red-500' 
    };
  }

  if (score <= 2) {
    return { 
      score: 2, 
      label: 'Weak Strength', 
      colorClass: 'text-orange-500 dark:text-orange-400', 
      progressClass: 'w-1/2 bg-orange-550' 
    };
  } else if (score === 3 || score === 4) {
    return { 
      score: 3, 
      label: 'Good Strength', 
      colorClass: 'text-yellow-600 dark:text-yellow-400', 
      progressClass: 'w-3/4 bg-yellow-500' 
    };
  } else {
    return { 
      score: 4, 
      label: 'Strong & Secure', 
      colorClass: 'text-emerald-600 dark:text-emerald-400', 
      progressClass: 'w-full bg-emerald-500' 
    };
  }
};

export const ProtectPdf: React.FC<ProtectPdfProps> = ({ 
  onClose, 
  onAddFile, 
  isDark: propIsDark,
  files = [],
  file
}) => {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  // Security Credentials states
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  // Visibility toggles
  const [showUserPwd, setShowUserPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [showOwnerPwd, setShowOwnerPwd] = useState(false);

  // Security restrictions states
  const [restrictPrinting, setRestrictPrinting] = useState(true);
  const [restrictCopying, setRestrictCopying] = useState(true);
  const [restrictEditing, setRestrictEditing] = useState(true);

  // Loaded metadata state
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);

  // Workspace picker & compiling states
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // PDF Preview url (temporary blob URI for react-pdf loading)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [protectedFileName, setProtectedFileName] = useState('');

  // PDF Preview paging & size
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const [previewTotalPages, setPreviewTotalPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0.85);

  // Sync dark theme with system / document properties
  useEffect(() => {
    if (propIsDark !== undefined) return;
    const updateTheme = () => {
      const darkActive = document.documentElement.classList.contains('dark') || 
                          localStorage.getItem('theme') === 'dark';
      setLocalIsDark(darkActive);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsDark]);

  useEffect(() => {
    if (file && !selectedPdf) {
      handleAddWorkspaceFile(file);
    }
  }, [file]);

  // Read metadata when buffer is loaded
  const extractPdfMetadata = async (buffer: ArrayBuffer, name: string) => {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const meta: PdfMetadata = {
        title: pdfDoc.getTitle() || 'Untitled Document',
        author: pdfDoc.getAuthor() || 'Unknown Author',
        subject: pdfDoc.getSubject() || 'None',
        keywords: pdfDoc.getKeywords() || 'None',
        creator: pdfDoc.getCreator() || 'None',
        producer: pdfDoc.getProducer() || 'None'
      };
      
      setMetadata(meta);
      setPreviewCurrentPage(1);

      // Create a temporary Blob URL for canvas previewing
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const viewUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(viewUrl);

      NotificationManager.success(`Loaded "${name}" containing ${pdfDoc.getPageCount()} pages.`);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Could not parse PDF metadata or structure.');
    }
  };

  // Drag and Drop files upload handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSelectedFile(file);
  };

  const handleSelectedFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      NotificationManager.error('Please upload a valid PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPageCount();

      setSelectedPdf({
        name: file.name,
        size: file.size,
        pageCount: pages,
        buffer
      });

      // Clear old output previews
      resetOutputState();
      
      extractPdfMetadata(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

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

      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPageCount();

      setSelectedPdf({
        name: wFile.name,
        size: wFile.size,
        pageCount: pages,
        buffer
      });

      // Clear old output previews
      resetOutputState();

      extractPdfMetadata(buffer, wFile.name);
      setShowWorkspacePicker(false);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Error loading selected workspace document.');
    }
  };

  const resetOutputState = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputBlob(null);
    setOutputUrl(null);
    setProtectedFileName('');
  };

  const handleClearSelected = () => {
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    setSelectedPdf(null);
    setPreviewPdfUrl(null);
    setMetadata(null);
    resetOutputState();
  };

  // Helper validation states
  const strengthInfo = checkPasswordStrength(userPassword);
  const passwordsMatch = userPassword === confirmPassword;
  const showPasswordMatchWarning = confirmPassword.length > 0 && !passwordsMatch;
  const isOwnerAndUserSame = userPassword && ownerPassword && userPassword === ownerPassword;
  const isFormValid = selectedPdf && userPassword.length >= 4 && passwordsMatch;

  // Multi-step custom encryption compiler running offline
  const handleCompileAndProtectPdf = async () => {
    if (!isFormValid || !selectedPdf) {
      NotificationManager.error('Please configure valid user/owner passwords first.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStatus('Initializing cryptographically secure PDF layout...');

    try {
      // Assemble allowed permissions array (jsPDF lists ALLOWED permissions)
      const allowedPermissions: string[] = [];
      if (!restrictPrinting) allowedPermissions.push('print');
      if (!restrictCopying) allowedPermissions.push('copy');
      if (!restrictEditing) {
        allowedPermissions.push('modify');
        allowedPermissions.push('annot-lines');
      }

      // Read pages programmatically via PDFJS to render secure buffers
      const pdfDataBytes = new Uint8Array(selectedPdf.buffer);
      const pdfInstance = await pdfjs.getDocument({ data: pdfDataBytes }).promise;
      const numPages = pdfInstance.numPages;

      let doc: jsPDF | null = null;

      for (let i = 1; i <= numPages; i++) {
        setProcessingStatus(`Rendering page ${i} of ${numPages} with secure keys...`);
        setProgress(Math.floor(((i - 1) / numPages) * 100));

        const page = await pdfInstance.getPage(i);
        const ptsViewport = page.getViewport({ scale: 1.0 });
        const wPts = ptsViewport.width;
        const hPts = ptsViewport.height;

        // Render at high crisp scale for excellent quality preservation
        const highResViewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = highResViewport.width;
        canvas.height = highResViewport.height;
        const canvasCtx = canvas.getContext('2d');

        if (!canvasCtx) throw new Error('Could not get Canvas 2D render context.');

        await page.render({
          canvasContext: canvasCtx,
          viewport: highResViewport,
          canvas: canvas
        } as any).promise;

        const imgData = canvas.toDataURL('image/jpeg', 0.93);

        const currentOrientation = wPts > hPts ? 'l' : 'p';

        if (i === 1) {
          doc = new jsPDF({
            orientation: currentOrientation,
            unit: 'pt',
            format: [wPts, hPts],
            encryption: {
              userPassword: userPassword,
              ownerPassword: ownerPassword || `${userPassword}_owner`,
              userPermissions: allowedPermissions
            }
          } as any);
        } else if (doc) {
          doc.addPage([wPts, hPts], currentOrientation);
        }

        if (doc) {
          doc.addImage(imgData, 'JPEG', 0, 0, wPts, hPts, undefined, 'FAST');
        }
      }

      if (!doc) throw new Error('PDF compilation returned empty document.');

      setProcessingStatus('Assembling standard dictionary encryption...');
      setProgress(95);

      const arrayBufferOut = doc.output('arraybuffer');
      const compiledBlob = new Blob([arrayBufferOut], { type: 'application/pdf' });
      const secureName = `${selectedPdf.name.replace(/\.pdf$/i, '')}_protected.pdf`;

      // Revoke old URL if it was created
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      
      const compileUrl = URL.createObjectURL(compiledBlob);

      setOutputBlob(compiledBlob);
      setOutputUrl(compileUrl);
      setProtectedFileName(secureName);
      setProgress(100);

      // Duplicate saved entry into the Filemanager / Workspace list
      const storedWorkspace = localStorage.getItem('filemanager_all_files');
      const workspaceFiles: any[] = storedWorkspace ? JSON.parse(storedWorkspace) : [];
      
      const fileId = 'pdf-protect-item-' + Math.random().toString(36).substring(2, 11);
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

      const updatedWorkspace = [newFileEntry, ...workspaceFiles];
      localStorage.setItem('filemanager_all_files', JSON.stringify(updatedWorkspace));

      // Append downloading register to store
      const storedDownloads = localStorage.getItem('filemanager_downloaded_ids');
      const downloadedIds: string[] = storedDownloads ? JSON.parse(storedDownloads) : [];
      localStorage.setItem('filemanager_downloaded_ids', JSON.stringify([fileId, ...downloadedIds]));

      if (onAddFile) {
        onAddFile(newFileEntry);
      }

      NotificationManager.success(`"${secureName}" encrypted and saved to workspace.`);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Encountered an error compiling the secure PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Instant trigger download for output file
  const handleRequestDownload = () => {
    if (!outputBlob || !protectedFileName) return;

    if (Capacitor.isNativePlatform()) {
      const reader = new FileReader();
      reader.readAsDataURL(outputBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          await Filesystem.writeFile({
            path: protectedFileName,
            data: base64Data,
            directory: Directory.Documents
          });
          NotificationManager.success(`Successfully saved "${protectedFileName}" to device.`);
        } catch (e) {
          console.error(e);
          NotificationManager.error('Could not write file natively.');
        }
      };
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(outputBlob);
      link.download = protectedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      NotificationManager.success(`Downloaded protected PDF: ${protectedFileName}`);
    }
  };

  const handleShareResult = async () => {
    if (!outputBlob) return;
    try {
      if (Capacitor.isNativePlatform() && await Share.canShare()) {
        const reader = new FileReader();
        reader.readAsDataURL(outputBlob);
        reader.onloadend = async () => {
          const b64 = reader.result as string;
          await Share.share({
            title: 'Share Protected PDF',
            text: 'Here is your encrypted PDF document.',
            url: b64,
            dialogTitle: 'Share Protected File'
          });
        };
      } else if (navigator.share) {
        const file = new File([outputBlob], protectedFileName, { type: 'application/pdf' });
        await navigator.share({
          files: [file],
          title: 'Protected PDF Document',
          text: 'Here is the password-protected document.'
        });
      } else {
        NotificationManager.info('Sharing is not supported on this platform. Please download instead.');
      }
    } catch (err) {
      console.error(err);
      NotificationManager.error('Could not share the protected PDF.');
    }
  };

  // Lists filtered PDFs from workspace
  const workspacePdfs = files.filter(f => f.category === 'pdf' || f.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className={`p-4 min-h-[calc(100vh-120px)] flex flex-col ${isDark ? 'text-gray-100 bg-[#121212]' : 'text-gray-900 bg-gray-100'}`}>
      
      {/* HEADER SECTION */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-gray-800'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Protect PDF</h1>
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-0.5">
              Secure Documents Offline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWorkspacePicker(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
              isDark ? 'bg-[#1e1e1e] border-gray-700 text-white hover:bg-neutral-800' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
            Pick from Workspace
          </button>
        </div>
      </header>

      {/* COMPILING OVERLAY LOADER */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="relative mb-6">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold">
              {progress}%
            </div>
          </div>
          <h3 className="text-base font-extrabold mb-1">Securing Document Pages</h3>
          <p className="text-xs text-gray-400 font-medium max-w-sm mb-4 leading-relaxed">{processingStatus}</p>
          
          <div className="w-full max-w-xs bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 rounded-full" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className="text-[10px] text-gray-500 font-bold font-mono tracking-widest mt-2 uppercase">
            Pure Offline Encryption
          </p>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: SECURITY SETTINGS PANEL (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* SECURE CREDENTIALS CARD */}
          <section className={`p-4 rounded-3xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#1E1E1E] border-gray-850' : 'bg-white border-gray-200/80 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-450">
                Security Credentials
              </h2>
            </div>

            {/* USER PASSWORD OPEN DOCUMENT */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pr-0.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider">
                  User Password <span className="text-red-500">*</span>
                </label>
                <span className="text-[9px] text-gray-405 font-bold">Required to open PDF</span>
              </div>
              <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 border transition-all ${
                isDark ? 'bg-[#121212] border-gray-800' : 'bg-[#F4F6F9] border-transparent focus-within:border-gray-300'
              }`}>
                <input 
                  type={showUserPwd ? 'text' : 'password'}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Enter User Password"
                  className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold font-mono"
                />
                <button 
                  onClick={() => setShowUserPwd(!showUserPwd)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showUserPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* STRENGTH INDICATOR */}
              {userPassword.length > 0 && (
                <div className="space-y-1 pt-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="text-gray-400">PASSWORD SECURITY STRENGTH</span>
                    <span className={strengthInfo.colorClass}>{strengthInfo.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strengthInfo.progressClass}`} />
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD INPUT */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider pl-0.5">
                Confirm Password
              </label>
              <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 border transition-all ${
                isDark ? 'bg-[#121212] border-gray-800' : 'bg-[#F4F6F9] border-transparent focus-within:border-gray-300'
              }`}>
                <input 
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter User Password"
                  className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold font-mono"
                />
                <button 
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* MATCHING WARNINGS */}
              {showPasswordMatchWarning && (
                <div className="flex items-center gap-1 text-[10px] text-red-500 pl-0.5 mt-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Passwords do not match.
                </div>
              )}
              {userPassword.length > 0 && confirmPassword.length > 0 && passwordsMatch && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-500 pl-0.5 mt-1 font-bold">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Passwords match successfully.
                </div>
              )}
            </div>

            {/* OWNER PASSWORD INPUT (OPTIONAL) */}
            <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-850 pt-3">
              <div className="flex items-center justify-between pr-0.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider">
                  Owner Password <span className="text-gray-400 lowercase">(optional)</span>
                </label>
                <span className="text-[9px] text-gray-405 font-bold">Locks modifications</span>
              </div>
              <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 border transition-all ${
                isDark ? 'bg-[#121212] border-gray-800' : 'bg-[#F4F6F9] border-transparent focus-within:border-gray-300'
              }`}>
                <input 
                  type={showOwnerPwd ? 'text' : 'password'}
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Master Admin Pasword"
                  className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold font-mono"
                />
                <button 
                  onClick={() => setShowOwnerPwd(!showOwnerPwd)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showOwnerPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* OWNER WARNING */}
              {isOwnerAndUserSame && (
                <div className="flex items-start gap-1 text-[9px] text-yellow-600 dark:text-yellow-400 pl-0.5 leading-tight font-bold mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Having identical user and master owner passwords defeats independent security privileges.
                  </span>
                </div>
              )}
            </div>

          </section>

          {/* SECURITY PERMISSIONS CARD */}
          <section className={`p-4 rounded-3xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#1E1E1E] border-gray-850' : 'bg-white border-gray-200/80 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-450">
                Security Permissions
              </h2>
            </div>

            <div className="space-y-3">
              
              {/* PRINT RESTRICTION */}
              <button 
                onClick={() => setRestrictPrinting(!restrictPrinting)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border text-left cursor-pointer transition-all ${
                  restrictPrinting 
                    ? isDark ? 'bg-red-500/5 border-red-500/20 text-red-100' : 'bg-red-50 border-red-200 text-red-950'
                    : isDark ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Printer className={`w-5 h-5 shrink-0 ${restrictPrinting ? 'text-red-550' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Restrict Printing</h4>
                    <p className="text-[10px] text-gray-405 leading-tight mt-0.5">
                      {restrictPrinting ? 'Documents cannot be printed' : 'Users are allowed to print'}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  restrictPrinting 
                    ? 'bg-red-500 border-red-550 text-white' 
                    : isDark ? 'border-gray-700' : 'border-gray-300 bg-white'
                }`}>
                  {restrictPrinting && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* COPY RESTRICTION */}
              <button 
                onClick={() => setRestrictCopying(!restrictCopying)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border text-left cursor-pointer transition-all ${
                  restrictCopying 
                    ? isDark ? 'bg-red-500/5 border-red-500/20 text-red-100' : 'bg-red-50 border-red-200 text-red-950'
                    : isDark ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Copy className={`w-5 h-5 shrink-0 ${restrictCopying ? 'text-red-550' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Restrict Text & Content Copying</h4>
                    <p className="text-[10px] text-gray-405 leading-tight mt-0.5">
                      {restrictCopying ? 'Disables clipboard text/image extraction' : 'Allowed to copy text'}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  restrictCopying 
                    ? 'bg-red-500 border-red-550 text-white' 
                    : isDark ? 'border-gray-700' : 'border-gray-300 bg-white'
                }`}>
                  {restrictCopying && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* EDITING RESTRICTION */}
              <button 
                onClick={() => setRestrictEditing(!restrictEditing)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border text-left cursor-pointer transition-all ${
                  restrictEditing 
                    ? isDark ? 'bg-red-500/5 border-red-500/20 text-red-100' : 'bg-red-50 border-red-200 text-red-950'
                    : isDark ? 'bg-gray-850 border-gray-800' : 'bg-gray-50 border-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit2 className={`w-5 h-5 shrink-0 ${restrictEditing ? 'text-red-550' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Restrict Editing</h4>
                    <p className="text-[10px] text-gray-405 leading-tight mt-0.5">
                      {restrictEditing ? 'Locks annotations and form fields' : 'Modifications are permitted'}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  restrictEditing 
                    ? 'bg-red-500 border-red-550 text-white' 
                    : isDark ? 'border-gray-700' : 'border-gray-300 bg-white'
                }`}>
                  {restrictEditing && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

            </div>
          </section>

          {/* RUN COMPILE ACTION */}
          <div className="mt-auto">
            <button
              onClick={handleCompileAndProtectPdf}
              disabled={!isFormValid || isProcessing}
              className={`w-full py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                isFormValid && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Apply Password Security
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: PREVIEW STAGE & METADATA PREVIEW (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* UPLOAD / FILE DISPLAY CONTAINER */}
          {!selectedPdf ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleFileDrop}
              className={`flex-1 min-h-[400px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
                isDark 
                  ? 'bg-[#1E1E1E] border-gray-800 hover:bg-gray-850 hover:border-gray-750' 
                  : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
              }`}
            >
              <div className="p-4 bg-blue-500/10 rounded-full mb-3 text-blue-500">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-extrabold mb-1">Drag and Drop PDF here</h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
                Add User and Owner password layers to any PDF completely offline right on your device.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowWorkspacePicker(true)}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all ${
                    isDark ? 'bg-[#1A73E8] text-white hover:bg-[#1557B0]' : 'bg-[#1A73E8] text-white hover:bg-[#1557B0]'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Select File From Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* CURRENT LOADED FILE SUMMARY CARD */}
              <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#1E1E1E] border-gray-850' : 'bg-white border-gray-200/80 shadow-md'
              }`}>
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-bold truncate leading-tight">{selectedPdf.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium font-mono leading-none mt-1">
                      <span>{selectedPdf.pageCount} pages</span>
                      <span>•</span>
                      <span>{formatBytes(selectedPdf.size)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleClearSelected}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* OUTPUT FILE READY BANNER */}
              {outputUrl && (
                <div className={`p-4 rounded-3xl border animate-slide-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-100' : 'bg-emerald-50 border-emerald-250 text-emerald-950'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-2xl text-emerald-500 mt-0.5 sm:mt-0 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">Protected File Created Successfully</h4>
                      <p className="text-[10px] text-gray-450 leading-tight mt-0.5 truncate max-w-md">
                        {protectedFileName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                    <button
                      onClick={handleShareResult}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${
                        isDark ? 'bg-white/5 border-emerald-600/30 text-white hover:bg-white/10' : 'bg-white border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      onClick={handleRequestDownload}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 shadow cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 animate-bounce" /> Download
                    </button>
                  </div>
                </div>
              )}

              {/* DOCUMENT METADATA AND PREVIEW TABS */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* METADATA PREVIEW BLOCK (5 COLS) */}
                {metadata && (
                  <div className={`md:col-span-5 p-4 rounded-3xl border flex flex-col gap-3 h-fit ${
                    isDark ? 'bg-[#1E1E1E] border-gray-850' : 'bg-white border-gray-200/80 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-850 pb-2 shrink-0">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-450">
                        Document Metadata
                      </h3>
                    </div>

                    <div className="space-y-3 shrink-0">
                      
                      {/* TITLE */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Title</span>
                        <span className="text-xs font-bold leading-tight line-clamp-2 mt-0.5">{metadata.title}</span>
                      </div>

                      {/* AUTHOR */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Author</span>
                        <span className="text-xs font-medium leading-tight truncate block mt-0.5">{metadata.author}</span>
                      </div>

                      {/* SUBJECT */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Subject</span>
                        <span className="text-xs font-medium leading-tight truncate block mt-0.5">{metadata.subject}</span>
                      </div>

                      {/* KEYWORDS */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Keywords</span>
                        <span className="text-xs font-medium leading-tight truncate block mt-0.5">{metadata.keywords}</span>
                      </div>

                      {/* CREATOR */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Creator</span>
                        <span className="text-xs font-mono font-medium truncate block leading-none mt-0.5">{metadata.creator}</span>
                      </div>

                      {/* PRODUCER */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Producer</span>
                        <span className="text-xs font-mono font-medium truncate block leading-none mt-0.5">{metadata.producer}</span>
                      </div>

                    </div>
                  </div>
                )}

                {/* VISUAL LAYOUT PREVIEW (7 COLS) */}
                <div className={`md:col-span-7 p-4 rounded-3xl border flex flex-col min-h-[350px] relative ${
                  isDark ? 'bg-[#1E1E1E] border-gray-850' : 'bg-white border-gray-200/80 shadow-sm'
                }`}>
                  
                  {/* PREVIEW INTERACTION BAR */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2.5 shrink-0 z-10">
                    <h3 className="text-xs font-extrabold text-blue-500 uppercase tracking-widest font-mono pl-0.5">
                      Viewport
                    </h3>
                    
                    {previewPdfUrl && previewTotalPages !== null && (
                      <div className="flex items-center gap-1 text-[10px] font-bold font-mono">
                        <button 
                          onClick={() => setPreviewCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={previewCurrentPage <= 1}
                          className={`p-1 rounded hover:bg-neutral-800/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span>
                          {previewCurrentPage} / {previewTotalPages}
                        </span>
                        <button 
                          onClick={() => setPreviewCurrentPage(prev => Math.min(previewTotalPages, prev + 1))}
                          disabled={previewCurrentPage >= previewTotalPages}
                          className={`p-1 rounded hover:bg-neutral-800/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* MAIN CANVAS ELEMENT */}
                  <div className="flex-1 flex items-center justify-center overflow-auto min-h-0 bg-neutral-100 dark:bg-[#121212] rounded-2xl relative p-3">
                    {previewPdfUrl ? (
                      <div className="origin-center shadow-md border rounded max-w-full overflow-auto max-h-[300px] flex items-center justify-center bg-white border-none">
                        <Document
                          file={previewPdfUrl}
                          onLoadSuccess={({ numPages }) => setPreviewTotalPages(numPages)}
                          loading={
                            <div className="flex flex-col items-center justify-center p-8 gap-2 text-gray-400">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                              <span className="text-[10px] font-bold">Rendering Document...</span>
                            </div>
                          }
                        >
                          <Page 
                            pageNumber={previewCurrentPage} 
                            scale={zoom}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 text-xs flex flex-col items-center justify-center">
                        <AlertCircle className="w-6 h-6 opacity-40 mb-1" />
                        <span>Rendering pipeline ready.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* OVERLAY: OFFLINE WORKSPACE PDF SELECTION DRAWER */}
      {showWorkspacePicker && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl border flex flex-col max-h-[85vh] animate-slide-up ${
            isDark ? 'bg-[#1E1E1E] border-gray-800 text-white' : 'bg-white border-[#E8EAED] text-gray-950 shadow-2xl'
          }`}>
            <header className="p-4 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-550" />
                <h3 className="text-sm font-extrabold">Pick PDFs from Workspace</h3>
              </div>
              <button 
                onClick={() => setShowWorkspacePicker(false)}
                className={`p-1 rounded-full cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {workspacePdfs.length === 0 ? (
                <div className="text-center p-8 text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-8 h-8 opacity-30" />
                  <span>No PDF files found in your local workspace list.</span>
                </div>
              ) : (
                workspacePdfs.map(wp => {
                  return (
                    <div
                      key={wp.id}
                      onClick={() => handleAddWorkspaceFile(wp)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                        isDark ? 'bg-gray-800/40 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold truncate leading-tight">{wp.name}</p>
                          <p className="text-[9px] text-gray-405 font-mono leading-none mt-1">
                            {formatBytes(wp.size)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        <button className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 text-[10px] font-bold rounded-full hover:bg-blue-100 transition-all cursor-pointer">
                          SELECT
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <footer className="p-3 border-t text-center text-[9px] text-gray-400 shrink-0">
              Only PDF format documents are filtered above.
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProtectPdf;
