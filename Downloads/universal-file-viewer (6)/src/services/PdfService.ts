import { Capacitor } from '@capacitor/core';
import { WorkspaceFile } from '../types/file';

export class PdfService {
  static async convertDocToPdf(file: WorkspaceFile): Promise<WorkspaceFile> {
    const { jsPDF } = await import('jspdf');
    const { default: mammoth } = await import('mammoth');
    
    let text = '';
    let finalBlob = file.blob;
    if (!finalBlob && file.uri) {
       const res = await fetch(Capacitor.convertFileSrc(file.uri));
       finalBlob = await res.blob();
    }

    if (file.name.toLowerCase().endsWith('.docx') && finalBlob) {
      const buffer = await finalBlob.arrayBuffer();
      const r = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = r.value;
    } else if (file.name.toLowerCase().endsWith('.pptx') && finalBlob) {
       text = "Converted from presentation: " + file.name; 
    } else {
       throw new Error("Unsupported format for direct text conversion");
    }
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const m = 10;
    const w = 190;
    const lines = pdf.splitTextToSize(text || ("Converted File: " + file.name), w);
    let cursorY = 20;
    for (let i = 0; i < lines.length; i++) {
      if (cursorY > 280) {
         pdf.addPage();
         cursorY = 20;
      }
      pdf.text(lines[i], m, cursorY);
      cursorY += 7;
    }
    const newBlob = pdf.output('blob');
    return {
       id: 'file-' + Math.random().toString(36).substr(2, 9),
       name: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
       path: file.path || '/',
       category: 'pdf',
       size: newBlob.size,
       mimeType: 'application/pdf',
       blob: newBlob,
       lastModified: Date.now(),
       isFavorite: false,
       isPinned: false
    };
  }

  static async generatePdfFromImages(
    images: { file: File; rotation: number }[],
    onProgress?: (progress: number, status: string) => void
  ): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    
    if (onProgress) onProgress(5, 'Initializing PDF renderer...');
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    
    const fileToCanvas = (file: File | Blob): Promise<HTMLCanvasElement> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas);
            } else {
              reject(new Error("Could not get canvas 2D context"));
            }
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });
    };

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      if (onProgress) {
        const percent = Math.round(5 + (i / images.length) * 85);
        onProgress(percent, `Rendering and preparing Page ${i + 1} of ${images.length}...`);
      }

      const imgCanvas = await fileToCanvas(item.file);
      let outputCanvas = imgCanvas;
      const normRotation = item.rotation % 360;

      if (normRotation !== 0) {
        outputCanvas = document.createElement('canvas');
        const ctx = outputCanvas.getContext('2d');
        if (normRotation === 90 || normRotation === 270) {
          outputCanvas.width = imgCanvas.height;
          outputCanvas.height = imgCanvas.width;
        } else {
          outputCanvas.width = imgCanvas.width;
          outputCanvas.height = imgCanvas.height;
        }

        if (ctx) {
          ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
          ctx.rotate((normRotation * Math.PI) / 180);
          ctx.drawImage(imgCanvas, -imgCanvas.width / 2, -imgCanvas.height / 2);
        }
      }

      const jpegUrl = outputCanvas.toDataURL('image/jpeg', 0.90);

      if (i > 0) {
        pdf.addPage();
      }

      let targetW = pageWidth - (margin * 2);
      let targetH = pageHeight - (margin * 2);
      const imgRatio = outputCanvas.width / outputCanvas.height;
      const pageRatio = targetW / targetH;

      if (imgRatio > pageRatio) {
        targetH = targetW / imgRatio;
      } else {
        targetW = targetH * imgRatio;
      }

      const posX = margin + (pageWidth - (margin * 2) - targetW) / 2;
      const posY = margin + (pageHeight - (margin * 2) - targetH) / 2;

      pdf.addImage(jpegUrl, 'JPEG', posX, posY, targetW, targetH);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (onProgress) onProgress(95, 'Saving compiled PDF document...');
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  }

  static async extractImagesFromPdf(
    file: File | Blob,
    onProgress?: (progress: number, status: string) => void
  ): Promise<Blob[]> {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    if (onProgress) onProgress(5, 'Loading PDF structure...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    
    const numPages = pdfDocument.numPages;
    const extractedImages: Blob[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) onProgress(10 + ((pageNum / numPages) * 80), `Extracting page ${pageNum} of ${numPages}...`);
      
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); 

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (blob) {
        extractedImages.push(blob);
      }
    }

    if (onProgress) onProgress(95, 'Finalizing images...');
    return extractedImages;
  }
}

