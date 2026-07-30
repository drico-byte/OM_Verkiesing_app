import React from 'react';
import { School, LogOut, Home, Lock, Vote } from 'lucide-react';
import { AdminSettings, ViewMode } from '../types';

interface HeaderProps {
  adminSettings: AdminSettings;
  viewMode: ViewMode;
  onNavigateHome: () => void;
  onNavigateAdminHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  adminSettings,
  viewMode,
  onNavigateHome,
  onNavigateAdminHome,
}) => {
  const isAdmin = viewMode.type === 'admin_landing' || viewMode.type === 'admin_ballot_detail';

  const renderSchoolName = (name: string) => {
    const rawName = name || 'Hoërskool Verkiesings';
    const match = rawName.match(/^(Hoërskool)\s+(.+)$/i);

    if (match) {
      const [, prefix, rest] = match;
      return (
        <span className="inline-flex flex-wrap items-baseline gap-x-2 leading-tight">
          <span className="inline-block whitespace-nowrap text-[#EAC321]">{prefix}</span>
          <span className="inline-block whitespace-nowrap text-[#EAC321]">{rest}</span>
        </span>
      );
    }

    const parts = rawName.split(/\s+/);
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-2 leading-tight">
        {parts.map((part, i) => (
          <span key={i} className="inline-block whitespace-nowrap text-[#EAC321]">
            {part}
          </span>
        ))}
      </span>
    );
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[5rem] py-2 sm:py-0 sm:h-20 flex items-center justify-between">
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {adminSettings.schoolLogoUrl ? (
            <img 
              src={adminSettings.schoolLogoUrl} 
              alt="Skool Logo" 
              className="w-[60px] h-[60px] rounded-xl object-contain bg-slate-800 p-1 border border-[#0f172b] shadow-md transition-transform group-hover:scale-105 shrink-0"
            />
          ) : (
            <div className="w-[60px] h-[60px] rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-lg shadow-slate-900/30 transition-transform group-hover:scale-105 shrink-0">
              <School className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <div className="font-extrabold text-xl sm:text-2xl md:text-3xl tracking-tight text-white">
              {renderSchoolName(adminSettings.schoolName)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span className="uppercase tracking-wider text-[10px]">Admin Paneel</span>
            </div>
          )}

          {isAdmin && onNavigateAdminHome && viewMode.type === 'admin_ballot_detail' && (
            <button
              onClick={onNavigateAdminHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-colors border border-slate-700 shadow-xs cursor-pointer"
              title="Terug na Admin Hoofblad"
            >
              <Home className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Admin Oorsig</span>
            </button>
          )}

          {isAdmin ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors border border-slate-700 shadow-xs cursor-pointer"
              title="Teken uit na Hoofblad"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Teken Uit</span>
            </button>
          ) : (
            viewMode.type !== 'app_landing' && (
              <button
                onClick={onNavigateHome}
                title="Beginblad"
                aria-label="Beginblad"
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 shadow-xs cursor-pointer flex items-center justify-center"
              >
                <Home className="w-4 h-4 text-white" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
