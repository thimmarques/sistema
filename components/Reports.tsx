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
    'Cível': '#C5A059',
    'Criminal': '#F43F5E',
    'Trabalhista': '#10B981',
    'Família': '#D97706',
    'Tributário': '#06B6D4',
    'Previdenciário': '#8B5CF6',
    'Outros': '#475569'
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
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Performance e Métricas</h2>
          <p className="text-slate-500">Visão analítica do portfólio jurídico.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${originFilter === f ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f === 'Both' ? 'GERAL' : f.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => generateFinancialReport(filteredClients, settings)} className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <i className="fa-solid fa-file-pdf text-rose-500"></i>
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Demandas Totais', value: filteredClients.length, color: 'text-slate-900' },
          { label: 'Volume Acordado', value: formatCurrency(financialSummary.totalAgreed), color: 'text-brand-600' },
          { label: 'Fluxo Realizado', value: formatCurrency(financialSummary.totalInitial), color: 'text-emerald-600' },
          { label: 'Ativos em Aberto', value: formatCurrency(financialSummary.totalPending), color: 'text-slate-500' }
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <h3 className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 space-y-8 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Evolução por Categoria</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Distribuição de Litigiosidade</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: '700', fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                  {areaData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col items-center justify-between space-y-8">
          <div className="text-center space-y-1 w-full">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Proveniência</h4>
            <div className="h-1 w-8 bg-brand-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={70} outerRadius={90} paddingAngle={8} stroke="none">
                  {originPieData.map((e, idx) => <Cell key={idx} fill={idx === 0 ? '#4f46e5' : '#e2e8f0'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-slate-900 leading-none">{filteredClients.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registros</span>
            </div>
          </div>
          <div className="space-y-3 w-full">
            {originPieData.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{e.name}</span>
                <span className="text-lg font-bold text-slate-900">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
