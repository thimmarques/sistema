
import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ActivityLog, AppSection, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';

interface DashboardProps {
  clients: Client[];
  movements: CourtMovement[];
  activities?: ActivityLog[];
  onSelectSection: (section: AppSection, tab?: string) => void;
  settings: UserSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, movements, activities = [], onSelectSection, settings }) => {
  const [selectedMovement, setSelectedMovement] = useState<CourtMovement | null>(null);
  const financialStats = useMemo(() => {
    let totalAgreed = 0;
    let totalDefensoria = 0;

    clients.forEach(c => {
      if (c.origin === 'Particular') {
        totalAgreed += c.financials?.totalAgreed || 0;
      } else if (c.origin === 'Defensoria') {
        const f = c.financials;
        if (f) {
          totalDefensoria += (f.defensoriaValue70 || 0) + (f.defensoriaValue30 || 0) + (f.defensoriaValue100 || 0);
        }
      }
    });
    return { totalAgreed, totalDefensoria };
  }, [clients]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const stats = [
    {
      label: 'Clientes Ativos',
      value: clients.length.toString(),
      badge: 'Ver Todos',
      badgeColor: 'text-blue-500 bg-blue-50',
      icon: 'fa-user-tie',
      iconColor: 'text-blue-500 bg-blue-50',
      action: () => onSelectSection(AppSection.CLIENTS)
    },
    {
      label: 'Prazos Próximos',
      value: movements.filter(m => m.type === 'Deadline').length.toString(),
      badge: 'Ver Agenda',
      badgeColor: 'text-orange-500 bg-orange-50',
      icon: 'fa-calendar-check',
      iconColor: 'text-purple-500 bg-purple-50',
      action: () => onSelectSection(AppSection.AGENDA)
    },
    {
      label: 'Faturamento Particular',
      value: formatCurrency(financialStats.totalAgreed),
      badge: 'Financeiro',
      badgeColor: 'text-indigo-500 bg-indigo-50',
      icon: 'fa-wallet',
      iconColor: 'text-orange-500 bg-orange-50',
      action: () => onSelectSection(AppSection.FINANCES, 'PARTICULAR')
    },
    {
      label: 'Faturamento Convênio',
      value: formatCurrency(financialStats.totalDefensoria),
      badge: 'Defensoria',
      badgeColor: 'text-emerald-500 bg-emerald-50',
      icon: 'fa-landmark',
      iconColor: 'text-emerald-500 bg-emerald-50',
      action: () => onSelectSection(AppSection.FINANCES, 'DEFENSORIA')
    },
    {
      label: 'Audiências',
      value: movements.filter(m => m.type === 'Audiência').length.toString(),
      badge: 'Ver Tudo',
      badgeColor: 'text-pink-500 bg-pink-50',
      icon: 'fa-building-columns',
      iconColor: 'text-pink-500 bg-pink-50',
      action: () => onSelectSection(AppSection.HEARINGS)
    }
  ];

  const recentActivities = useMemo(() => {
    if (activities.length > 0) {
      return activities.map(act => ({
        type: act.entityType.toLowerCase(),
        title: act.description,
        detail: `Por ${act.userName || 'Sistema'}`,
        time: new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        color: act.actionType === 'CREATE' ? 'bg-emerald-500' :
          act.actionType === 'DELETE' ? 'bg-rose-500' : 'bg-amber-500'
      }));
    }

    return clients.slice(0, 5).map(c => ({
      type: 'client',
      title: 'Cliente Cadastrado',
      detail: c.name,
      time: new Date(c.createdAt).toLocaleDateString('pt-BR'),
      color: 'bg-indigo-500'
    }));
  }, [activities, clients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex flex-col justify-between h-44 transition-all hover:shadow-md hover:-translate-y-1 text-left group"
          >
            <div className="flex justify-between items-start">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${item.iconColor}`}>
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{item.value}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prazos e Audiências */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Prazos e Audiências</h3>
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </div>

          <div className="space-y-8">
            {movements.slice(0, 5).map((m, idx) => {
              const date = new Date(m.date);
              const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
              const day = date.getDate() + 1;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-6 group cursor-pointer"
                  onClick={() => setSelectedMovement(m)}
                >
                  <div className="flex flex-col items-center justify-center min-w-[60px] h-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-rose-500 tracking-widest">{month}</span>
                    <span className="text-xl font-black text-slate-800">{day < 10 ? `0${day}` : day}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{m.type === 'Audiência' ? 'Audiência de Conciliação' : m.description}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">{m.caseNumber} • {m.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-400">{m.time || '09:00'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Atividade Recente</h3>
            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </div>

          <div className="relative pl-8 space-y-10">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

            {recentActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white ring-4 ring-slate-50 ${act.color}`}></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{act.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-medium">{act.detail}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{act.time}</span>
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
