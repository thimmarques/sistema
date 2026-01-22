
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
      case AppSection.DASHBOARD: return "Painel Geral";
      case AppSection.CLIENTS: return "Carteira de Clientes";
      case AppSection.FINANCES: return "Gestão Financeira";
      case AppSection.AGENDA: return "Agenda Jurídica";
      case AppSection.REPORTS: return "Relatórios Estratégicos";
      case AppSection.SETTINGS: return "Perfil do Escritório";
      default: return "LexAI Intelligence";
    }
  };

  return (
    <header className="sticky top-6 z-30 mx-4 md:mx-8 mb-4">
      <div className="flex h-20 w-full items-center justify-between rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 px-6 shadow-premium">
        <div className="flex items-center gap-6">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100/50 text-slate-600 hover:bg-brand-500 hover:text-white transition-all duration-300 shadow-sm lg:hidden active:scale-95"
          >
            <i className="fa-solid fa-bars-staggered"></i>
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] leading-none mb-1">LexAI System</span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">
              {getSectionTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm active:scale-95 ${showNotifications ? 'bg-brand-500 text-white shadow-brand-500/20' : 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50'}`}
            >
              <i className="fa-solid fa-bell"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-4 ring-white shadow-lg animate-in zoom-in">
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

          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onLogout()}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-none mb-1 group-hover:text-brand-500 transition-colors">{settings.name || 'Seu Nome'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">OAB/{settings.oabState || 'SP'} {settings.oab || '...'} </p>
            </div>
            <div className="relative">
              <img
                src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=6366f1&color=fff&size=200`}
                className="h-11 w-11 rounded-2xl border-2 border-white shadow-premium object-cover group-hover:scale-105 transition-transform duration-300"
                alt="Advogado"
              />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-2 ring-emerald-500/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
