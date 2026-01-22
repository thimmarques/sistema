
import React from 'react';
import { AppSection } from '../types';

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
    { id: AppSection.DASHBOARD, label: 'Painel Geral', icon: 'fa-grid-2', brandColor: 'text-indigo-500' },
    { id: AppSection.CLIENTS, label: 'Clientes', icon: 'fa-users-rectangle', brandColor: 'text-brand-500' },
    { id: AppSection.FINANCES, label: 'Gestão Financeira', icon: 'fa-coins', brandColor: 'text-emerald-500' },
    { id: AppSection.AGENDA, label: 'Agenda Jurídica', icon: 'fa-calendar-day', brandColor: 'text-violet-500' },
    { id: AppSection.HEARINGS, label: 'Audiências', icon: 'fa-gavel', brandColor: 'text-rose-500' },
    { id: AppSection.REPORTS, label: 'Inteligência', icon: 'fa-sparkles', brandColor: 'text-amber-500' },
    { id: AppSection.SETTINGS, label: 'Configurações', icon: 'fa-sliders', brandColor: 'text-slate-400' },
  ];

  const handleSelect = (section: AppSection) => {
    onSelectSection(section);
    if (onClose) onClose();
  };

  const getInitials = (n: string) => {
    return n.split(' ').map(part => part[0]).join('').substring(0, 3).toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-950 text-slate-400 flex flex-col z-50 transition-all duration-500 ease-in-out border-r border-white/5 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col items-center">
          {/* Logo Container - Glassmorphism */}
          <div className="w-full h-40 flex items-center justify-center bg-white/5 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl mb-8 overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="max-h-full max-w-full object-contain relative z-10 animate-in zoom-in-95 duration-700" alt="Logo" />
            ) : (
              <div className="text-center relative z-10 transition-transform duration-700 group-hover:scale-110">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white tracking-tighter leading-none mb-1">
                    {name ? getInitials(name) : 'LX'}
                    <span className="text-brand-500">.</span>
                  </span>
                  <div className="h-[2px] w-8 bg-brand-500 rounded-full mb-2"></div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">LexAI Intelligence</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="lg:hidden absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 px-4">Menu de Gestão</p>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeSection === item.id
                      ? 'bg-white/10 text-white shadow-xl translate-x-1 ring-1 ring-white/10'
                      : 'hover:bg-white/5 hover:text-slate-200'
                      }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm transition-all duration-500 ${activeSection === item.id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                    {activeSection === item.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-8 mt-auto">
          <div className="bg-gradient-to-br from-brand-950 to-slate-900 p-5 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all duration-700"></div>
            <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1 relative z-10">LexAI Professional</p>
            <div className="flex items-center gap-2 relative z-10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Status: Fully Synchronized</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
