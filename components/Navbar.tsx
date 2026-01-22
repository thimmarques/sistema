
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
      case AppSection.DASHBOARD: return "Dashboard";
      case AppSection.CLIENTS: return "Clientes";
      case AppSection.FINANCES: return "Finanças";
      case AppSection.AGENDA: return "Calendário";
      case AppSection.HEARINGS: return "Audiências";
      case AppSection.REPORTS: return "Relatórios";
      case AppSection.SETTINGS: return "Configurações";
      default: return "LexAI Intelligence";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:text-brand-600 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-0.5">LexAI Intelligence</span>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {getSectionTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <i className="fa-solid fa-bell text-lg"></i>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center bg-rose-500 text-[10px] font-bold text-white rounded-full border-2 border-white">
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

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all pr-4" onClick={() => onLogout()}>
            <div className="relative">
              <img
                src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=7e8aee&color=fff&size=100`}
                className="h-10 w-10 border border-slate-200 rounded-xl object-cover shadow-sm"
                alt="Advogado"
              />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none mb-1 group-hover:text-brand-600 transition-colors">{settings.name || 'Advogado'}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">OAB/{settings.oabState || 'SP'} {settings.oab || '...'} </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
