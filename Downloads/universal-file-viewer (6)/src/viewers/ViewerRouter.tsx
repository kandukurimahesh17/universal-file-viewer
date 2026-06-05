import React from 'react';
import { WorkspaceFile } from '../types/file';
import { ViewerRegistry } from '../core/ViewerRegistry';

import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';
import XlsxViewer from './XlsxViewer';
import PptxViewer from './PptxViewer';
import TxtViewer from './TxtViewer';
import HtmlViewer from './HtmlViewer';
import XmlViewer from './XmlViewer';
import CsvViewer from './CsvViewer';
import JsonViewer from './JsonViewer';
import MarkdownViewer from './MarkdownViewer';
import EpubViewer from './EpubViewer';
import RtfViewer from './RtfViewer';
import OdtViewer from './OdtViewer';
import OdsViewer from './OdsViewer';
import OdpViewer from './OdpViewer';
import ImageViewer from './ImageViewer';
import AudioViewer from './AudioViewer';
import VideoViewer from './VideoViewer';
import ZipViewer from './ZipViewer';
import ApkViewer from './ApkViewer';
import UnknownViewer from './UnknownViewer';

// Register all viewers inside ViewerRegistry
ViewerRegistry.register('pdf', PdfViewer);
ViewerRegistry.register('docx', DocxViewer);
ViewerRegistry.register('xlsx', XlsxViewer);
ViewerRegistry.register('pptx', PptxViewer);
ViewerRegistry.register('txt', TxtViewer);
ViewerRegistry.register('html', HtmlViewer);
ViewerRegistry.register('xml', XmlViewer);
ViewerRegistry.register('csv', CsvViewer);
ViewerRegistry.register('json', JsonViewer);
ViewerRegistry.register('md', MarkdownViewer);
ViewerRegistry.register('epub', EpubViewer);
ViewerRegistry.register('rtf', RtfViewer);
ViewerRegistry.register('odt', OdtViewer);
ViewerRegistry.register('ods', OdsViewer);
ViewerRegistry.register('odp', OdpViewer);
ViewerRegistry.register('image', ImageViewer);
ViewerRegistry.register('audio', AudioViewer);
ViewerRegistry.register('video', VideoViewer);
ViewerRegistry.register('zip', ZipViewer);
ViewerRegistry.register('apk', ApkViewer);
ViewerRegistry.register('unknown', UnknownViewer);

interface ViewerRouterProps {
  file: WorkspaceFile;
  isDark: boolean;
  downloadBlob: (blob: Blob, name: string) => void;
}

export const ViewerRouter: React.FC<ViewerRouterProps> = ({ file, isDark, downloadBlob }) => {
  const nameLower = file.name.toLowerCase();
  const ext = nameLower.split('.').pop() || '';

  // 1. Determine viewer key from extension or category
  let viewerKey = '';
  
  if (ext === 'pdf') viewerKey = 'pdf';
  else if (ext === 'docx') viewerKey = 'docx';
  else if (ext === 'xlsx' || ext === 'xls') viewerKey = 'xlsx';
  else if (ext === 'pptx' || ext === 'ppt') viewerKey = 'pptx';
  else if (ext === 'txt') viewerKey = 'txt';
  else if (ext === 'html') viewerKey = 'html';
  else if (ext === 'xml') viewerKey = 'xml';
  else if (ext === 'csv') viewerKey = 'csv';
  else if (ext === 'json') viewerKey = 'json';
  else if (ext === 'md' || ext === 'markdown') viewerKey = 'md';
  else if (ext === 'epub') viewerKey = 'epub';
  else if (ext === 'rtf') viewerKey = 'rtf';
  else if (ext === 'odt') viewerKey = 'odt';
  else if (ext === 'ods') viewerKey = 'ods';
  else if (ext === 'odp') viewerKey = 'odp';
  else if (ext === 'apk') viewerKey = 'apk';
  else if (file.category === 'image') viewerKey = 'image';
  else if (file.category === 'audio') viewerKey = 'audio';
  else if (file.category === 'video') viewerKey = 'video';
  else if (file.category === 'archive' || ext === 'zip') viewerKey = 'zip';

  // 2. Fetch from registry
  const RegisteredComponent = viewerKey ? ViewerRegistry.getViewer(viewerKey) : undefined;

  if (RegisteredComponent) {
    return <RegisteredComponent file={file} isDark={isDark} />;
  }

  // 3. Fallback for files we can't render
  const UnknownComp = ViewerRegistry.getViewer('unknown') || UnknownViewer;
  return <UnknownComp file={file} isDark={isDark} />;
};

export default ViewerRouter;
