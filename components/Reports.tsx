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
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4 text-left">
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">CENTRAL ANALÍTICA</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase font-serif">Relatórios</h2>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Processamento de Performance LexAI</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <div className="flex bg-white/5 p-1 border border-white/5">
            {['Both', 'Particular', 'Defensoria'].map(f => (
              <button key={f} onClick={() => setOriginFilter(f as any)} className={`px-8 py-3 font-black text-[9px] uppercase tracking-[0.3em] transition-all ${originFilter === f ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{f === 'Both' ? 'GERAL' : f.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => generateFinancialReport(filteredClients, settings)} className="px-10 py-4 border border-white/5 text-white font-black text-[9px] uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center gap-4">
            <i className="fa-solid fa-file-pdf text-brand-500"></i>
            EXPORTAR PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Demandas Totais', value: filteredClients.length, color: 'text-white' },
          { label: 'Volume Acordado', value: formatCurrency(financialSummary.totalAgreed), color: 'text-brand-500' },
          { label: 'Fluxo Realizado', value: formatCurrency(financialSummary.totalInitial), color: 'text-white' },
          { label: 'Ativos em Aberto', value: formatCurrency(financialSummary.totalPending), color: 'text-slate-800' }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/5 p-10 space-y-4 text-left group hover:border-white/10 transition-all">
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4">{s.label}</p>
            <h3 className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-12 space-y-12">
          <div className="space-y-4 border-l-2 border-brand-500 pl-8">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em]">EVOLUÇÃO POR CATEGORIA</h4>
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">DISTRIBUIÇÃO DE LITIGIOSIDADE OPERACIONAL</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: '900', fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0px' }} />
                <Bar dataKey="value" barSize={12} radius={[0, 0, 0, 0]}>
                  {areaData.map((e, idx) => <Cell key={idx} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-12 flex flex-col items-center justify-between space-y-12">
          <div className="text-center space-y-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em]">PROVENIÊNCIA</h4>
            <div className="h-[1px] w-12 bg-brand-500 mx-auto mt-6"></div>
          </div>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={originPieData} dataKey="value" innerRadius={80} outerRadius={100} paddingAngle={0} stroke="none">
                  {originPieData.map((e, idx) => <Cell key={idx} fill={idx === 0 ? '#7e8aee' : 'rgba(255,255,255,0.05)'} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl font-black text-white tracking-tighter leading-none">{filteredClients.length}</span>
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mt-3">REGISTROS</span>
            </div>
          </div>
          <div className="space-y-4 w-full">
            {originPieData.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center p-6 border border-white/5 bg-white/[0.01]">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">{e.name}</span>
                <span className="text-xl font-black text-white tracking-tighter">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
