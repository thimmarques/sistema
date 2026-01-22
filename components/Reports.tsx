
import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ClientOrigin, UserSettings } from '../types';
import { formatCurrency, formatCurrencyShort } from '../src/utils/format';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { generateFinancialReport } from '../pdfService';

interface ReportsProps {
  clients: Client[];
  movements: CourtMovement[];
  settings: UserSettings;
  currentUserId?: string;
}

const Reports: React.FC<ReportsProps> = ({ clients, movements, settings, currentUserId }) => {
  const [originFilter, setOriginFilter] = useState<'Both' | ClientOrigin>('Both');

  const AREA_COLORS: Record<string, string> = {
    'Cível': '#6366f1',
    'Criminal': '#f43f5e',
    'Trabalhista': '#10b981',
    'Família': '#f59e0b',
    'Tributário': '#06b6d4',
    'Previdenciário': '#a855f7',
    'Outros': '#94a3b8'
  };

  const ORIGIN_COLORS = {
    'Particular': '#6366f1',
    'Defensoria': '#475569'
  };

  const filteredClients = useMemo(() => {
    if (originFilter === 'Both') return clients;
    return clients.filter(c => c.origin === originFilter);
  }, [clients, originFilter]);

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach(c => {
      const area = c.caseType || 'Outros';
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: AREA_COLORS[name] || AREA_COLORS['Outros']
    })).sort((a, b) => b.value - a.value);
  }, [filteredClients]);

  const originPieData = useMemo(() => {
    const counts: Record<string, number> = { 'Particular': 0, 'Defensoria': 0 };
    filteredClients.forEach(c => {
      counts[c.origin] = (counts[c.origin] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, val]) => val >= 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredClients]);

  const financialSummary = useMemo(() => {
    let totalAgreed = 0;
    let totalInitial = 0;
    let totalPending = 0;

    filteredClients.forEach(c => {
      // Only include financial details for clients owned by the current user
      if (c.userId === currentUserId && c.financials) {
        totalAgreed += c.financials.totalAgreed || 0;
        totalInitial += c.financials.initialPayment || 0;

        const installments = c.financials.installments || [];
        totalPending += installments
          .filter(i => i.status !== 'paid')
          .reduce((acc, curr) => acc + curr.value, 0);
      }
    });

    return { totalAgreed, totalInitial, totalPending };
  }, [filteredClients]);


  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em]">Inteligência de Dados</span>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Análises & Resultados</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-inner">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${originFilter === f ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{f === 'Both' ? 'Consolidado' : f}</button>
            ))}
          </div>
          <button
            onClick={() => generateFinancialReport(filteredClients, settings)}
            className="flex-1 md:flex-none h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black hover:-translate-y-1 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            <i className="fa-solid fa-file-export opacity-50"></i>
            Exportar BI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Processos Ativos', value: filteredClients.length, icon: 'fa-briefcase', color: 'brand' },
          { label: 'Volume Contratado', value: formatCurrency(financialSummary.totalAgreed), icon: 'fa-file-invoice-dollar', color: 'slate' },
          { label: 'Receita Realizada', value: formatCurrency(financialSummary.totalInitial), icon: 'fa-circle-check', color: 'emerald' },
          { label: 'Projeção Futura', value: formatCurrency(financialSummary.totalPending), icon: 'fa-clock', color: 'brand' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] shadow-premium border border-white/40 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 bg-${stat.color === 'brand' ? 'brand-500' : stat.color === 'emerald' ? 'emerald-500' : 'slate-500'}/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</span>
                <div className={`h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-${stat.color === 'brand' ? 'brand-500' : stat.color === 'emerald' ? 'emerald-500' : 'slate-900'} group-hover:text-white transition-all duration-500`}>
                  <i className={`fa-solid ${stat.icon} text-sm`}></i>
                </div>
              </div>
              <h4 className={`text-2xl font-black ${stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-800'} tracking-tighter`}>{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-premium border border-white/40 flex flex-col min-h-[520px] relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 bg-brand-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 relative z-10">
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 text-lg tracking-tight">Especialização da Carteira</h4>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Volume por Segmento Jurídico</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 justify-end max-w-md">
              {Object.keys(countsByArea(filteredClients)).map(area => (
                <div key={area} className="flex items-center gap-2 group/stat">
                  <div className="h-1.5 w-4 rounded-full transition-all group-hover/stat:w-6" style={{ backgroundColor: AREA_COLORS[area] || AREA_COLORS['Outros'] }}></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{area}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fontWeight: '900', fill: '#64748b', letterSpacing: '0.15em' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '20px', backgroundColor: '#fff' }}
                  labelStyle={{ display: 'none' }}
                />
                <Bar dataKey="value" radius={[0, 15, 15, 0]} barSize={32}>
                  {areaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[4rem] shadow-premium flex flex-col items-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 h-64 w-64 bg-brand-500/10 rounded-full blur-[100px] -ml-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>

          <h4 className="font-black text-white text-sm uppercase tracking-[0.4em] mb-16 text-center w-full relative z-10">Origem das Demandas</h4>
          <div className="relative flex items-center justify-center w-full h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={95} outerRadius={125} paddingAngle={12} stroke="none" startAngle={90} endAngle={450}>
                  {originPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ORIGIN_COLORS[entry.name as keyof typeof ORIGIN_COLORS]} className="hover:opacity-80 transition-opacity" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', backgroundColor: '#fff', padding: '15px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -translate-y-1 animate-in zoom-in duration-700">
              <span className="text-6xl font-black text-white tracking-tighter leading-none">{filteredClients.length}</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-3">Registros</span>
            </div>
          </div>
          <div className="mt-16 flex flex-col gap-6 w-full relative z-10">
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-3 w-8 bg-brand-500 rounded-full"></div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Contratos Particulares</span>
              </div>
              <span className="text-lg font-black text-white">{(originPieData.find(d => d.name === 'Particular')?.value || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-3 w-8 bg-slate-600 rounded-full"></div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Apoio Defensoria</span>
              </div>
              <span className="text-lg font-black text-white">{(originPieData.find(d => d.name === 'Defensoria')?.value || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-premium border border-white/40 overflow-hidden group">
        <div className="p-12 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-50/10">
          <div className="space-y-1">
            <h4 className="font-black text-slate-800 text-lg tracking-tight">Performance por Segmento</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Métricas Consolidadas de Mercado</p>
          </div>
          <span className="h-12 flex items-center px-6 bg-brand-50 text-brand-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-brand-100">Atualizado Agora</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/20 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="px-12 py-8">Unidade Jurídica</th>
                <th className="px-10 py-8">Demandas</th>
                <th className="px-10 py-8">Ticket Médio</th>
                <th className="px-10 py-8">Liquidez Total</th>
                <th className="px-12 py-8 text-right">Participação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(countsByArea(filteredClients)).map(([area, clientsInArea], idx) => {
                const ownedClientsInArea = clientsInArea.filter(c => c.userId === currentUserId);
                const totalInArea = ownedClientsInArea.reduce((acc, c) => acc + (c.financials?.totalAgreed || 0), 0);
                const avgTicket = ownedClientsInArea.length > 0 ? totalInArea / ownedClientsInArea.length : 0;
                const percentage = filteredClients.length > 0 ? (clientsInArea.length / filteredClients.length) * 100 : 0;
                return (
                  <tr key={area} className="hover:bg-slate-50/50 transition-all duration-300 group/row">
                    <td className="px-12 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover/row:bg-white group-hover/row:text-brand-600 transition-all border border-transparent group-hover/row:border-slate-100">
                          <i className="fa-solid fa-folder-tree text-xs"></i>
                        </div>
                        <span className="text-base font-black text-slate-800 tracking-tight">{area}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-600">{clientsInArea.length}</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Processos</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-sm font-black text-slate-500">{formatCurrency(avgTicket)}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-800">{formatCurrency(totalInArea)}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Faturamento</span>
                      </div>
                    </td>
                    <td className="px-12 py-8 text-right">
                      <div className="flex items-center justify-end gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-black text-slate-400">{Math.round(percentage)}%</span>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 shadow-inner">
                            <div className="h-full rounded-full transition-all duration-[1.5s] ease-out-expo" style={{ width: `${percentage}%`, backgroundColor: AREA_COLORS[area] || AREA_COLORS['Outros'] }}></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const countsByArea = (clients: Client[]) => {
  const groups: Record<string, Client[]> = {};
  clients.forEach(c => {
    const area = c.caseType || 'Outros';
    if (!groups[area]) groups[area] = [];
    groups[area].push(c);
  });
  return groups;
};

export default Reports;
