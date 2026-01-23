import React from 'react';
import { AppSection } from '../types';
import { getInitials } from '../src/utils/format';

interface SidebarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection, tab?: string) => void;
  logo?: string;
  name?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelectSection, logo, name, isOpen, onClose }) => {
  const menuItems = [
    { id: AppSection.DASHBOARD, label: 'Dashboard', icon: 'fa-grip-vertical' },
    { id: AppSection.CLIENTS, label: 'Clientes', icon: 'fa-user-shield' },
    { id: AppSection.FINANCES, label: 'Finanças', icon: 'fa-vault' },
    { id: AppSection.AGENDA, label: 'Calendário', icon: 'fa-calendar-check' },
    { id: AppSection.HEARINGS, label: 'Audiências', icon: 'fa-gavel' },
    { id: AppSection.REPORTS, label: 'Relatórios', icon: 'fa-microchip' },
    { id: AppSection.SETTINGS, label: 'Configurações', icon: 'fa-gear' },
  ];

  const handleSelect = (section: AppSection) => {
    onSelectSection(section);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-400 flex flex-col z-50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800 space-y-4">
          <div className="h-12 w-12 flex items-center justify-center bg-blue-600 rounded-lg shadow-lg">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="h-full w-full object-contain p-2" alt="Logo" />
            ) : (
              <i className="fa-solid fa-scale-balanced text-white text-xl"></i>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">LexAI</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Gestão Jurídica</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeSection === item.id
                  ? 'bg-blue-600/10 text-blue-400 font-medium'
                  : 'hover:bg-slate-800/50 hover:text-slate-200 text-slate-400'
                }`}
            >
              <div className={`w-6 flex justify-center ${activeSection === item.id ? 'text-blue-500' : 'group-hover:text-slate-300'}`}>
                <i className={`fa-solid ${item.icon} text-sm`}></i>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
              {activeSection === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
            <span>Sistema Operacional</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
