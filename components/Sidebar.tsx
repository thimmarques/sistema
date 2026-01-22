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

      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0A0A0B] text-slate-500 flex flex-col z-50 transition-all duration-500 ease-in-out border-r border-white/5 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex flex-col items-center">
          {/* Logo Container - Technical Luxury */}
          <div className="w-full h-32 flex items-center justify-center bg-white/5 border border-white/5 shadow-2xl mb-12 overflow-hidden group relative rounded-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="max-h-full max-w-full object-contain relative z-10 grayscale brightness-125 hover:grayscale-0 transition-all duration-700" alt="Logo" />
            ) : (
              <div className="text-center relative z-10 transition-transform duration-700 group-hover:scale-105">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tracking-widest leading-none mb-2">
                    {name ? getInitials(name) : 'LX'}
                  </span>
                  <div className="h-[1px] w-12 bg-brand-500 mb-3 grayscale brightness-150"></div>
                  <span className="text-[8px] font-black text-slate-600 tracking-[0.6em] uppercase">Lex Architect</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-8 space-y-12 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-8 px-2">SISTEMA v4.0</p>
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-5 px-4 py-3 transition-all duration-500 group relative ${activeSection === item.id
                      ? 'text-brand-500'
                      : 'text-slate-600 hover:text-slate-300'
                      }`}
                  >
                    {activeSection === item.id && (
                      <div className="absolute left-0 w-[1px] h-4 bg-brand-500 animate-in slide-in-from-left duration-500"></div>
                    )}
                    <div className={`text-sm transition-all duration-700 ${activeSection === item.id ? 'scale-110 brightness-125' : 'grayscale group-hover:grayscale-0'}`}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-[0.25em]">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-10 mt-auto">
          <div className="p-6 border border-white/5 bg-white/5 relative overflow-hidden group">
            <p className="text-[8px] font-black text-brand-500 uppercase tracking-[0.4em] mb-2">SECURE MODE</p>
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 bg-brand-500 shadow-[0_0_8px_rgba(197,160,89,1)]"></div>
              <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">TLS 1.3 Active</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
