import React from 'react';
import { PermissionCard } from '../components/PermissionCard';
import { formatBytes } from '../utils/imageUtils';
import { WorkspaceFile } from '../App';

interface SettingsPageProps {
  isDark: boolean;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  files: WorkspaceFile[];
  perms: {
    camera: boolean;
    mic: boolean;
    location: boolean;
    storage: boolean;
    internet: boolean;
  };
  setPerms: React.Dispatch<React.SetStateAction<{
    camera: boolean;
    mic: boolean;
    location: boolean;
    storage: boolean;
    internet: boolean;
  }>>;
  requestPermission: (type: 'camera' | 'mic' | 'location' | 'storage') => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDark,
  theme,
  setTheme,
  files,
  perms,
  setPerms,
  requestPermission,
}) => {
  return (
    <div className="p-5 space-y-6 w-full">
      {/* Account Box Google Theme */}
      <div
        className={`p-5 rounded-3xl shadow-sm border flex items-center gap-4 \${
          isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-xl">
          M
        </div>
        <div>
          <p className={`font-medium \${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>My Workspace</p>
          <p className={`text-[13px] \${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Google Material Theme</p>
        </div>
      </div>

      {/* System UI & Storage */}
      <div
        className={`rounded-3xl p-5 shadow-sm border \${
          isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
        }`}
      >
        <h3 className={`font-medium mb-4 text-[14px] \${isDark ? 'text-[#8AB4F8]' : 'text-[#1967D2]'}`}>System</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[14px]">App Theme</span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as any)}
              className={`p-2 rounded-xl text-[14px] font-medium focus:outline-none \${
                isDark ? 'bg-[#1F1F1F] text-[#E3E3E3]' : 'bg-[#F0F4F9] text-[#202124]'
              }`}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E8EAED] dark:border-[#3C4043]">
            <span className="text-[14px]">Storage Cache</span>
            <span className="text-[14px] font-medium">
              {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E8EAED] dark:border-[#3C4043]">
            <span className="text-[14px]">Offline Files</span>
            <span className="text-[14px] font-medium">{files.length}</span>
          </div>
        </div>
      </div>

      {/* Permissions Mock UI */}
      <PermissionCard perms={perms} setPerms={setPerms} requestPermission={requestPermission} isDark={isDark} />
    </div>
  );
};

export default SettingsPage;
