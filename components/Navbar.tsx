
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
    <header className="sticky top-0 z-30 bg-brand-900/90 backdrop-blur-2xl border-b border-brand-800 px-10 py-6">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={onMenuClick}
            className="p-3 text-slate-700 hover:text-white lg:hidden border border-white/5 rounded-none transition-all"
          >
            <i className="fa-solid fa-bars-staggered text-xs"></i>
          </button>
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] mb-1">PROTOCOLO OPERACIONAL</span>
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 bg-accent-gold"></div>
              <h1 className="text-sm font-black text-brand-50 uppercase tracking-[0.3em]">
                {getSectionTitle()}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-10">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-3 border border-brand-800 transition-all ${showNotifications ? 'bg-accent-gold text-brand-950 border-accent-gold' : 'text-brand-400 hover:text-brand-50 hover:border-brand-600'}`}
            >
              <i className="fa-solid fa-bell text-xs"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-accent-gold text-[8px] font-black text-brand-950">
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

          <div className="h-10 w-[1px] bg-brand-800 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-6 group cursor-pointer p-1" onClick={() => onLogout()}>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-brand-50 uppercase tracking-widest mb-1 group-hover:text-accent-gold transition-colors">{settings.name || 'ADVOGADO'}</p>
              <p className="text-[8px] text-brand-500 font-black uppercase tracking-[0.2em]">OAB/{settings.oabState || 'SP'} {settings.oab || '...'}</p>
            </div>
            <div className="relative">
              <img
                src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=D4AF37&color=0B0C15&size=100`}
                className="h-12 w-12 border border-brand-800 grayscale hover:grayscale-0 transition-all duration-700 object-cover"
                alt="Advogado"
              />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-accent-gold"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
