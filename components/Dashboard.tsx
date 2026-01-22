
import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ActivityLog, AppSection, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';

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
      // Only include financial stats for clients owned by the current user
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
  }, [clients]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const stats = [
    {
      label: 'Clientes Ativos',
      value: clients.length.toString(),
      badge: 'Ver Todos',
      gradient: 'from-blue-600 to-indigo-700',
      icon: 'fa-users-rectangle',
      shadow: 'shadow-blue-500/20',
      action: () => onSelectSection(AppSection.CLIENTS)
    },
    {
      label: 'Prazos Jurídicos',
      value: movements.filter(m => m.type === 'Deadline').length.toString(),
      badge: 'Ver Agenda',
      gradient: 'from-violet-600 to-purple-800',
      icon: 'fa-calendar-day',
      shadow: 'shadow-violet-500/20',
      action: () => onSelectSection(AppSection.AGENDA)
    },
    {
      label: 'Faturamento Particular',
      value: formatCurrency(financialStats.totalAgreed),
      badge: 'Particular',
      gradient: 'from-rose-500 to-pink-700',
      icon: 'fa-coins',
      shadow: 'shadow-rose-500/20',
      action: () => onSelectSection(AppSection.FINANCES, 'PARTICULAR')
    },
    {
      label: 'Faturamento Convênio',
      value: formatCurrency(financialStats.totalDefensoria),
      badge: 'Defensoria',
      gradient: 'from-emerald-500 to-teal-700',
      icon: 'fa-landmark',
      shadow: 'shadow-emerald-500/20',
      action: () => onSelectSection(AppSection.FINANCES, 'DEFENSORIA')
    },
    {
      label: 'Audiências',
      value: movements.filter(m => m.type === 'Audiência').length.toString(),
      badge: 'Próximas',
      gradient: 'from-brand-600 to-brand-800',
      icon: 'fa-gavel',
      shadow: 'shadow-brand-500/20',
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
        icon: act.actionType === 'CREATE' ? 'fa-plus' : act.actionType === 'DELETE' ? 'fa-trash' : 'fa-pen',
        color: act.actionType === 'CREATE' ? 'bg-emerald-500' :
          act.actionType === 'DELETE' ? 'bg-rose-500' : 'bg-amber-500'
      }));
    }

    return clients.slice(0, 5).map(c => ({
      type: 'client',
      title: 'Cliente Cadastrado',
      detail: c.name,
      time: new Date(c.createdAt).toLocaleDateString('pt-BR'),
      icon: 'fa-user-plus',
      color: 'bg-brand-500'
    }));
  }, [activities, clients]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats Cards - Bento Grid Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className={`group relative overflow-hidden bg-gradient-to-br ${item.gradient} p-7 rounded-[2rem] shadow-xl ${item.shadow} flex flex-col justify-between h-52 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 text-left`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -right-6 -top-6 h-32 w-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

            <div className="flex justify-between items-start relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl text-white shadow-lg border border-white/20 transition-transform duration-700 group-hover:rotate-[10deg]">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className="px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/10 text-[9px] font-black uppercase text-white tracking-widest">
                {item.badge}
              </span>
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-sm">{item.value}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prazos e Audiências */}
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-white/40 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mb-1">Próximos Eventos</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Agenda Jurídica</h3>
            </div>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-brand-500 hover:text-white transition-all duration-300">
              <i className="fa-solid fa-calendar-plus"></i>
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {movements.length > 0 ? movements.slice(0, 5).map((m, idx) => {
              const [year, monthNum, dayStr] = m.date.split('-');
              const date = new Date(parseInt(year), parseInt(monthNum) - 1, parseInt(dayStr));
              const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
              const day = date.getDate();

              return (
                <div
                  key={idx}
                  className="flex items-center gap-6 group/item cursor-pointer p-4 rounded-3xl transition-all duration-300 hover:bg-brand-50/50 hover:translate-x-1"
                  onClick={() => setSelectedMovement(m)}
                >
                  <div className="flex flex-col items-center justify-center min-w-[70px] h-20 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm group-hover/item:border-brand-200 transition-colors">
                    <span className="text-[10px] font-black text-brand-500 tracking-widest">{month}</span>
                    <span className="text-2xl font-black text-slate-800">{day < 10 ? `0${day}` : day}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full ${m.type === 'Audiência' ? 'bg-rose-500' : 'bg-brand-500'} animate-pulse`}></span>
                      <h4 className="font-black text-slate-800 text-base leading-tight group-hover/item:text-brand-600 transition-colors">
                        {m.type === 'Audiência' ? 'Audiência de Conciliação' : m.description}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{m.caseNumber} • {m.source}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 group-hover/item:bg-brand-100 group-hover/item:border-brand-200 transition-all">
                      <span className="text-xs font-black text-slate-700 group-hover/item:text-brand-700">{m.time || '09:00'}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                  <i className="fa-solid fa-calendar-xmark text-2xl"></i>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum evento agendado</p>
              </div>
            )}
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-white/40 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mt-20"></div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Feed de Ações</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Atividade Recente</h3>
            </div>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all duration-300">
              <i className="fa-solid fa-list-ul"></i>
            </button>
          </div>

          <div className="relative pl-10 space-y-10 relative z-10">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-slate-100"></div>

            {recentActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="relative group/act">
                {/* Timeline Dot */}
                <div className={`absolute -left-[31px] top-1.5 h-6 w-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${act.color} text-[8px] text-white transition-transform duration-300 group-hover/act:scale-125`}>
                  <i className={`fa-solid ${act.icon}`}></i>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl transition-all duration-300 hover:bg-slate-50">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight group-hover/act:text-brand-600 transition-colors uppercase tracking-tight">{act.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{act.detail}</p>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-100/50 px-2 py-1 rounded-lg">{act.time}</span>
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
