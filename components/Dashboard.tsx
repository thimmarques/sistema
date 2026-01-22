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
    <div className="min-h-screen bg-[#0A0A0B] text-slate-400 p-0 sm:p-2 animate-in fade-in duration-1000">

      {/* MONOLITHIC HERO - Asymmetric 80/20 */}
      <section className="relative flex flex-col xl:flex-row gap-1 border-b border-white/5 pb-20">
        <div className="flex-1 space-y-12">
          <div className="space-y-4">
            <span className="text-[8px] font-black tracking-[0.8em] text-brand-500 uppercase opacity-50">SITUAÇÃO ATUAL</span>
            <h1 className="text-6xl sm:text-8xl font-black text-white italic tracking-tighter leading-none font-serif">
              Sua rede de <br /> <span className="text-brand-500 not-italic">Inteligência</span> Jurídica.
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl">
            {stats.map((s, idx) => (
              <button key={idx} onClick={s.action} className="group text-left space-y-3 transition-transform hover:translate-y-[-4px] duration-500">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-brand-500 transition-colors">{s.label}</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">{s.value}</h4>
                <div className="h-[1px] w-4 bg-white/10 group-hover:w-full group-hover:bg-brand-500 transition-all duration-700"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Asymmetric Side Stats */}
        <div className="xl:w-80 flex flex-col justify-end pt-20 xl:pt-0">
          <div className="p-8 border-l border-white/5 space-y-6">
            <p className="text-[10px] font-black text-slate-500 leading-relaxed italic">
              "A precisão técnica é o alicerce do sucesso jurídico no século XXI."
            </p>
            <div className="h-[1px] w-full bg-gradient-to-r from-brand-500 to-transparent"></div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-white uppercase tracking-widest">Equipe Operacional</p>
              <p className="text-[10px] font-medium text-slate-600">3 Colaboradores Online</p>
            </div>
          </div>
        </div>
      </section>

      {/* VERTICAL STREAM - Staggered Timelines */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-0 mt-20">
        {/* Timeline Jurídica */}
        <div className="lg:col-span-2 border-r border-white/5 pr-0 lg:pr-20 space-y-16 pb-20">
          <div className="flex justify-between items-end">
            <h3 className="text-3xl font-black text-white font-serif italic tracking-tight">Agenda Táctica</h3>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">PRÓXIMOS 7 DIAS</span>
          </div>

          <div className="relative space-y-1">
            {movements.length > 0 ? movements.slice(0, 6).map((m, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMovement(m)}
                className="group flex gap-12 p-8 hover:bg-white/[0.02] transition-all duration-500 cursor-pointer border-l-[1px] border-transparent hover:border-brand-500"
              >
                <div className="min-w-[60px] text-right pt-1">
                  <p className="text-xl font-black text-white leading-none">{m.date.split('-')[2]}</p>
                  <p className="text-[8px] font-black text-slate-600 uppercase mt-1 tracking-widest">OUT</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`h-1 w-1 ${m.type === 'Audiência' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-brand-500 shadow-[0_0_8px_rgba(197,160,89,0.6)]'}`}></span>
                    <h5 className="font-black text-sm text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">
                      {m.type === 'Audiência' ? 'Audiência de Conciliação' : m.description}
                    </h5>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 max-w-md uppercase tracking-tighter opacity-60">Proc. {m.caseNumber} • {m.source}</p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity self-center">
                  <i className="fa-solid fa-arrow-right-long text-brand-500"></i>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-20">
                <i className="fa-solid fa-ghost text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Silêncio nos Tribunais</p>
              </div>
            )}
          </div>
        </div>

        {/* Atividade Atômica */}
        <div className="pl-0 lg:pl-16 space-y-16 pt-20 lg:pt-0">
          <h3 className="text-3xl font-black text-white font-serif italic tracking-tight">Fluxo Interno</h3>

          <div className="space-y-12">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="group relative pl-8 border-l border-white/5 hover:border-brand-500 transition-colors duration-700">
                <div className="absolute -left-1 top-0 h-2 w-2 bg-slate-900 border border-white/20 group-hover:bg-brand-500 group-hover:border-brand-500 transition-all duration-500"></div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest">{act.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black text-slate-700 uppercase">{act.userName || 'SISTEMA'}</span>
                    <span className="text-[8px] font-black text-slate-800 tracking-tighter">{new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
