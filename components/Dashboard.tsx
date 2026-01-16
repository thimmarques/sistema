
import React, { useMemo } from 'react';
import { Client, CourtMovement } from '../types';

interface DashboardProps {
  clients: Client[];
  movements: CourtMovement[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, movements }) => {
  const financialStats = useMemo(() => {
    let totalAgreed = 0;
    clients.forEach(c => {
      if (c.origin === 'Particular') {
        totalAgreed += c.financials?.totalAgreed || 0;
      }
    });
    return { totalAgreed };
  }, [clients]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const stats = [
    { 
      label: 'Processos Ativos', 
      value: '124', 
      badge: '+12%', 
      badgeColor: 'text-emerald-500 bg-emerald-50',
      icon: 'fa-briefcase',
      iconColor: 'text-blue-500 bg-blue-50'
    },
    { 
      label: 'Prazos Próximos', 
      value: `0${movements.filter(m => m.type === 'Deadline').length}`, 
      badge: 'Hoje', 
      badgeColor: 'text-orange-500 bg-orange-50',
      icon: 'fa-calendar-check',
      iconColor: 'text-purple-500 bg-purple-50'
    },
    { 
      label: 'Faturamento Mensal', 
      value: formatCurrency(financialStats.totalAgreed), 
      badge: '+R$ 2.4k', 
      badgeColor: 'text-emerald-500 bg-emerald-50',
      icon: 'fa-wallet',
      iconColor: 'text-orange-500 bg-orange-50'
    },
    { 
      label: 'Documentos Pendentes', 
      value: '15', 
      badge: 'Pendente', 
      badgeColor: 'text-slate-400 bg-slate-100',
      icon: 'fa-hourglass-half',
      iconColor: 'text-pink-500 bg-pink-50'
    }
  ];

  const recentActivities = [
    { type: 'protocol', title: 'Petição protocolada', detail: 'Processo Roberto Alvarenga', time: '2 horas atrás', color: 'bg-indigo-500' },
    { type: 'payment', title: 'Pagamento Confirmado', detail: 'Parcela 03/12 - Carlos Eduardo', time: '5 horas atrás', color: 'bg-emerald-500' },
    { type: 'client', title: 'Novo Cadastro Realizado', detail: 'Fernanda Souza de Oliveira', time: 'Ontem', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex flex-col justify-between h-44 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${item.iconColor}`}>
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
          </div>
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
            {movements.slice(0, 3).map((m, idx) => {
              const date = new Date(m.date);
              const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
              const day = date.getDate() + 1;
              
              return (
                <div key={idx} className="flex items-center gap-6 group">
                  <div className="flex flex-col items-center justify-center min-w-[60px] h-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-rose-500 tracking-widest">{month}</span>
                    <span className="text-xl font-black text-slate-800">{day < 10 ? `0${day}` : day}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{m.type === 'Hearing' ? 'Audiência de Conciliação' : m.description}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">{m.caseNumber} • {m.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-400">09:00</span>
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
            
            {recentActivities.map((act, idx) => (
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
    </div>
  );
};

export default Dashboard;
