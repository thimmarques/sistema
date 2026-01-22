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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Olá, {settings.name || 'Advogado'}</h1>
          <p className="text-slate-500">Bem-vindo ao LexAI Intelligence.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Sistema Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <button
            key={idx}
            onClick={s.action}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-brand-600">{s.label}</p>
            <h3 className="text-3xl font-bold text-slate-900">{s.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Agenda Próxima</h3>
            <button
              onClick={() => onSelectSection(AppSection.AGENDA)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider"
            >
              Ver Tudo
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {movements.length > 0 ? movements.slice(0, 5).map((m, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMovement(m)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-600">
                  <span className="text-xs font-bold leading-none">{m.date.split('-')[2]}</span>
                  <span className="text-[10px] uppercase font-bold">OUT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate text-sm">{m.description}</h4>
                  <p className="text-xs text-slate-500 truncate">{m.caseNumber} • {m.type}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <p>Nenhum evento agendado para os próximos dias.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Atividade Recente</h3>
          </div>
          <div className="p-6 space-y-6">
            {activities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                  <i className="fa-solid fa-bolt text-xs"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-tight mb-1">{act.description}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
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
