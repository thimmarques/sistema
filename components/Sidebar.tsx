
import React from 'react';
import { AppSection } from '../types';

interface SidebarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  logo?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSelectSection, logo, isOpen, onClose }) => {
  const menuItems = [
    { id: AppSection.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line' },
    { id: AppSection.CLIENTS, label: 'Clientes', icon: 'fa-users' },
    { id: AppSection.FINANCES, label: 'Finanças', icon: 'fa-sack-dollar' },
    { id: AppSection.AGENDA, label: 'Agenda & Prazos', icon: 'fa-calendar-days' },
    { id: AppSection.REPORTS, label: 'Relatórios', icon: 'fa-file-lines' },
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col z-50 transition-transform duration-300 border-r border-slate-800 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col items-center">
          <div className="w-full h-32 flex items-center justify-center bg-black/40 rounded-2xl p-4 border border-slate-800 shadow-2xl mb-4 overflow-hidden group">
            {logo && logo.startsWith('data:image') ? (
              <img src={logo} className="max-h-full max-w-full object-contain animate-in fade-in duration-700" alt="PMC Advogados" />
            ) : (
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-serif text-amber-500 font-bold tracking-tighter leading-none">PMC</span>
                  <div className="h-[1px] w-full bg-amber-500/50 my-1"></div>
                  <span className="text-[9px] font-sans text-white font-light tracking-[0.4em] uppercase">Advogados</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 text-slate-500 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 px-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">Menu Principal</p>
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeSection === item.id
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20 translate-x-1'
                      : 'hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center ${activeSection === item.id ? 'text-white' : 'text-slate-500'}`}></i>
                  <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700 shadow-xl">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">LexAI Premium</p>
            <p className="text-[8px] text-slate-500 uppercase font-medium">Sincronização Ativa</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
