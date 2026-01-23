import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ActivityLog, AppSection, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';
import { formatCurrency } from '../src/utils/format';

interface DashboardProps {
  clients: Client[];
  movements: CourtMovement[];
  activities?: ActivityLog[];
  onSelectSection: (section: AppSection, tab?: string) => void;
  settings: UserSettings;
  currentUserId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, movements, activities = [], onSelectSection, settings, currentUserId }) => {
  const [selectedMovement, setSelectedMovement] = useState<CourtMovement | null>(null);

  const financialStats = useMemo(() => {
    let totalAgreed = 0;
    let totalDefensoria = 0;

    clients.forEach(c => {
      if (c.userId === currentUserId && c.financials) {
        if (c.origin === 'Particular') {
          totalAgreed += c.financials.totalAgreed || 0;
        } else if (c.origin === 'Defensoria') {
          const f = c.financials;
          totalDefensoria += (f.defensoriaValue70 || 0) + (f.defensoriaValue30 || 0) + (f.defensoriaValue100 || 0);
        }
      }
    });
    return { totalAgreed, totalDefensoria };
  }, [clients, currentUserId]);

  const stats = [
    { label: 'Projetos Ativos', value: clients.length.toString(), action: () => onSelectSection(AppSection.CLIENTS) },
    { label: 'Prazos Críticos', value: movements.filter(m => m.type === 'Deadline').length.toString(), action: () => onSelectSection(AppSection.AGENDA) },
    { label: 'Faturamento', value: formatCurrency(financialStats.totalAgreed + financialStats.totalDefensoria), action: () => onSelectSection(AppSection.FINANCES) },
    { label: 'Audiências', value: movements.filter(m => m.type === 'Audiência').length.toString(), action: () => onSelectSection(AppSection.HEARINGS) }
  ];

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-brand-800 pb-10">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.5em]">OPERADOR EM COMANDO</p>
          <h1 className="text-5xl font-black text-brand-50 italic tracking-tighter uppercase font-serif leading-none">
            {settings.name || 'ADVOGADO'}
          </h1>
        </div>
        <div className="bg-brand-800 px-8 py-4 border border-brand-700 flex items-center gap-4">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-gold animate-pulse"></div>
          <span className="text-[9px] font-black text-brand-400 uppercase tracking-[0.4em]">SISTEMA INTEGRADO</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <button
            key={idx}
            onClick={s.action}
            className="bg-brand-800 border border-brand-700 p-10 hover:border-accent-gold/30 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all">
              <i className="fa-solid fa-layer-group text-4xl text-brand-400"></i>
            </div>
            <p className="text-[9px] font-black text-brand-400 uppercase tracking-[0.4em] mb-4 group-hover:text-accent-gold transition-colors">{s.label}</p>
            <h3 className="text-4xl font-black text-brand-50 tracking-tighter">{s.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 border border-brand-800 bg-brand-900">
          <div className="p-8 border-b border-brand-800 flex justify-between items-center bg-brand-800/50">
            <h3 className="text-[10px] font-black text-brand-100 uppercase tracking-[0.5em]">LOG DE OPERAÇÕES</h3>
            <button
              onClick={() => onSelectSection(AppSection.AGENDA)}
              className="text-[9px] font-black text-accent-gold hover:tracking-[0.4em] uppercase tracking-[0.3em] transition-all"
            >
              ACESSAR TERMINAL
            </button>
          </div>
          <div className="divide-y divide-brand-800">
            {movements.length > 0 ? movements.slice(0, 5).map((m, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMovement(m)}
                className="p-8 hover:bg-brand-800/50 transition-all cursor-pointer flex items-center gap-8 group"
              >
                <div className="w-16 h-16 border border-brand-700 flex flex-col items-center justify-center text-brand-400 group-hover:border-accent-gold group-hover:text-accent-gold transition-all">
                  <span className="text-xl font-black leading-none">{m.date.split('-')[2]}</span>
                  <span className="text-[8px] uppercase font-black tracking-widest mt-1">PROTO</span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-xs font-black text-brand-50 uppercase tracking-widest truncate">{m.description}</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] text-brand-400 font-bold tracking-wider">{m.caseNumber}</span>
                    <div className="h-1 w-1 bg-accent-gold"></div>
                    <span className="text-[9px] text-accent-gold font-black uppercase tracking-tighter">{m.type}</span>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-brand-600 group-hover:text-brand-50 transition-all"></i>
              </div>
            )) : (
              <div className="p-20 text-center space-y-4">
                <i className="fa-solid fa-radar text-4xl text-white/5"></i>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Aguardando Novas Movimentações</p>
              </div>
            )}
          </div>
        </div>

        <div className="border border-brand-800 bg-brand-900">
          <div className="p-8 border-b border-brand-800 bg-brand-800/50">
            <h3 className="text-[10px] font-black text-brand-100 uppercase tracking-[0.5em]">SISTEMA ANALÍTICO</h3>
          </div>
          <div className="p-8 space-y-10">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex gap-6 relative">
                <div className="h-full w-[1px] bg-brand-800 absolute left-3 top-8"></div>
                <div className="w-6 h-6 border border-brand-700 flex items-center justify-center text-accent-gold shrink-0 relative bg-brand-900">
                  <i className="fa-solid fa-bolt text-[10px]"></i>
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-bold text-brand-400 leading-relaxed uppercase tracking-wide">{act.description}</p>
                  <p className="text-[8px] text-brand-500 font-black uppercase tracking-[0.2em]">
                    {new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {act.userName || 'TERMINAL'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedMovement && (
        <MovementSummaryModal
          movement={selectedMovement}
          client={clients.find(c => c.id === selectedMovement.clientId || c.caseNumber === selectedMovement.caseNumber)}
          settings={settings}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
