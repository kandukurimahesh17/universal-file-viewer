import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  isDark: boolean;
  onClick?: () => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery = '', setSearchQuery, isDark, onClick, placeholder = "Search...", readOnly = false }) => {
  return (
    <div onClick={onClick} className={`relative flex-1 flex items-center px-4 py-3 bg-white rounded-full shadow-sm border border-[#E8EAED] transition-shadow hover:shadow-md cursor-${onClick ? 'pointer' : 'text'} ${isDark ? 'bg-[#303134] border-transparent' : ''}`}>
      <Search className={`w-5 h-5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={searchQuery} 
        onChange={e => setSearchQuery?.(e.target.value)} 
        readOnly={readOnly || !!onClick}
        className={`w-full bg-transparent pl-3 pr-2 text-[15px] focus:outline-none transition-colors ${isDark ? 'text-white placeholder-[#9AA0A6]' : 'text-[#202124] placeholder-[#5F6368]'} ${onClick ? 'cursor-pointer' : ''}`}
      />
      {searchQuery && !readOnly && !onClick && (
        <X onClick={() => setSearchQuery?.('')} className={`w-4 h-4 cursor-pointer ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
      )}
    </div>
  );
};

export default SearchBar;