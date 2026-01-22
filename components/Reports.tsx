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
    <div className="space-y-16 animate-in fade-in duration-1000 pb-40">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2 text-left">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Inteligência Jurídica</span>
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Análise de Performance</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white/5 p-1 border border-white/5">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${originFilter === f ? 'bg-brand-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}>{f === 'Both' ? 'CONSOLIDADO' : f.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => generateFinancialReport(filteredClients, settings)} className="h-14 px-10 bg-white/5 text-white border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">
            EXPORTAR RELATÓRIO PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
        {[
          { label: 'Demandas Totais', value: filteredClients.length, color: 'text-white' },
          { label: 'Volume Acordado', value: formatCurrency(financialSummary.totalAgreed), color: 'text-brand-500' },
          { label: 'Fluxo Realizado', value: formatCurrency(financialSummary.totalInitial), color: 'text-emerald-500' },
          { label: 'Ativos em Aberto', value: formatCurrency(financialSummary.totalPending), color: 'text-slate-500' }
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 p-10 space-y-4">
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">{s.label}</p>
            <h3 className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.value}</h3>
            <div className="h-[1px] w-6 bg-white/10"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-white/5">
        <div className="lg:col-span-2 bg-[#0A0A0B] p-16 space-y-16 border-r border-white/5">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Evolução por Categoria</h4>
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">Distribuição de Litigiosidade</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: '900', fill: '#475569', letterSpacing: '0.1em' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid #ffffff10', fontSize: '9px', fontWeight: '900' }} />
                <Bar dataKey="value" barSize={20}>
                  {areaData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-16 bg-white/[0.02] flex flex-col items-center justify-between space-y-12">
          <div className="text-center space-y-2 w-full">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Proveniência</h4>
            <div className="h-[1px] w-8 bg-brand-500 mx-auto mt-4"></div>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={80} outerRadius={100} paddingAngle={10} stroke="none">
                  {originPieData.map((e, idx) => <Cell key={idx} fill={idx === 0 ? '#C5A059' : '#1e293b'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black text-white italic tracking-tighter">{filteredClients.length}</span>
              <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">REGISTROS</span>
            </div>
          </div>
          <div className="space-y-4 w-full">
            {originPieData.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-6 border border-white/5 bg-white/[0.01]">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{e.name}</span>
                <span className="text-xl font-black text-white italic">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
