import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, ClientOrigin, UserSettings } from '../types';
import { formatCurrency } from '../src/utils/format';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
    'Cível': '#3B82F6',
    'Criminal': '#6366F1',
    'Trabalhista': '#10B981',
    'Família': '#F59E0B',
    'Tributário': '#06B6D4',
    'Previdenciário': '#8B5CF6',
    'Outros': '#64748B'
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
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredClients]);

  const financialSummary = useMemo(() => {
    let totalAgreed = 0;
    let totalInitial = 0;
    let totalPending = 0;

    filteredClients.forEach(c => {
      if (c.userId === currentUserId && c.financials) {
        totalAgreed += c.financials.totalAgreed || 0;
        totalInitial += c.financials.initialPayment || 0;
        (c.financials.installments || []).forEach(i => {
          if (i.status !== 'paid') totalPending += i.value;
        });
      }
    });

    return { totalAgreed, totalInitial, totalPending };
  }, [filteredClients, currentUserId]);

  return (
    <div className="space-y-10 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2 text-left">
          <p className="text-xs font-bold text-cyan-600 uppercase tracking-wide">Inteligência de Negócio</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Relatórios</h2>
          <p className="text-sm text-slate-500 font-medium">Análise de performance e fluxo operacional</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-6 py-2 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all ${originFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{f === 'Both' ? 'GERAL' : f.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => generateFinancialReport(filteredClients, settings)} className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 bg-white font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm">
            <i className="fa-solid fa-file-pdf text-rose-500"></i>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Demandas Totais', value: filteredClients.length, color: 'text-slate-900', icon: 'fa-folder-open', iconBg: 'bg-blue-50 text-blue-500' },
          { label: 'Volume Acordado', value: formatCurrency(financialSummary.totalAgreed), color: 'text-emerald-600', icon: 'fa-handshake', iconBg: 'bg-emerald-50 text-emerald-500' },
          { label: 'Fluxo Realizado', value: formatCurrency(financialSummary.totalInitial), color: 'text-blue-600', icon: 'fa-money-bill-trend-up', iconBg: 'bg-blue-50 text-blue-500' },
          { label: 'Ativos em Aberto', value: formatCurrency(financialSummary.totalPending), color: 'text-amber-600', icon: 'fa-clock-rotate-left', iconBg: 'bg-amber-50 text-amber-500' }
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 p-8 rounded-xl space-y-4 text-left group hover:shadow-md transition-all shadow-sm">
            <div className={`h-10 w-10 ${s.iconBg} rounded-lg flex items-center justify-center mb-2`}>
              <i className={`fa-solid ${s.icon} text-sm`}></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-10 shadow-sm space-y-10">
          <div className="space-y-1 border-l-4 border-blue-600 pl-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Evolução por Categoria</h4>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Distribuição de pauta operacional</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: '700', fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" barSize={14} radius={[0, 4, 4, 0]}>
                  {areaData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-between space-y-10">
          <div className="text-center space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Proveniência</h4>
            <div className="h-1 w-8 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={70} outerRadius={90} paddingAngle={4} stroke="none" cornerRadius={4}>
                  {originPieData.map((e, idx) => <Cell key={idx} fill={idx === 0 ? '#3B82F6' : '#F1F5F9'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{filteredClients.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Registros</span>
            </div>
          </div>
          <div className="space-y-3 w-full">
            {originPieData.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{e.name}</span>
                <span className="text-lg font-bold text-slate-900 tracking-tight">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
