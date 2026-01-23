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

      <aside className={`fixed inset-y-0 left-0 w-64 bg-brand-900 border-r border-brand-800 text-brand-400 flex flex-col z-50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex flex-col items-center border-b border-brand-800 space-y-6">
          <div className="h-16 w-16 border border-accent-gold/30 flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-accent-gold/10 blur-xl group-hover:bg-accent-gold/30 transition-all"></div>
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="h-full w-full object-contain p-2 relative z-10" alt="Logo" />
            ) : (
              <i className="fa-solid fa-scale-balanced text-accent-gold text-2xl relative z-10"></i>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-brand-50 italic tracking-tighter uppercase font-serif">LexAI</h1>
            <p className="text-[8px] font-black text-brand-500 uppercase tracking-[0.4em] mt-1">Gestão de Elite</p>
          </div>
        </div>

        <nav className="flex-1 px-6 py-10 space-y-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex flex-col items-center group transition-all ${activeSection === item.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-full p-4 border border-brand-800 flex items-center gap-4 transition-all ${activeSection === item.id ? 'bg-accent-gold border-accent-gold text-brand-950 shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 'hover:bg-brand-800 hover:border-brand-700'}`}>
                <div className="w-5 text-center">
                  <i className={`fa-solid ${item.icon} text-xs`}></i>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] truncate">{item.label}</span>
              </div>
              {activeSection === item.id && <div className="h-1 w-8 bg-accent-gold mt-2"></div>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-brand-800 mt-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-accent-gold animate-ping"></div>
              <p className="text-[8px] font-black text-brand-500 uppercase tracking-[0.5em]">Operacional</p>
            </div>
            <p className="text-[7px] text-brand-600 font-black uppercase tracking-[0.2em]">Protocolo v2.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
