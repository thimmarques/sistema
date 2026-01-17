
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
      default: return "Escritório Jurídico";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
        >
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {getSectionTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-bell"></i>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white">
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

        <div className="flex items-center gap-3 border-l pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{settings.name || 'Seu Nome'}</p>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">OAB {settings.oab || '...'} </p>
          </div>
          <img
            src={settings.profileImage || `https://ui-avatars.com/api/?name=${settings.name || 'User'}&background=1e293b&color=fff&size=200`}
            className="h-10 w-10 rounded-full border shadow-sm object-cover"
            alt="Advogado"
          />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
