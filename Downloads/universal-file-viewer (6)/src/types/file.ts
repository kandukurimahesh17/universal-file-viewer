export type FileCategory = 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'epub' | 'image' | 'audio' | 'video' | 'archive' | 'code' | 'other' | 'folder';

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  category: FileCategory;
  size: number;
  mimeType: string;
  blob?: File | Blob;
  uri?: string;
  lastModified?: number;
  createdAt?: number;
  lastAccessedAt?: number;
  isDirectory?: boolean;
  folderId?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export type SortField = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
