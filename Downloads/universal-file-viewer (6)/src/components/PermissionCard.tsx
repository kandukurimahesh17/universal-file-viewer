import React from 'react';
import { Camera, Mic, MapPin, HardDrive, Globe, Check } from 'lucide-react';

interface PermissionCardProps {
  perms: { camera: boolean, mic: boolean, location: boolean, storage: boolean, internet: boolean };
  setPerms: React.Dispatch<React.SetStateAction<{ camera: boolean, mic: boolean, location: boolean, storage: boolean, internet: boolean }>>;
  requestPermission: (type: 'camera' | 'mic' | 'location' | 'storage') => Promise<void>;
  isDark: boolean;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({ perms, setPerms, requestPermission, isDark }) => {
  return (
    <div className={`rounded-3xl p-5 shadow-sm border ${isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'}`}>
      <h3 className={`font-medium mb-4 text-[14px] ${isDark ? 'text-[#8AB4F8]' : 'text-[#1967D2]'}`}>App Permissions</h3>
      <div className="space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-[#202124]' : 'bg-[#E8F0FE]'}`}><Camera className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#1967D2]'}`}/></div>
            <span className="text-[14px]">Camera</span>
          </div>
          {perms.camera ? <Check className="w-5 h-5 text-[#34A853]" /> : 
            <button onClick={() => requestPermission('camera')} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white">Allow</button>
          }
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED] dark:border-[#3C4043]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-[#202124]' : 'bg-[#FCE8E6]'}`}><Mic className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#D93025]'}`}/></div>
            <span className="text-[14px]">Microphone</span>
          </div>
          {perms.mic ? <Check className="w-5 h-5 text-[#34A853]" /> : 
            <button onClick={() => requestPermission('mic')} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white">Allow</button>
          }
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED] dark:border-[#3C4043]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-[#202124]' : 'bg-[#E6F4EA]'}`}><MapPin className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#1E8E3E]'}`}/></div>
            <span className="text-[14px]">Location</span>
          </div>
          {perms.location ? <Check className="w-5 h-5 text-[#34A853]" /> : 
            <button onClick={() => requestPermission('location')} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white">Allow</button>
          }
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED] dark:border-[#3C4043]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-[#202124]' : 'bg-[#F0F4F9]'}`}><HardDrive className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#4285F4]'}`}/></div>
            <span className="text-[14px]">Storage</span>
          </div>
          {perms.storage ? <Check className="w-5 h-5 text-[#34A853]" /> : 
            <button onClick={() => requestPermission('storage')} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white">Allow</button>
          }
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8EAED] dark:border-[#3C4043]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDark ? 'bg-[#202124]' : 'bg-[#E8F0FE]'}`}><Globe className={`w-4 h-4 ${isDark ? 'text-white' : 'text-[#1967D2]'}`}/></div>
            <span className="text-[14px]">Internet</span>
          </div>
          {perms.internet ? <Check className="w-5 h-5 text-[#34A853]" /> : 
            <button onClick={() => setPerms(p => ({...p, internet: true}))} className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#1A73E8] text-white">Allow</button>
          }
        </div>

      </div>
    </div>
  );
};

export default PermissionCard;