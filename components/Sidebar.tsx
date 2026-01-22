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
    { id: AppSection.CLIENTS, label: 'Projetos / Clientes', icon: 'fa-user-shield' },
    { id: AppSection.FINANCES, label: 'Tesouraria', icon: 'fa-vault' },
    { id: AppSection.AGENDA, label: 'Calendário Lex', icon: 'fa-calendar-check' },
    { id: AppSection.HEARINGS, label: 'Soluções / Audiências', icon: 'fa-gavel' },
    { id: AppSection.REPORTS, label: 'Lex Intelligence', icon: 'fa-microchip' },
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

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col z-50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-800">
          <div className="w-full aspect-square max-h-24 flex items-center justify-center bg-slate-800 rounded-xl mb-4 overflow-hidden shadow-inner">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="max-h-full max-w-full object-contain p-2" alt="Logo" />
            ) : (
              <div className="text-center">
                <span className="text-2xl font-bold text-brand-400">
                  {name ? getInitials(name) : 'LX'}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{name || 'Sistema LexAI'}</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <div className="w-5 text-center">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="px-4 py-3 bg-slate-800/50 rounded-lg flex items-center gap-3 border border-slate-700/50">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Conexão Segura</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
