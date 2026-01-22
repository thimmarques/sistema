
import React from 'react';
import { AppSection, UserSettings, AppNotification } from '../types';
import NotificationCenter from './NotificationCenter';

interface NavbarProps {
  activeSection: AppSection;
  settings: UserSettings;
  notifications: AppNotification[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  markNotificationRead: (id: string) => void;
  onMenuClick: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  settings,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  markNotificationRead,
  onMenuClick,
  onLogout
}) => {
  const getSectionTitle = () => {
    switch (activeSection) {
      case AppSection.DASHBOARD: return "Terminal de Comando";
      case AppSection.CLIENTS: return "Custódia de Clientes";
      case AppSection.FINANCES: return "Fluxo de Capital";
      case AppSection.AGENDA: return "Agenda Estratégica";
      case AppSection.REPORTS: return "Lex AI Analytics";
      case AppSection.SETTINGS: return "Escritório Digital";
      default: return "LexAI Intelligence";
    }
  };

  return (
    <header className="sticky top-0 z-30 mx-0 mb-8 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-3xl px-8 shadow-2xl">
      <div className="flex h-24 w-full items-center justify-between">
        <div className="flex items-center gap-10">
          <button
            onClick={onMenuClick}
            className="flex h-12 w-12 items-center justify-center bg-white/5 text-slate-500 hover:text-brand-500 transition-all duration-500 lg:hidden"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>

          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.6em] mb-1.5 leading-none">LEX ARCHITECT V.04</span>
            <h1 className="text-2xl font-black text-white tracking-widest leading-none uppercase italic">
              {getSectionTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex h-12 w-12 items-center justify-center transition-all duration-700 ${showNotifications ? 'bg-brand-500 text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}
            >
              <i className="fa-solid fa-bell text-sm"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-brand-500 text-[8px] font-black text-black">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkRead={markNotificationRead}
              />
            )}
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-6 group cursor-pointer" onClick={() => onLogout()}>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white group-hover:text-brand-500 transition-colors uppercase tracking-[0.2em]">{settings.name || 'Advogado'}</p>
              <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">OAB/{settings.oabState || 'SP'} {settings.oab || '...'} </p>
            </div>
            <div className="relative">
              <img
                src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=c5a059&color=000&size=200`}
                className="h-12 w-12 border border-white/10 grayscale hover:grayscale-0 transition-all duration-700"
                alt="Advogado"
              />
              <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-brand-500 shadow-[0_0_5px_rgba(197,160,89,1)]"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
