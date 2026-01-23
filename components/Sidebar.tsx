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
    { id: AppSection.DASHBOARD, label: 'Dashboard', icon: 'fa-grip-vertical', color: 'text-blue-400' },
    { id: AppSection.CLIENTS, label: 'Clientes', icon: 'fa-user-shield', color: 'text-emerald-400' },
    { id: AppSection.FINANCES, label: 'Finanças', icon: 'fa-vault', color: 'text-amber-400' },
    { id: AppSection.AGENDA, label: 'Calendário', icon: 'fa-calendar-check', color: 'text-indigo-400' },
    { id: AppSection.HEARINGS, label: 'Audiências', icon: 'fa-gavel', color: 'text-rose-400' },
    { id: AppSection.REPORTS, label: 'Relatórios', icon: 'fa-microchip', color: 'text-cyan-400' },
    { id: AppSection.SETTINGS, label: 'Configurações', icon: 'fa-gear', color: 'text-slate-400' },
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
        <div className="px-6 py-12 flex flex-col items-center border-b border-slate-800/40">
          {logo && logo.startsWith('data:image') ? (
            <div className="w-full flex justify-center animate-in fade-in zoom-in duration-500">
              <img src={logo} className="max-h-20 w-auto object-contain drop-shadow-2xl" alt="Logo" />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg border border-blue-400/20">
                <i className="fa-solid fa-scale-balanced text-white text-xl"></i>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white tracking-tight cursor-default">
                  Lex<span className="text-blue-500">AI</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Gestão Jurídica</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeSection === item.id
                ? 'bg-blue-600/10 text-white font-bold'
                : 'hover:bg-slate-800/40 hover:text-slate-200 text-slate-500'
                }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeSection === item.id ? 'bg-blue-600/20 ' + item.color : 'bg-slate-800/50 group-hover:bg-slate-700/50 ' + item.color}`}>
                <i className={`fa-solid ${item.icon} text-sm`}></i>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
              {activeSection === item.id && (
                <div className="ml-auto w-1 h-4 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
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
