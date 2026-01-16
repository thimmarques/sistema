
import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ClientOrigin, UserSettings } from '../types';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { generateFinancialReport } from '../pdfService';

interface ReportsProps {
  clients: Client[];
  movements: CourtMovement[];
  settings: UserSettings;
}

const Reports: React.FC<ReportsProps> = ({ clients, movements, settings }) => {
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
      totalAgreed += c.financials?.totalAgreed || 0;
      totalInitial += c.financials?.initialPayment || 0;
      
      const installments = c.financials?.installments || [];
      totalPending += installments
        .filter(i => i.status !== 'paid')
        .reduce((acc, curr) => acc + curr.value, 0);
    });

    return { totalAgreed, totalInitial, totalPending };
  }, [filteredClients]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Relatórios Estratégicos</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Análise de desempenho e saúde financeira da carteira.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${originFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{f === 'Both' ? 'Todos' : f}</button>
            ))}
          </div>
          <button onClick={() => generateFinancialReport(filteredClients, settings)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <i className="fa-solid fa-file-pdf"></i> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Carteira Selecionada</p>
          <div className="flex items-end gap-2"><h4 className="text-3xl font-black text-slate-800">{filteredClients.length}</h4><span className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Processos</span></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total Contratado</p><h4 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(financialSummary.totalAgreed)}</h4></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Receita Realizada</p><h4 className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(financialSummary.totalInitial)}</h4></div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all"><p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Projeção a Receber</p><h4 className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(financialSummary.totalPending)}</h4></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[480px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] flex items-center gap-3"><div className="h-2 w-6 bg-indigo-600 rounded-full"></div>Distribuição por Área Jurídica</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.keys(countsByArea(filteredClients)).map(area => (
                <div key={area} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: AREA_COLORS[area] || AREA_COLORS['Outros'] }}></div><span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{area}</span></div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10, fontWeight: '900', fill: '#1e293b', letterSpacing: '0.1em'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                  {areaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-[0.3em] mb-12 text-center w-full">Perfil da Carteira</h4>
          <div className="relative flex items-center justify-center w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={75} outerRadius={105} paddingAngle={10} stroke="none" startAngle={90} endAngle={450}>
                  {originPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={ORIGIN_COLORS[entry.name as keyof typeof ORIGIN_COLORS]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-2px]"><span className="text-5xl font-black text-slate-800 leading-none">{filteredClients.length}</span><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Total</span></div>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 w-full">
            <div className="flex items-center gap-3"><div className="h-4 w-4 rounded-sm bg-[#475569]"></div><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Defensoria</span></div>
            <div className="flex items-center gap-3"><div className="h-4 w-4 rounded-sm bg-[#6366f1]"></div><span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Particular</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-transform">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Detalhamento por Área</h4>
          <span className="text-[9px] font-black text-indigo-600 bg-white border px-3 py-1 rounded-full uppercase tracking-widest">Dados Consolidados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
              <tr>
                <th className="px-10 py-6">Área Jurídica</th>
                <th className="px-10 py-6">Nº Casos</th>
                <th className="px-10 py-6">Ticket Médio</th>
                <th className="px-10 py-6">Volume Contratado</th>
                <th className="px-10 py-6 text-right">Market Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(countsByArea(filteredClients)).map(([area, clientsInArea]) => {
                const totalInArea = clientsInArea.reduce((acc, c) => acc + (c.financials?.totalAgreed || 0), 0);
                const avgTicket = totalInArea / clientsInArea.length;
                const percentage = financialSummary.totalAgreed > 0 ? (totalInArea / financialSummary.totalAgreed) * 100 : 0;
                return (
                  <tr key={area} className="hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-10 py-6"><div className="flex items-center gap-4"><div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: AREA_COLORS[area] || AREA_COLORS['Outros'] }}></div><span className="text-sm font-black text-slate-800 tracking-tight">{area}</span></div></td>
                    <td className="px-10 py-6"><span className="text-sm font-bold text-slate-500">{clientsInArea.length}</span></td>
                    <td className="px-10 py-6"><span className="text-sm font-bold text-slate-500">{formatCurrency(avgTicket)}</span></td>
                    <td className="px-10 py-6"><span className="text-sm font-black text-slate-800">{formatCurrency(totalInArea)}</span></td>
                    <td className="px-10 py-6 text-right"><div className="flex items-center justify-end gap-4"><div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: AREA_COLORS[area] || AREA_COLORS['Outros'] }}></div></div><span className="text-[10px] font-black text-slate-400 w-10 text-right">{Math.round(percentage)}%</span></div></td>
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
