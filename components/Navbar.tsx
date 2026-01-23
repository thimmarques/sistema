
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
      case AppSection.HEARINGS: return "Audiências";
      case AppSection.REPORTS: return "Lex AI Analytics";
      case AppSection.SETTINGS: return "Escritório Digital";
      default: return "LexAI Intelligence";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-600 hover:text-blue-600 lg:hidden transition-colors"
          >
            <i className="fa-solid fa-bars-staggered text-lg"></i>
          </button>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Área Administrativa</span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {getSectionTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 transition-all ${showNotifications ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fa-solid fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
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

          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onLogout()}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{settings.name || 'Advogado'}</p>
              <p className="text-xs text-slate-500 font-medium">OAB/{settings.oabState || 'SP'} {settings.oab || '...'}</p>
            </div>
            <div className="relative">
              <img
                src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=eff6ff&color=2563eb&size=100`}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover shadow-sm group-hover:border-blue-200 transition-all"
                alt="Advogado"
              />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
