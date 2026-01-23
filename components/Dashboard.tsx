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
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bem-vindo ao Sistema</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {settings.name || 'Advogado'}
          </h1>
        </div>
        <div className="bg-white px-6 py-2 rounded-full border border-slate-200 flex items-center gap-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <button
            key={idx}
            onClick={s.action}
            className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-all">
              <i className="fa-solid fa-layer-group text-6xl text-slate-900"></i>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 group-hover:text-blue-600 transition-colors">{s.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{s.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Últimas Movimentações</h3>
            <button
              onClick={() => onSelectSection(AppSection.AGENDA)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver Todas
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {movements.length > 0 ? movements.slice(0, 5).map((m, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMovement(m)}
                className="p-6 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-6 group"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <span className="text-lg font-bold leading-none">{m.date.split('-')[2]}</span>
                  <span className="text-[10px] uppercase font-bold">DEZ</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{m.description}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">{m.caseNumber}</span>
                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">{m.type}</span>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-slate-500 transition-all"></i>
              </div>
            )) : (
              <div className="p-20 text-center space-y-4">
                <i className="fa-solid fa-folder-open text-4xl text-slate-200"></i>
                <p className="text-sm font-medium text-slate-500">Nenhuma movimentação recente</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Atividade Recente</h3>
          </div>
          <div className="p-6 space-y-8">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {idx !== activities.slice(0, 5).length - 1 && (
                  <div className="h-full w-[1px] bg-slate-200 absolute left-2.5 top-6"></div>
                )}
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 relative z-10 border-2 border-white">
                  <i className="fa-solid fa-bolt text-[8px]"></i>
                </div>
                <div className="min-w-0 space-y-1 pb-2">
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{act.description}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {act.userName || 'Sistema'}
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
