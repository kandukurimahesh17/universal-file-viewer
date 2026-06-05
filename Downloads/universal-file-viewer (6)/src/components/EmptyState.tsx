import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  isDark: boolean;
  boxStyle?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, isDark, boxStyle }) => {
  if (boxStyle) {
    return (
      <div className={`p-8 text-center rounded-3xl ${isDark ? 'bg-[#303134]' : 'bg-white border border-[#E8EAED]'}`}>
        <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-[#202124]' : 'bg-[#F0F4F9]'}`}>
          {icon}
        </div>
        <p className={`text-sm mb-1 ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>{title}</p>
        {description && <p className={`text-[12px] ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{description}</p>}
      </div>
    );
  }

  return (
    <div className="col-span-full py-16 text-center">
      <div className={`flex justify-center items-center mb-4 ${isDark ? 'text-[#5F6368]' : 'text-[#dadce0]'}`}>
        {icon}
      </div>
      <p className={`text-[15px] ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>{title}</p>
      {description && <p className={`text-[13px] mt-1 ${isDark ? 'text-[#7A8086]' : 'text-[#80868B]'}`}>{description}</p>}
    </div>
  );
};

export default EmptyState;