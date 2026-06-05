export type GlobalFileCategory = 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'epub' | 'image' | 'audio' | 'video' | 'archive' | 'code' | 'other';

export const getCategoryFromExtension = (extension: string): GlobalFileCategory => {
  const extMap: Record<string, GlobalFileCategory> = {
    'pdf': 'pdf',
    'doc': 'doc', 'docx': 'doc',
    'xls': 'xls', 'xlsx': 'xls',
    'ppt': 'ppt', 'pptx': 'ppt',
    'txt': 'txt', 'csv': 'txt', 'md': 'txt',
    'epub': 'epub',
    'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image',
    'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
    'mp4': 'video', 'webm': 'video', 'mkv': 'video', 
    'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
    'json': 'code', 'xml': 'code', 'js': 'code', 'ts': 'code', 'html': 'code', 'css': 'code'
  };

  return extMap[extension.toLowerCase()] || 'other';
};
