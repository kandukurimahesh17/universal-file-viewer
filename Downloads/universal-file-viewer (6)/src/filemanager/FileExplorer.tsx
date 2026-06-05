import React, { useState, useMemo } from 'react';
import { WorkspaceFile } from '../App';
import { ViewMode, SortField, SortOrder } from '../types/file';
import FileCard from '../components/FileCard';
import { 
  Folder, Search, X, FileText, FileSpreadsheet, PlayCircle, BookOpen, 
  Image as ImageIcon, Volume2, Sparkles, Grid, List as ListIcon,
  Video, Archive, Code, Music as MusicIcon
} from 'lucide-react';
import { SearchEngine } from '../search/SearchEngine';
import { FileSearch } from '../search/FileSearch';

interface FileExplorerProps {
  files: WorkspaceFile[];
  isDark: boolean;
  onOpenFile: (file: WorkspaceFile) => void;
  getFileUrl: (file: WorkspaceFile) => string;
  isSelectMode: boolean;
  setIsSelectMode: (mode: boolean) => void;
  selectedFileIds: Set<string>;
  setSelectedFileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleFilePressStart: (id: string) => void;
  handleFilePressEnd: () => void;
  toggleSelection: (id: string) => void;
  bulkDelete: () => void;
  fileMenuOpen: string | null;
  setFileMenuOpen: (id: string | null) => void;
  renameFile: (id: string) => void;
  convertDocToPdf: (file: WorkspaceFile) => void;
  openToolOverlay?: (toolId: string, file: WorkspaceFile) => void;
  convertPdfToImages: (file: WorkspaceFile) => void;
  extractZipFile: (file: WorkspaceFile) => void;
  downloadBlob: (blob: Blob, name: string) => void;
  shareFile: (file: WorkspaceFile) => void;
  deleteFile: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subCategory: string;
  setSubCategory: (sub: string) => void;
}

const SortIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H21V8H3V6ZM3 11H17V13H3V11ZM3 16H13V18H3V16Z" fill="currentColor"/>
    <path d="M19 11V20M19 20L16 17M19 20L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, isDark, onOpenFile, getFileUrl,
  isSelectMode, selectedFileIds,
  handleFilePressStart, handleFilePressEnd, toggleSelection,
  fileMenuOpen, setFileMenuOpen, renameFile, convertDocToPdf, openToolOverlay, convertPdfToImages, extractZipFile,
  downloadBlob, shareFile, deleteFile, toggleFavorite, togglePin,
  categoryFilter, setSearchQuery, searchQuery, subCategory, setSubCategory
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Sort Bottom Sheet state
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [tempSortField, setTempSortField] = useState<SortField>('name');
  const [tempSortOrder, setTempSortOrder] = useState<SortOrder>('asc');

  // Sub-categories list
  const subCategories = useMemo(() => [
    { id: 'all', label: 'All', icon: Sparkles, color: 'blue' },
    { id: 'pdf', label: 'PDF', icon: FileText, color: 'red' },
    { id: 'word', label: 'Word', icon: FileText, color: 'blue' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'green' },
    { id: 'ppt', label: 'PPT', icon: PlayCircle, color: 'orange' },
    { id: 'ebook', label: 'Ebook', icon: BookOpen, color: 'purple' },
    { id: 'image', label: 'Image', icon: ImageIcon, color: 'teal' },
    { id: 'audio', label: 'Audio', icon: MusicIcon, color: 'pink' },
    { id: 'video', label: 'Video', icon: Video, color: 'red' },
    { id: 'zip', label: 'Zip', icon: Archive, color: 'gray' },
    { id: 'code', label: 'Code', icon: Code, color: 'blue' },
  ], []);

  // Filter actual files, ignoring any directory/folder items if any exist
  const actualFilesOnly = useMemo(() => {
    return files.filter(f => f.category !== 'folder' && !f.isDirectory);
  }, [files]);

  // Master documents filtering
  const filteredByCategoryAndSearch = useMemo(() => {
    // Search mode override
    if (searchQuery) {
      const results = FileSearch.search(SearchEngine.getIndex(), {
        query: searchQuery,
        category: categoryFilter === 'documents' || categoryFilter === 'all' ? undefined : categoryFilter
      });
      let matchedFiles = results.map(r => r.file);
      if (categoryFilter === 'documents') {
        matchedFiles = matchedFiles.filter(f => ['pdf', 'doc', 'xls', 'ppt', 'txt'].includes(f.category));
      }
      return matchedFiles.filter(f => f.category !== 'folder' && !f.isDirectory);
    }

    // Browsing/category filtering mode
    return actualFilesOnly.filter(f => {
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'documents') {
          return ['pdf', 'doc', 'xls', 'ppt', 'txt'].includes(f.category);
        }
        if (categoryFilter === 'recent') {
          return true; // We'll force sort recent files by date desc
        }
        if (categoryFilter === 'favorites') {
          return !!f.isFavorite;
        }
        if (categoryFilter === 'downloads') {
          return f.category === 'archive' || f.category === 'pdf' || f.name.toLowerCase().includes('guide') || f.name.toLowerCase().includes('archive');
        }
        return f.category === categoryFilter;
      }
      return true;
    });
  }, [actualFilesOnly, searchQuery, categoryFilter]);

  // Helper to extract file extension
  const getFileExt = (name: string) => name.split('.').pop()?.toLowerCase() || '';

  // Matches item with tabs sub-category selection
  const matchesSubCategory = (file: WorkspaceFile, subCat: string) => {
    if (subCat === 'all') return true;
    const ext = getFileExt(file.name);
    
    if (subCat === 'pdf') {
      return ext === 'pdf' || file.category === 'pdf';
    }
    if (subCat === 'word') {
      return ['doc', 'docx', 'txt', 'rtf'].includes(ext) || ['doc', 'docx', 'text', 'txt'].includes(file.category);
    }
    if (subCat === 'excel') {
      return ['xls', 'xlsx', 'csv'].includes(ext) || ['xls', 'xlsx'].includes(file.category);
    }
    if (subCat === 'ppt') {
      return ['ppt', 'pptx'].includes(ext) || ['ppt', 'pptx', 'presentation'].includes(file.category);
    }
    if (subCat === 'ebook') {
      return ['epub', 'mobi'].includes(ext) || (ext === 'pdf' && (file.name.toLowerCase().includes('guide') || file.name.toLowerCase().includes('roadmap') || file.name.toLowerCase().includes('book')));
    }
    if (subCat === 'image') {
      return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext) || file.category === 'image';
    }
    if (subCat === 'audio') {
      return ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext) || file.category === 'audio';
    }
    if (subCat === 'video') {
      return ['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp'].includes(ext) || file.category === 'video';
    }
    if (subCat === 'zip') {
      return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'zipx', 'tar.gz'].includes(ext) || file.category === 'archive';
    }
    if (subCat === 'code') {
      return ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c', 'sh', 'sql', 'xml', 'md'].includes(ext) || file.category === 'code';
    }
    return true;
  };

  const matchedSubCategoryFiles = useMemo(() => {
    return filteredByCategoryAndSearch.filter(file => matchesSubCategory(file, subCategory));
  }, [filteredByCategoryAndSearch, subCategory]);

  const sortedFiles = useMemo(() => {
    const effectiveSortField = categoryFilter === 'recent' ? 'date' : sortField;
    const effectiveSortOrder = categoryFilter === 'recent' ? 'desc' : sortOrder;

    return [...matchedSubCategoryFiles].sort((a, b) => {
      let result = 0;
      if (effectiveSortField === 'name') result = a.name.localeCompare(b.name);
      else if (effectiveSortField === 'size') result = (a.size || 0) - (b.size || 0);
      else if (effectiveSortField === 'date') result = (a.createdAt || a.lastModified || 0) - (b.createdAt || b.lastModified || 0);
      else if (effectiveSortField === 'type') result = (a.category || '').localeCompare(b.category || '');
      
      return effectiveSortOrder === 'asc' ? result : -result;
    });
  }, [matchedSubCategoryFiles, sortField, sortOrder, categoryFilter]);

  const currentIndex = useMemo(() => {
    return subCategories.findIndex(cat => cat.id === subCategory);
  }, [subCategory, subCategories]);

  const effectiveSortField = categoryFilter === 'recent' ? 'date' : sortField;
  const effectiveSortOrder = categoryFilter === 'recent' ? 'desc' : sortOrder;

  const currentTheme = useMemo(() => {
    if (isDark) {
      return {
        all: {
          bg: 'bg-[#121212]',
          headerBg: 'bg-[#121212]',
          tabBarBg: 'bg-[#1F1F1F]',
          searchInputBg: 'bg-[#202124] border-[#303134]/70',
          sortingBg: 'bg-[#18181B]',
          borderColor: 'border-[#303134]/60',
          textAccent: 'text-[#8AB4F8]',
          activePillBg: 'bg-[#8AB4F8]/15 text-[#8AB4F8] border-[#8AB4F8]/35',
          inactivePillBg: 'bg-[#202124] text-[#9AA0A6] border-[#303134] hover:bg-[#303134]',
          tagUnderline: 'bg-[#8AB4F8]',
        },
        pdf: {
          bg: 'bg-[#1A0E0F]',
          headerBg: 'bg-[#1A0E0F]',
          tabBarBg: 'bg-[#231213]',
          searchInputBg: 'bg-[#2F1A1B] border-[#4E2B2D]/70',
          sortingBg: 'bg-[#2B1617]',
          borderColor: 'border-[#4E2B2D]/60',
          textAccent: 'text-red-400',
          activePillBg: 'bg-red-500/20 text-red-300 border-red-500/35',
          inactivePillBg: 'bg-[#251314] text-red-400/60 border-[#4E2B2D]/40 hover:bg-[#2F191B]',
          tagUnderline: 'bg-[#EA4335]',
        },
        word: {
          bg: 'bg-[#0B121F]',
          headerBg: 'bg-[#0B121F]',
          tabBarBg: 'bg-[#10192A]',
          searchInputBg: 'bg-[#1A263B] border-[#243754]/80',
          sortingBg: 'bg-[#152033]',
          borderColor: 'border-[#243754]/60',
          textAccent: 'text-blue-400',
          activePillBg: 'bg-blue-500/20 text-blue-300 border-[#4285F4]/35',
          inactivePillBg: 'bg-[#121B2C] text-blue-400/60 border-[#243754]/40 hover:bg-[#1A263B]',
          tagUnderline: 'bg-[#4285F4]',
        },
        excel: {
          bg: 'bg-[#0D1812]',
          headerBg: 'bg-[#0D1812]',
          tabBarBg: 'bg-[#12221A]',
          searchInputBg: 'bg-[#1D3528] border-[#2D503C]/80',
          sortingBg: 'bg-[#172B20]',
          borderColor: 'border-[#2D503C]/60',
          textAccent: 'text-emerald-400',
          activePillBg: 'bg-emerald-500/20 text-emerald-300 border-[#34A853]/35',
          inactivePillBg: 'bg-[#13241B] text-emerald-400/60 border-[#2D503C]/40 hover:bg-[#1D3528]',
          tagUnderline: 'bg-[#34A853]',
        },
        ppt: {
          bg: 'bg-[#1B140B]',
          headerBg: 'bg-[#1B140B]',
          tabBarBg: 'bg-[#251D10]',
          searchInputBg: 'bg-[#352917] border-[#4C3B24]/80',
          sortingBg: 'bg-[#2D2213]',
          borderColor: 'border-[#4C3B24]/60',
          textAccent: 'text-amber-400',
          activePillBg: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
          inactivePillBg: 'bg-[#291E10] text-amber-400/60 border-[#4C3B24]/40 hover:bg-[#352917]',
          tagUnderline: 'bg-[#FBBC05]',
        },
        ebook: {
          bg: 'bg-[#140E20]',
          headerBg: 'bg-[#140E20]',
          tabBarBg: 'bg-[#1D132D]',
          searchInputBg: 'bg-[#2A1C41] border-[#3B295F]/80',
          sortingBg: 'bg-[#231737]',
          borderColor: 'border-[#3B295F]/60',
          textAccent: 'text-purple-400',
          activePillBg: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
          inactivePillBg: 'bg-[#1E1430] text-purple-400/60 border-[#3B295F]/40 hover:bg-[#2A1C41]',
          tagUnderline: 'bg-purple-500',
        },
        image: {
          bg: 'bg-[#0B1516]',
          headerBg: 'bg-[#0B1516]',
          tabBarBg: 'bg-[#0E2024]',
          searchInputBg: 'bg-[#193237] border-[#234A4E]/80',
          sortingBg: 'bg-[#13282C]',
          borderColor: 'border-[#234A4E]/60',
          textAccent: 'text-teal-400',
          activePillBg: 'bg-teal-500/20 text-teal-300 border-teal-500/35',
          inactivePillBg: 'bg-[#0F2224] text-teal-400/60 border-[#234A4E]/40 hover:bg-[#193237]',
          tagUnderline: 'bg-teal-500',
        },
        audio: {
          bg: 'bg-[#1B0C14]',
          headerBg: 'bg-[#1B0C14]',
          tabBarBg: 'bg-[#25101D]',
          searchInputBg: 'bg-[#351B2B] border-[#5C2346]/80',
          sortingBg: 'bg-[#2B1524]',
          borderColor: 'border-[#5C2346]/60',
          textAccent: 'text-pink-400',
          activePillBg: 'bg-pink-500/20 text-pink-300 border-pink-500/35',
          inactivePillBg: 'bg-[#26121E] text-pink-400/60 border-[#5C2346]/40 hover:bg-[#351B2B]',
          tagUnderline: 'bg-pink-500',
        },
        video: {
          bg: 'bg-[#1B0D0E]',
          headerBg: 'bg-[#1B0D0E]',
          tabBarBg: 'bg-[#251214]',
          searchInputBg: 'bg-[#2F171A] border-[#4E2429]/70',
          sortingBg: 'bg-[#271416]',
          borderColor: 'border-[#4E2429]/60',
          textAccent: 'text-red-400',
          activePillBg: 'bg-red-500/20 text-red-300 border-red-500/35',
          inactivePillBg: 'bg-[#251214] text-red-500/60 border-[#4E2429]/40 hover:bg-[#2F171A]',
          tagUnderline: 'bg-red-500',
        },
        zip: {
          bg: 'bg-[#141416]',
          headerBg: 'bg-[#141416]',
          tabBarBg: 'bg-[#1C1C1E]',
          searchInputBg: 'bg-[#262629] border-[#3C3C43]/70',
          sortingBg: 'bg-[#202022]',
          borderColor: 'border-[#3C3C43]/60',
          textAccent: 'text-zinc-400',
          activePillBg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/35',
          inactivePillBg: 'bg-[#1C1C1E] text-zinc-400/60 border-[#3C3C43]/40 hover:bg-[#262629]',
          tagUnderline: 'bg-zinc-500',
        },
        code: {
          bg: 'bg-[#0C121D]',
          headerBg: 'bg-[#0C121D]',
          tabBarBg: 'bg-[#121A28]',
          searchInputBg: 'bg-[#1D293E] border-[#2A3E5D]/80',
          sortingBg: 'bg-[#172132]',
          borderColor: 'border-[#2A3E5D]/60',
          textAccent: 'text-indigo-400',
          activePillBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35',
          inactivePillBg: 'bg-[#121A28] text-indigo-400/60 border-[#2A3E5D]/40 hover:bg-[#1D293E]',
          tagUnderline: 'bg-indigo-500',
        },
      };
    } else {
      return {
        all: {
          bg: 'bg-[#FAFAFA]',
          headerBg: 'bg-[#FAFAFA]',
          tabBarBg: 'bg-[#FFFFFF]',
          searchInputBg: 'bg-[#F1F3F4] border-transparent focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.12)]',
          sortingBg: 'bg-[#F1F3F4]/50',
          borderColor: 'border-gray-200/60',
          textAccent: 'text-[#1A73E8]',
          activePillBg: 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]',
          inactivePillBg: 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#F1F3F4]',
          tagUnderline: 'bg-[#1A73E8]',
        },
        pdf: {
          bg: 'bg-[#FFF5F5]',
          headerBg: 'bg-[#FFF5F5]',
          tabBarBg: 'bg-[#FFF0F0]',
          searchInputBg: 'bg-white/90 border-[#FAD2CF]/80 focus-within:shadow-[0_1px_6px_rgba(234,67,53,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#FFEAEA]',
          borderColor: 'border-[#FFD5D2]',
          textAccent: 'text-[#EA4335]',
          activePillBg: 'bg-[#FFF0EF] text-[#EA4335] border-[#FAD2CF]',
          inactivePillBg: 'bg-[#FFF5F5]/60 text-[#EA4335]/70 border-[#FAD2CF]/50 hover:bg-[#FFF0EF]',
          tagUnderline: 'bg-[#EA4335]',
        },
        word: {
          bg: 'bg-[#F2F7FE]',
          headerBg: 'bg-[#F2F7FE]',
          tabBarBg: 'bg-[#EAF2FC]',
          searchInputBg: 'bg-white/90 border-[#C6DCFC]/80 focus-within:shadow-[0_1px_6px_rgba(26,115,232,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#DDEBFC]',
          borderColor: 'border-[#C6DCFC]',
          textAccent: 'text-[#1A73E8]',
          activePillBg: 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]',
          inactivePillBg: 'bg-[#F2F7FE]/60 text-[#1A73E8]/70 border-[#C6DCFC]/50 hover:bg-[#EAF2FC]',
          tagUnderline: 'bg-[#1A73E8]',
        },
        excel: {
          bg: 'bg-[#F1FAF4]',
          headerBg: 'bg-[#F1FAF4]',
          tabBarBg: 'bg-[#E6F5EB]',
          searchInputBg: 'bg-white/90 border-[#CEEAD6]/80 focus-within:shadow-[0_1px_6px_rgba(19,115,51,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#D4EFE0]',
          borderColor: 'border-[#B7E5C9]',
          textAccent: 'text-[#137333]',
          activePillBg: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
          inactivePillBg: 'bg-[#F1FAF4]/60 text-[#137333]/70 border-[#CEEAD6]/50 hover:bg-[#E6F5EB]',
          tagUnderline: 'bg-[#137333]',
        },
        ppt: {
          bg: 'bg-[#FCF7ED]',
          headerBg: 'bg-[#FCF7ED]',
          tabBarBg: 'bg-[#FAF0DB]',
          searchInputBg: 'bg-white/90 border-[#FEEFC3]/85 focus-within:shadow-[0_1px_6px_rgba(176,96,0,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#F5E6C9]',
          borderColor: 'border-[#ECCB95]',
          textAccent: 'text-[#B06000]',
          activePillBg: 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]',
          inactivePillBg: 'bg-[#FCF7ED]/60 text-[#B06000]/70 border-[#FEEFC3]/50 hover:bg-[#FAF0DB]',
          tagUnderline: 'bg-[#B06000]',
        },
        ebook: {
          bg: 'bg-[#FAF5FF]',
          headerBg: 'bg-[#FAF5FF]',
          tabBarBg: 'bg-[#F3EAFF]',
          searchInputBg: 'bg-white/90 border-[#E9D5FF]/85 focus-within:shadow-[0_1px_6px_rgba(124,58,237,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#ECD8FF]',
          borderColor: 'border-[#DEBBFF]',
          textAccent: 'text-[#7C3AED]',
          activePillBg: 'bg-[#F3E8FF] text-purple-700 border-[#E9D5FF]',
          inactivePillBg: 'bg-[#FAF5FF]/60 text-purple-700/70 border-[#E9D5FF]/50 hover:bg-[#F3EAFF]',
          tagUnderline: 'bg-purple-600',
        },
        image: {
          bg: 'bg-[#F4FBFB]',
          headerBg: 'bg-[#F4FBFB]',
          tabBarBg: 'bg-[#E5F7F7]',
          searchInputBg: 'bg-white/90 border-[#B2DFDB]/85 focus-within:shadow-[0_1px_6px_rgba(13,148,136,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#CEEFEF]',
          borderColor: 'border-[#AEDDDC]',
          textAccent: 'text-[#0D9488]',
          activePillBg: 'bg-[#E0F2F1] text-[#00695C] border-[#B2DFDB]',
          inactivePillBg: 'bg-[#F4FBFB]/60 text-[#00695C]/70 border-[#B2DFDB]/50 hover:bg-[#E5F7F7]',
          tagUnderline: 'bg-teal-600',
        },
        audio: {
          bg: 'bg-[#FFF0F4]',
          headerBg: 'bg-[#FFF0F4]',
          tabBarBg: 'bg-[#FFE5ED]',
          searchInputBg: 'bg-white/90 border-[#F8BBD0]/85 focus-within:shadow-[0_1px_6px_rgba(208,23,96,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#FFCADC]',
          borderColor: 'border-[#FFA4C3]',
          textAccent: 'text-[#D01760]',
          activePillBg: 'bg-[#FCE4EC] text-[#C2185B] border-[#F8BBD0]',
          inactivePillBg: 'bg-[#FFF0F4]/60 text-[#C2185B]/70 border-[#F8BBD0]/50 hover:bg-[#FFE5ED]',
          tagUnderline: 'bg-pink-600',
        },
        video: {
          bg: 'bg-[#FFF5F6]',
          headerBg: 'bg-[#FFF5F6]',
          tabBarBg: 'bg-[#FFEAEB]',
          searchInputBg: 'bg-white/90 border-[#FFCCD0]/85 focus-within:shadow-[0_1px_6px_rgba(234,67,53,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#FFD9DB]',
          borderColor: 'border-[#FFA6AD]',
          textAccent: 'text-[#EA4335]',
          activePillBg: 'bg-[#FFF0F2] text-[#EA4335] border-[#FFCCD0]',
          inactivePillBg: 'bg-[#FFF5F6]/60 text-[#EA4335]/70 border-[#FFCCD0]/50 hover:bg-[#FFEAEB]',
          tagUnderline: 'bg-[#EA4335]',
        },
        zip: {
          bg: 'bg-[#F8F9FA]',
          headerBg: 'bg-[#F8F9FA]',
          tabBarBg: 'bg-[#F1F3F4]',
          searchInputBg: 'bg-white/90 border-gray-300 focus-within:shadow-[0_1px_6px_rgba(95,99,104,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#E8EAED]',
          borderColor: 'border-[#DADCE0]',
          textAccent: 'text-[#5F6368]',
          activePillBg: 'bg-white/90 text-[#3C4043] border-[#DADCE0]',
          inactivePillBg: 'bg-[#F8F9FA]/60 text-[#5F6368]/70 border-[#DADCE0]/50 hover:bg-[#F1F3F4]',
          tagUnderline: 'bg-zinc-500',
        },
        code: {
          bg: 'bg-[#F5F6FF]',
          headerBg: 'bg-[#F5F6FF]',
          tabBarBg: 'bg-[#EEF0FF]',
          searchInputBg: 'bg-white/90 border-[#D2D6FF]/85 focus-within:shadow-[0_1px_6px_rgba(79,70,229,0.12)] focus-within:bg-white',
          sortingBg: 'bg-[#E3E6FF]',
          borderColor: 'border-[#CBD0FF]',
          textAccent: 'text-[#4F46E5]',
          activePillBg: 'bg-[#EEF0FF] text-[#4F46E5] border-[#CBD0FF]',
          inactivePillBg: 'bg-[#F5F6FF]/60 text-[#4F46E5]/70 border-[#CBD0FF]/50 hover:bg-[#EEF0FF]',
          tagUnderline: 'bg-[#4F46E5]',
        },
      };
    }
  }, [isDark]);

  const activeTheme = useMemo(() => {
    return currentTheme[subCategory as keyof typeof currentTheme] || currentTheme.all;
  }, [subCategory, currentTheme]);

  // Open the slide-up sort drawer
  const handleOpenSortSheet = () => {
    setTempSortField(sortField);
    setTempSortOrder(sortOrder);
    setIsSortSheetOpen(true);
  };

  // Helper to retrieve tab-specific back colors
  const getSubCategoryBg = (tabId: string) => {
    const theme = currentTheme[tabId as keyof typeof currentTheme] || currentTheme.all;
    return theme.bg;
  };



  return (
    <div className={`flex flex-col h-full select-none transition-all duration-500 ease-out ${activeTheme.bg}`}>
      
      {/* Search Input and Layout Switcher identical to the reference */}
      <div className={`p-4 pb-1.5 flex items-center gap-3 shrink-0 transition-all duration-500 ${activeTheme.headerBg} border-b ${activeTheme.borderColor}`}>
        <div className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-full border transition-all duration-500 ${activeTheme.searchInputBg}`}>
          <Search className={`w-5 h-5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className={`w-full bg-transparent outline-none text-[15px] font-medium leading-normal ${
              isDark ? 'text-[#E3E3E3] placeholder-[#9AA0A6]' : 'text-[#202124] placeholder-[#5F6368]'
            }`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className={`p-1 rounded-full cursor-pointer hover:bg-black/15 transition-all text-gray-500 active:scale-90`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View mode toggle container */}
        <button 
          onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')} 
          className={`w-[48px] h-[48px] rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 transition-all duration-500 ${
            isDark 
              ? 'bg-[#202124] border-[#303134] text-[#8AB4F8] hover:bg-[#303134]' 
              : 'bg-white border-[#DADCE0] text-[#1A73E8] hover:bg-[#F8F9FA] shadow-xs'
          }`}
          title={viewMode === 'grid' ? 'List View' : 'Grid View'}
        >
          {viewMode === 'grid' ? <ListIcon className="w-5.5 h-5.5" /> : <Grid className="w-5.5 h-5.5" />}
        </button>
      </div>

      {/* Horizontal categories scroll elements with dynamic colors - slide tab bar design */}
      <div className={`shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b transition-all duration-500 ${activeTheme.tabBarBg} ${activeTheme.borderColor}`}>
        <div className="flex items-center px-4 py-1.5 w-max">
          {subCategories.map(cat => {
            const isActive = subCategory === cat.id;
            const catTheme = currentTheme[cat.id as keyof typeof currentTheme] || currentTheme.all;
            return (
              <button
                id={`subtab-${cat.id}`}
                key={cat.id}
                onClick={() => setSubCategory(cat.id)}
                className={`px-4.5 py-1.5 rounded-full border text-[13px] font-extrabold uppercase tracking-wider mx-1.5 my-1.5 transition-all duration-300 select-none cursor-pointer flex items-center gap-2 outline-none ${
                  isActive 
                    ? catTheme.activePillBg 
                    : catTheme.inactivePillBg
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary sorting and label details */}
      <div className={`flex items-center justify-between px-5.5 py-4 shrink-0 border-b transition-all duration-500 ${activeTheme.sortingBg} ${activeTheme.borderColor}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg transition-all duration-500 ${isDark ? 'bg-black/10' : 'bg-white/40'} ${activeTheme.textAccent}`}>
            <Folder className="w-4 h-4 fill-current"/>
          </div>
          <span className={`text-[13px] font-extrabold tracking-tight transition-all duration-500 ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
            {categoryFilter === 'all' && 'Local Storage'}
            {categoryFilter === 'recent' && 'Recent Documents'}
            {categoryFilter === 'favorites' && 'Favorites (Starred)'}
            {categoryFilter === 'downloads' && 'Downloads Storage'}
            {categoryFilter !== 'all' && categoryFilter !== 'recent' && categoryFilter !== 'favorites' && categoryFilter !== 'downloads' && `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Storage`}
          </span>
        </div>

        {/* Custom triggers Sort bottom sheet */}
        <button 
          onClick={handleOpenSortSheet}
          className={`p-2 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer border transition-all duration-500 ${
            isDark 
              ? 'bg-[#202124] border-[#303134] text-[#E3E3E3] hover:bg-[#303134]' 
              : 'bg-[#FFFFFF] border-[#DADCE0] text-[#3C4043] hover:bg-[#F1F3F4] shadow-xs'
          }`}
          title="Open Sort options"
        >
          <SortIcon />
          <span>Sort</span>
        </button>
      </div>

      {/* Files Display List */}
      <div className={`flex-1 overflow-y-auto ${getSubCategoryBg(subCategory)} p-4 px-5 transition-all duration-300`}>
        <h3 className={`text-[11.5px] font-bold uppercase tracking-wider mb-4 leading-none ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} style={{ fontFamily: "'Google Sans', sans-serif" }}>
          {subCategory === 'all' ? 'All files' : `${subCategory.toUpperCase()} files`} ({sortedFiles.length})
        </h3>

        <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 content-start' : 'flex flex-col gap-2'}>
          {sortedFiles.map(file => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedFileIds.has(file.id)}
              isSelectMode={isSelectMode}
              viewMode={viewMode}
              isDark={isDark}
              getFileUrl={getFileUrl}
              handleFilePressStart={handleFilePressStart}
              handleFilePressEnd={handleFilePressEnd}
              toggleSelection={toggleSelection}
              openFile={onOpenFile}
              fileMenuOpen={fileMenuOpen}
              setFileMenuOpen={setFileMenuOpen}
              renameFile={renameFile}
              convertDocToPdf={convertDocToPdf}
              openToolOverlay={openToolOverlay}
              convertPdfToImages={convertPdfToImages}
              extractZipFile={extractZipFile}
              downloadBlob={downloadBlob}
              shareFile={shareFile}
              deleteFile={deleteFile}
              toggleFavorite={toggleFavorite}
              togglePin={togglePin}
            />
          ))}
          
          {sortedFiles.length === 0 && (
            <div className={`col-span-full py-16 text-center rounded-2xl flex flex-col items-center justify-center border-2 border-dashed ${isDark ? 'bg-[#1A1A1A]/30 border-[#303134]/50 text-gray-400' : 'bg-[#FAFAFA]/50 border-gray-200 text-gray-500'}`}>
              <Folder className={`w-12 h-12 mb-3 opacity-40 ${isDark ? 'text-[#8AB4F8]' : 'text-[#1A73E8]'}`} strokeWidth="1.5" />
              <p className="text-sm font-bold mb-1">No files inside this window</p>
              <p className="text-xs opacity-75">Imports or documents will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* "Sort by" Modal (Compact) */}
      {isSortSheetOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setIsSortSheetOpen(false)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className={`pointer-events-auto w-full max-w-xs rounded-2xl p-5 shadow-2xl transition-all transform animate-[slideUp_0.2s_ease-out] flex flex-col ${
                isDark ? 'bg-[#1F1F1F] text-[#E3E3E3] border border-gray-700' : 'bg-white text-[#202124] border border-gray-200'
              }`}
              style={{ fontFamily: "'Google Sans', 'Inter', sans-serif" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold">Sort by</h4>
                <button 
                  onClick={() => setIsSortSheetOpen(false)}
                  className={`p-1.5 rounded-full cursor-pointer transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fields Selection */}
              <div className="flex flex-col space-y-1 select-none">
                {[
                  { id: 'name' as SortField, label: 'Name' },
                  { id: 'type' as SortField, label: 'Type' },
                  { id: 'date' as SortField, label: 'Date' },
                  { id: 'size' as SortField, label: 'Size' },
                ].map(field => {
                  const isSelected = tempSortField === field.id;
                  return (
                    <button
                      key={field.id}
                      onClick={() => setTempSortField(field.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-left outline-none transition-colors ${
                        isSelected 
                          ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') 
                          : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
                      }`}
                    >
                      <span className={`text-sm font-medium`}>{field.label}</span>
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Divider line */}
              <div className={`h-px w-full my-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

              {/* Order Selection */}
              <div className="flex flex-col space-y-1 mb-5 select-none">
                {[
                  { id: 'asc' as SortOrder, label: 'Ascending' },
                  { id: 'desc' as SortOrder, label: 'Descending' },
                ].map(order => {
                  const isSelected = tempSortOrder === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setTempSortOrder(order.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-left outline-none transition-colors ${
                        isSelected 
                          ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') 
                          : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
                      }`}
                    >
                      <span className={`text-sm font-medium`}>{order.label}</span>
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => setIsSortSheetOpen(false)}
                  className={`py-2 px-4 rounded-xl font-semibold text-sm cursor-pointer transition-all active:scale-95 border ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSortField(tempSortField);
                    setSortOrder(tempSortOrder);
                    setIsSortSheetOpen(false);
                  }}
                  className="py-2 px-4 rounded-xl font-bold text-sm cursor-pointer text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default FileExplorer;
