import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorkspaceFile } from '../types/file';
import { pdfjs } from 'react-pdf';
import { Capacitor } from '@capacitor/core';

// Configure PDFJS Worker to match the one from react-pdf or the generic unpkg
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file?: WorkspaceFile;
  isDark?: boolean;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, isDark }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pagesWrapperRef = useRef<HTMLDivElement>(null);
  const fastScrollHandleRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Use refs to prevent unnecessary React re-renders that ruin scroll performance
  const stateRef = useRef<{
    pdfDoc: any,
    currentScale: number,
    pagePlaceholders: HTMLDivElement[],
    observer: IntersectionObserver | null,
    isAtTop: boolean,
    isAtBottom: boolean,
    zoomTimeout: any,
    lastPinchDist: number,
    isPinching: boolean,
    pinchFocalPoint: { x: number, y: number },
    isDraggingHandle: boolean,
    objectUrl?: string
  }>({
    pdfDoc: null,
    currentScale: 1.0,
    pagePlaceholders: [],
    observer: null,
    isAtTop: true,
    isAtBottom: false,
    zoomTimeout: null,
    lastPinchDist: 0,
    isPinching: false,
    pinchFocalPoint: { x: 0, y: 0 },
    isDraggingHandle: false
  });

  const showToastMsg = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => { setShowToast(false); }, 2500);
  }, []);

  const renderPage = useCallback(async (pageDiv: HTMLDivElement, pageNum: number) => {
      const scaleStr = String(stateRef.current.currentScale);
      if (pageDiv.dataset.renderedScale === scaleStr) return;
      if (pageDiv.dataset.isRendering === 'true') return; 
      
      pageDiv.dataset.isRendering = 'true'; 
      
      try {
          if (!stateRef.current.pdfDoc) return;
          const page = await stateRef.current.pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: stateRef.current.currentScale * 1.5 }); // 1.5x crispness
          
          let canvas = pageDiv.querySelector('canvas');
          if (!canvas) {
              canvas = document.createElement('canvas');
              canvas.className = 'max-w-full block rounded-md relative z-10 shadow-sm transition-opacity duration-300';
              canvas.style.height = 'auto'; 
              pageDiv.appendChild(canvas);
          }
          
          const context = canvas.getContext('2d');
          if (!context) return;
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
              canvasContext: context,
              viewport: viewport
          };
          
          await page.render(renderContext).promise;
          pageDiv.dataset.renderedScale = String(stateRef.current.currentScale);
          
          const loadingText = pageDiv.querySelector('.page-loading-text') as HTMLDivElement;
          if(loadingText) loadingText.style.display = 'none';

      } catch (err) {
          console.error(`Page ${pageNum} render failed:`, err);
      } finally {
          pageDiv.dataset.isRendering = 'false'; 
      }
  }, []);

  const setupIntersectionObserver = useCallback(() => {
      const pdfContainer = pdfContainerRef.current;
      if (stateRef.current.observer) stateRef.current.observer.disconnect();
      if (!pdfContainer) return;
      
      const options = {
          root: pdfContainer,
          rootMargin: '600px 0px', 
          threshold: 0
      };

      stateRef.current.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  const pageDiv = entry.target as HTMLDivElement;
                  const pageNum = parseInt(pageDiv.dataset.pageNumber || '1');
                  renderPage(pageDiv, pageNum);
              }
          });
      }, options);

      stateRef.current.pagePlaceholders.forEach(div => stateRef.current.observer?.observe(div));
  }, [renderPage]);

  // Handle PDF Document Loading
  useEffect(() => {
    if (!file) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
          console.log("[PdfViewer Diagnostic] Triggered loadData for:", file.name);
          console.log("[PdfViewer Diagnostic] file.uri:", file.uri || "undefined");
          console.log("[PdfViewer Diagnostic] file.size (metadata):", file.size);
          console.log("[PdfViewer Diagnostic] file.mimeType (metadata):", file.mimeType);

          let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
          console.log("[PdfViewer Diagnostic] Is file.blob initially defined?", !!file.blob);
          console.log("[PdfViewer Diagnostic] Is file.blob an instance of Blob?", file.blob instanceof Blob);
          
          if (file.blob && !(file.blob instanceof Blob)) {
             console.log("[PdfViewer Diagnostic] Warning: file.blob is defined but not a Blob. constructor:", (file.blob as any).constructor?.name, "JSON stringified:", JSON.stringify(file.blob));
          }

          if (!finalBlob) {
             try {
                console.log("[PdfViewer Diagnostic] finalBlob not found on file.blob, recovering via AndroidStorage.openFile...");
                const { AndroidStorage } = await import('../integrations/AndroidStorage');
                finalBlob = await AndroidStorage.openFile(file);
                console.log("[PdfViewer Diagnostic] AndroidStorage.openFile returned:", finalBlob ? `Blob of size ${finalBlob.size}` : "null");
             } catch (e) {
                console.warn("[PdfViewer] AndroidStorage read failed:", e);
             }
          }

          if (finalBlob) {
             console.log("[PdfViewer Diagnostic] Successfully resolved finalBlob!");
             console.log("[PdfViewer Diagnostic] finalBlob.size:", finalBlob.size);
             console.log("[PdfViewer Diagnostic] finalBlob.type:", finalBlob.type);

             // Read the first 20 bytes to verify magic header
             try {
                 const reader = new FileReader();
                 reader.onload = () => {
                     const buffer = reader.result as ArrayBuffer;
                     const arr = new Uint8Array(buffer);
                     let headerStr = "";
                     for (let i = 0; i < Math.min(arr.length, 20); i++) {
                         headerStr += String.fromCharCode(arr[i]);
                     }
                     console.log("[PdfViewer Diagnostic] First 20 bytes of file:", JSON.stringify(headerStr));
                     console.log("[PdfViewer Diagnostic] Header starts with %PDF-?", headerStr.startsWith("%PDF-"));
                 };
                 reader.readAsArrayBuffer(finalBlob.slice(0, 20));
             } catch (err) {
                 console.error("[PdfViewer Diagnostic] Failed to read first 20 bytes of blob:", err);
             }

             try {
                 console.log("[PdfViewer Diagnostic] Converting blob to ArrayBuffer for memory loading...");
                 const arrayBuffer = await finalBlob.arrayBuffer();
                 const uint8Array = new Uint8Array(arrayBuffer);
                 console.log("[PdfViewer Diagnostic] Passing preloaded Uint8Array directly to pdfjs. Size:", uint8Array.length);
                 loadPDF({ data: uint8Array });
                 return;
             } catch (err) {
                 console.warn("[PdfViewer Diagnostic] ArrayBuffer loading failed, returning to blob URL fallback:", err);
                 const url = URL.createObjectURL(finalBlob);
                 console.log("[PdfViewer Diagnostic] URL.createObjectURL fallback returned url:", url);
                 stateRef.current.objectUrl = url; // Store to revoke later
                 loadPDF({ url });
                 return;
             }
          } else if (file.uri && !file.uri.startsWith('file:///simulated_root')) {
             const convertedSrc = file.uri.startsWith('http') ? file.uri : Capacitor.convertFileSrc(file.uri);
             console.log("[PdfViewer Diagnostic] No finalBlob resolved. Using file.uri directly:", convertedSrc);
             loadPDF({ url: convertedSrc });
             return;
          }
          
          throw new Error("No valid file content provided.");
      } catch(e: any) {
          console.error("Failed to load file:", e);
          setLoading(false);
          setError(e.message || "Failed to load PDF file.");
          showToastMsg(`Failed to load file: ${e.message}`);
      }
    };

    // Reset UI before loading new file
    if (pagesWrapperRef.current) {
        pagesWrapperRef.current.innerHTML = '';
        pagesWrapperRef.current.style.width = '100%';
    }
    if (pdfContainerRef.current) {
        pdfContainerRef.current.scrollTo(0, 0);
    }
    stateRef.current.currentScale = 1.0;
    
    loadData();
    
    async function loadPDF(source: any) {
        try {
            const doc = await pdfjs.getDocument(source).promise;
            stateRef.current.pdfDoc = doc;
            
            setTimeout(async () => {
                await createPagePlaceholders(doc.numPages);
                setupIntersectionObserver();
                setLoading(false);
            }, 50);

        } catch (err: any) {
            console.error("Error rendering PDF:", err);
            setLoading(false);
            setError(err.message || "Error rendering or parsing the PDF file.");
            showToastMsg("Error loading document.");
        }
    }

    async function createPagePlaceholders(numPages: number) {
        const pagesWrapper = pagesWrapperRef.current;
        const pdfContainer = pdfContainerRef.current;
        if (!pagesWrapper || !pdfContainer || !stateRef.current.pdfDoc) return;
        
        pagesWrapper.innerHTML = '';
        stateRef.current.pagePlaceholders = [];
        
        const page1 = await stateRef.current.pdfDoc.getPage(1);
        const viewport1 = page1.getViewport({ scale: 1.0 });
        const aspectRatio = viewport1.height / viewport1.width;

        const containerWidth = pdfContainer.clientWidth > 0 ? pdfContainer.clientWidth : window.innerWidth;
        const appxWidth = containerWidth * 0.96; 

        for (let i = 1; i <= numPages; i++) {
            const pageDiv = document.createElement('div');
            
            pageDiv.className = `${isDark ? 'bg-[#18181B] shadow-[0_2px_8px_rgba(0,0,0,0.4)]' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]'} relative flex justify-center items-center rounded-md overflow-hidden`;
            pageDiv.style.margin = '8px auto';
            pageDiv.style.width = '96%';
            pageDiv.style.transition = 'width 0.1s ease-out';
            pageDiv.dataset.pageNumber = String(i);
            pageDiv.dataset.isRendering = 'false'; 
            
            pageDiv.style.minHeight = `${appxWidth * Math.max(1, aspectRatio)}px`;
            
            const loadingText = document.createElement('div');
            loadingText.className = `page-loading-text absolute font-semibold text-xl md:text-2xl z-0 ${isDark ? 'text-zinc-700' : 'text-gray-300'}`;
            loadingText.textContent = `Loading Page ${i}...`;
            pageDiv.appendChild(loadingText);

            // Add page numbers at the very bottom-left of each page
            const pageNumText = document.createElement('div');
            pageNumText.className = `absolute bottom-3 left-3 z-20 font-mono text-xs font-semibold px-2.5 py-1 rounded-md select-none pointer-events-none transition-all border ${
                isDark 
                    ? 'text-zinc-300 bg-zinc-950/80 border-zinc-800/30 shadow-[0_2px_6px_rgba(0,0,0,0.5)]' 
                    : 'text-zinc-700 bg-white/85 border-zinc-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
            }`;
            pageNumText.textContent = String(i);
            pageDiv.appendChild(pageNumText);

            pagesWrapper.appendChild(pageDiv);
            stateRef.current.pagePlaceholders.push(pageDiv);
        }
    }

    return () => {
        if (stateRef.current.observer) stateRef.current.observer.disconnect();
        if (stateRef.current.objectUrl) URL.revokeObjectURL(stateRef.current.objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, retryTrigger]);

  // Touch and Wheel interactions setup
  useEffect(() => {
     const pdfContainer = pdfContainerRef.current;
     const fastScrollHandle = fastScrollHandleRef.current;
     const viewerScreen = viewerRef.current;
     const pagesWrapper = pagesWrapperRef.current;
     if (!pdfContainer || !fastScrollHandle || !viewerScreen || !pagesWrapper) return;

     const zoomSensitivity = 0.08; 

     // Touch Zooming
     const handleTouchStart = (e: TouchEvent) => {
         if (e.touches.length === 2) {
             stateRef.current.isPinching = true;
             stateRef.current.lastPinchDist = Math.hypot(
                 e.touches[0].clientX - e.touches[1].clientX,
                 e.touches[0].clientY - e.touches[1].clientY
             );

             const rect = pdfContainer.getBoundingClientRect();
             stateRef.current.pinchFocalPoint = {
                 x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
                 y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
             };
         }
     };

     const handleTouchMove = (e: TouchEvent) => {
         if (stateRef.current.isPinching && e.touches.length === 2) {
             e.preventDefault(); 
             
             const currentDist = Math.hypot(
                 e.touches[0].clientX - e.touches[1].clientX,
                 e.touches[0].clientY - e.touches[1].clientY
             );
             
             if (Math.abs(currentDist - stateRef.current.lastPinchDist) < 1.5) return;
             
             const ratio = currentDist / stateRef.current.lastPinchDist;
             const dampedRatio = 1 + (ratio - 1) * zoomSensitivity;
             
             const newScale = Math.min(Math.max(1.0, stateRef.current.currentScale * dampedRatio), 4.0);
             
             const rect = pdfContainer.getBoundingClientRect();
             const currentFocalPoint = {
                 x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
                 y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
             };

             if (newScale !== stateRef.current.currentScale || currentFocalPoint.x !== stateRef.current.pinchFocalPoint.x || currentFocalPoint.y !== stateRef.current.pinchFocalPoint.y) {
                 const scaleRatio = newScale / stateRef.current.currentScale;
                 
                 const docX = stateRef.current.pinchFocalPoint.x + pdfContainer.scrollLeft;
                 const docY = stateRef.current.pinchFocalPoint.y + pdfContainer.scrollTop;
                 
                 stateRef.current.currentScale = newScale;
                 
                 if (stateRef.current.currentScale > 1.0) {
                     pdfContainer.classList.remove('overflow-x-hidden');
                     pdfContainer.classList.add('overflow-x-auto');
                 } else {
                     pdfContainer.classList.remove('overflow-x-auto');
                     pdfContainer.classList.add('overflow-x-hidden');
                 }
                 
                 pagesWrapper.style.width = `${stateRef.current.currentScale * 100}%`;
                 
                 pdfContainer.scrollLeft = (docX * scaleRatio) - currentFocalPoint.x;
                 pdfContainer.scrollTop = (docY * scaleRatio) - currentFocalPoint.y;

                 stateRef.current.pinchFocalPoint = currentFocalPoint;
                 stateRef.current.lastPinchDist = currentDist; 
             }
         }
     };

     const handleTouchEnd = (e: TouchEvent) => {
         if (stateRef.current.isPinching && e.touches.length < 2) {
             stateRef.current.isPinching = false;
             setupIntersectionObserver(); 
         }
     };

     // Desktop Mouse Wheel Zooming
     const handleWheel = (e: WheelEvent) => {
         if (e.ctrlKey || e.metaKey) {
             e.preventDefault();
             
             const rect = pdfContainer.getBoundingClientRect();
             const mouseX = e.clientX - rect.left;
             const mouseY = e.clientY - rect.top;
             
             const docX = mouseX + pdfContainer.scrollLeft;
             const docY = mouseY + pdfContainer.scrollTop;

             const oldScale = stateRef.current.currentScale;
             if (e.deltaY < 0) {
                 stateRef.current.currentScale = Math.min(stateRef.current.currentScale + 0.2, 4.0);
             } else {
                 stateRef.current.currentScale = Math.max(stateRef.current.currentScale - 0.2, 1.0);
             }
             
             if (oldScale !== stateRef.current.currentScale) {
                 const scaleRatio = stateRef.current.currentScale / oldScale;

                 if (stateRef.current.currentScale > 1.0) {
                     pdfContainer.classList.remove('overflow-x-hidden');
                     pdfContainer.classList.add('overflow-x-auto');
                 } else {
                     pdfContainer.classList.remove('overflow-x-auto');
                     pdfContainer.classList.add('overflow-x-hidden');
                 }

                 pagesWrapper.style.width = `${stateRef.current.currentScale * 100}%`;
                 
                 pdfContainer.scrollLeft = (docX * scaleRatio) - mouseX;
                 pdfContainer.scrollTop = (docY * scaleRatio) - mouseY;
                 
                 clearTimeout(stateRef.current.zoomTimeout);
                 stateRef.current.zoomTimeout = setTimeout(() => {
                     setupIntersectionObserver();
                 }, 150);
             }
         }
     };

     // WPS-Style Fast Scroll Handle
     function updateScrollFromHandle(clientY: number) {
         if (!viewerScreen || !pdfContainer) return;
         const rect = viewerScreen.getBoundingClientRect();
         const trackHeight = rect.height;
         let y = Math.max(0, Math.min(clientY, trackHeight));
         const percentage = y / trackHeight;
         
         const maxScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight;
         if (maxScroll > 0) {
            pdfContainer.scrollTop = maxScroll * percentage;
         }
     }

     const handleHandleMouseDown = (e: MouseEvent) => { stateRef.current.isDraggingHandle = true; };
     const handleMouseMove = (e: MouseEvent) => {
         if (stateRef.current.isDraggingHandle) updateScrollFromHandle(e.clientY);
     };
     const handleMouseUp = () => { stateRef.current.isDraggingHandle = false; };

     const handleHandleTouchStart = (e: TouchEvent) => { 
         stateRef.current.isDraggingHandle = true; 
         e.preventDefault();
     };
     const handleWindowTouchMove = (e: TouchEvent) => {
         if (stateRef.current.isDraggingHandle) updateScrollFromHandle(e.touches[0].clientY);
     };
     const handleWindowTouchEnd = () => { stateRef.current.isDraggingHandle = false; };

     const handleScroll = () => {
         if (!stateRef.current.isDraggingHandle && pdfContainer.scrollHeight > 0) {
             const maxScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight;
             if (maxScroll > 0) {
                 const percentage = pdfContainer.scrollTop / maxScroll;
                 const rect = viewerScreen.getBoundingClientRect();
                 const handleY = percentage * rect.height;
                 
                 const boundedY = Math.max(30, Math.min(handleY, rect.height - 30));
                 fastScrollHandle.style.top = `${boundedY}px`;
                 fastScrollHandle.style.transform = `translateY(-50%)`;
             }
         }
         
         const scrollY = pdfContainer.scrollTop;
         const maxScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight;
         const atBottomBuffer = Math.max(5, (pdfContainer.clientHeight * 0.05)); // 5% buffer from the bottom to prevent off-by-one jitter
         
         if (scrollY <= 0 && !stateRef.current.isAtTop) {
             stateRef.current.isAtTop = true;
             // Limit showing toast if document is extremely small
             if (maxScroll > 50) {}
         } else if (scrollY > 0) {
             stateRef.current.isAtTop = false;
         }

         if (maxScroll > 50 && scrollY >= maxScroll - atBottomBuffer && !stateRef.current.isAtBottom) {
             stateRef.current.isAtBottom = true;
             {}
         } else if (maxScroll <= 50 || scrollY < maxScroll - atBottomBuffer) {
             stateRef.current.isAtBottom = false;
         }
     };

     // Attach Listeners
     pdfContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
     pdfContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
     pdfContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
     pdfContainer.addEventListener('wheel', handleWheel, { passive: false });
     pdfContainer.addEventListener('scroll', handleScroll, { passive: true });

     fastScrollHandle.addEventListener('mousedown', handleHandleMouseDown);
     fastScrollHandle.addEventListener('touchstart', handleHandleTouchStart, { passive: false });
     
     window.addEventListener('mousemove', handleMouseMove);
     window.addEventListener('mouseup', handleMouseUp);
     window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
     window.addEventListener('touchend', handleWindowTouchEnd);

     return () => {
         pdfContainer.removeEventListener('touchstart', handleTouchStart);
         pdfContainer.removeEventListener('touchmove', handleTouchMove);
         pdfContainer.removeEventListener('touchend', handleTouchEnd);
         pdfContainer.removeEventListener('wheel', handleWheel);
         pdfContainer.removeEventListener('scroll', handleScroll);

         fastScrollHandle.removeEventListener('mousedown', handleHandleMouseDown);
         fastScrollHandle.removeEventListener('touchstart', handleHandleTouchStart);
         
         window.removeEventListener('mousemove', handleMouseMove);
         window.removeEventListener('mouseup', handleMouseUp);
         window.removeEventListener('touchmove', handleWindowTouchMove);
         window.removeEventListener('touchend', handleWindowTouchEnd);
     };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`h-full w-full relative flex flex-col ${isDark ? 'bg-[#121212] text-slate-100' : 'bg-[#E3E3E3] text-slate-800'}`}>
        
        {error ? (
          <div className={`max-w-md p-6 rounded-2xl border text-center m-auto flex flex-col items-center gap-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-lg z-30`}>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide -alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16"/></svg>
            </div>
            <h3 className="font-bold text-lg select-none">Unable to render PDF</h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">{error}</p>
            <button 
              onClick={() => {
                setRetryTrigger(prev => prev + 1);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FF2D55] hover:bg-[#FF2D55]/90 rounded-xl transition shadow-md shadow-rose-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 10 10 0 0 1 6.74 2.74L21 8"/><path d="M16 3h5v5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 10 10 0 0 1-6.74-2.74L3 16"/><path d="M8 21H3v-5"/></svg>
              Try Again
            </button>
          </div>
        ) : (
          /* Document Viewer Screen */
          <div ref={viewerRef} className="flex-col h-full w-full absolute inset-0 z-20 flex">
            
            {/* Scrollable Document Container */}
            <div 
              ref={pdfContainerRef}
              id="pdf-container" 
              className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full pb-10 scroll-smooth shadow-inner" 
              style={{ touchAction: 'pan-x pan-y', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
                {/* Pages Wrapper */}
                <div ref={pagesWrapperRef} id="pages-wrapper" className="py-2 relative w-full mx-auto">
                    {/* PDF Pages Injected Here dynamically via purely native DOM updates to preserve 60FPS fluid touch scrolling */}
                </div>
            </div>

            {/* Fast Scroll Handle */}
            <div 
              ref={fastScrollHandleRef}
              className="shadow-[0_4px_12px_rgba(0,0,0,0.3)] absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-[4px] p-[10px_5px] rounded border border-white/10 z-50 flex flex-col gap-1 cursor-pointer hover:bg-black/70 active:bg-black transition-colors"
              style={{ touchAction: 'none' }}
            >
                <div className="w-[10px] h-[2px] bg-white rounded-[2px]" />
                <div className="w-[10px] h-[2px] bg-white rounded-[2px]" />
                <div className="w-[10px] h-[2px] bg-white rounded-[2px]" />
            </div>

            {/* Boundary Toast */}
            {showToast && (
              <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 bg-[#282828]/95 border border-white/5 shadow-2xl text-white font-medium tracking-wide py-2.5 px-6 rounded-full text-xs z-[100] transition-all duration-300 pointer-events-none transform translate-y-0 opacity-100 whitespace-nowrap">
                  {toastMsg}
              </div>
            )}
        </div>

        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#E3E3E3]/80 dark:bg-[#121212]/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none transition-all duration-300">
              <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#FF2D55]/20 border-t-[#FF2D55] animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-[#FF2D55]/10 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-slate-800 dark:text-zinc-200 tracking-widest uppercase">Rendering Canvas Context...</p>
          </div>
        )}

        {/* Global style for hiding scrollbar of container since CSS config isn't guaranteed natively */}
        <style dangerouslySetInnerHTML={{__html: `
          #pdf-container::-webkit-scrollbar {
              display: none !important;
          }
        `}} />
    </div>
  );
};

export default PdfViewer;
