import React from 'react';
import { FileCategory } from '../App';

interface FileIconProps {
  type: FileCategory;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, className = "w-6 h-6" }) => {
  switch(type) {
    case 'pdf': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#E3242B" />
        <text x="12" y="16" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">PDF</text>
      </svg>
    );
    case 'doc': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#2B579A" />
        <text x="12" y="17" fill="white" fontSize="14" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">W</text>
      </svg>
    );
    case 'xls': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#217346" />
        <text x="12" y="17" fill="white" fontSize="14" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">X</text>
      </svg>
    );
    case 'ppt': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#D24726" />
        <text x="12" y="17" fill="white" fontSize="14" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">P</text>
      </svg>
    );
    case 'txt': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#5F6368" />
        <text x="12" y="16" fill="white" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">TXT</text>
      </svg>
    );
    case 'epub': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#F4B400" />
        <path d="M6 6v12h12V6H6zm2 2h8v8H8V8zm2 2v4h4v-4h-4z" fill="white"/>
      </svg>
    );
    case 'image': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#00ACC1" />
        <circle cx="9" cy="9" r="2" fill="white" />
        <path d="M5 19l4-5 3 4 4-6 3 7H5z" fill="white" />
      </svg>
    );
    case 'audio': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#D81B60" />
        <path d="M12 4v9.38A3.012 3.012 0 0010 13c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V7h4V4h-5z" fill="white" />
      </svg>
    );
    case 'video': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#E53935" />
        <path d="M8 5v14l11-7z" fill="white" />
      </svg>
    );
    case 'archive': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#8E24AA" />
        <rect x="10" y="4" width="4" height="16" fill="white" opacity="0.5"/>
        <rect x="9" y="10" width="6" height="4" fill="white" />
      </svg>
    );
    case 'code': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#3949AB" />
        <text x="12" y="16.5" fill="white" fontSize="12" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">&lt;/&gt;</text>
      </svg>
    );
    case 'folder': return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#F4B400" />
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="white" />
      </svg>
    );
    default: return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect width="24" height="24" rx="4" fill="#9E9E9E" />
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="white"/>
      </svg>
    );
  }
};

export default FileIcon;