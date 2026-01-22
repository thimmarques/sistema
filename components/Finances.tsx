import React, { useMemo, useState, useEffect } from 'react';
import { Client, ClientFinancials } from '../types';
import { formatCurrency } from '../src/utils/format';
import FinancialRegistration from './FinancialRegistration';

interface FinancesProps {
  clients: Client[];
  onUpdateClient: (client: Client) => void;
  onAddNotification: (type: 'success' | 'info' | 'alert', title: string, message: string) => void;
  initialTab?: 'PARTICULAR' | 'DEFENSORIA' | 'GERAL';
  currentUserId?: string;
}

const Finances: React.FC<FinancesProps> = ({ clients, currentUserId, onUpdateClient, onAddNotification, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'PARTICULAR' | 'DEFENSORIA' | 'GERAL'>(initialTab || 'GERAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const toggleClient = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) newExpanded.delete(clientId);
    else newExpanded.add(clientId);
    setExpandedClients(newExpanded);
  };

  const stats = useMemo(() => {
    let recebidos = 0;
    let aReceber = 0;
    let defensoriaPendente = 0;

    clients.forEach(c => {
      if (c.userId === currentUserId && c.financials) {
        if (c.origin === 'Particular') {
          if (c.financials.initialPayment) {
            if (c.financials.initialPaymentStatus === 'paid') recebidos += c.financials.initialPayment;
            else aReceber += c.financials.initialPayment;
          }
          c.financials.installments.forEach(inst => {
            if (inst.status === 'paid') recebidos += inst.value;
            else aReceber += inst.value;
          });
          const isPaid = c.financials.successFeeStatus === 'paid' ||
            (c.financials.laborPaymentDate && new Date(c.financials.laborPaymentDate + 'T23:59:59') <= new Date());

          if (isPaid) {
            const val = c.financials.laborFinalValue || (c.financials.totalAgreed * (c.financials.successFeePercentage || 0)) / 100;
            recebidos += val;
          } else if (c.financials.successFeePercentage) {
            const val = c.financials.laborFinalValue || (c.financials.totalAgreed * (c.financials.successFeePercentage || 0)) / 100;
            aReceber += val;
          }
        }
        if (c.origin === 'Defensoria') {
          if (c.caseType === 'Criminal') {
            const val70 = c.financials.defensoriaValue70 || (c.financials.totalAgreed * 0.7);
            const val30 = c.financials.defensoriaValue30 || (c.financials.totalAgreed * 0.3);
            if (c.financials.defensoriaStatus70 === 'Pago pelo Estado') recebidos += val70;
            else defensoriaPendente += val70;
            if (c.financials.hasRecourse) {
              if (c.financials.defensoriaStatus30 === 'Pago pelo Estado') recebidos += val30;
              else defensoriaPendente += val30;
            }
          } else {
            const val100 = c.financials.defensoriaValue100 || c.financials.totalAgreed;
            if (c.financials.defensoriaStatus100 === 'Pago pelo Estado') recebidos += val100;
            else defensoriaPendente += val100;
          }
        }
      }
    });
    return { recebidos, aReceber, defensoriaPendente };
  }, [clients, currentUserId]);

  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'LIQUIDADO';
      case 'PENDING': return 'PENDENTE';
      case 'OVERDUE': return 'EM ATRASO';
      default: return status;
    }
  };

  const togglePaymentStatus = (client: Client, itemId: string, currentStatus: string) => {
    if (!client.financials) return;
    const newFinancials = { ...client.financials };
    const currentIsPaid = currentStatus.toUpperCase() === 'LIQUIDADO' || currentStatus.toUpperCase() === 'PAID';
    const isPaying = !currentIsPaid;

    if (itemId.startsWith('inst_')) {
      newFinancials.installments = newFinancials.installments.map(inst =>
        inst.id === itemId ? {
          ...inst,
          status: isPaying ? 'paid' : 'pending',
          paidAt: isPaying ? new Date().toISOString() : undefined
        } : inst
      );
    }
    else if (itemId.startsWith('in-')) {
      newFinancials.initialPaymentStatus = isPaying ? 'paid' : 'pending';
    }
    else if (itemId.startsWith('success-')) {
      newFinancials.successFeeStatus = isPaying ? 'paid' : 'pending';
    }

    onUpdateClient({ ...client, financials: newFinancials });
    onAddNotification(
      isPaying ? 'success' : 'info',
      isPaying ? 'Protocolo de Recebimento' : 'Protocolo de Estorno',
      `O status do lançamento de ${client.name} foi atualizado.`
    );
  };

  const handleUpdateFinancials = (financials: ClientFinancials) => {
    if (editingClient) {
      onUpdateClient({ ...editingClient, financials });
      onAddNotification('success', 'Estrutura Financeira Atualizada', 'O plano de ativos foi modificado.');
      setEditingClient(null);
    }
  };

  const formatPaymentMonth = (monthStr?: string) => {
    if (!monthStr) return null;
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const tableData = useMemo(() => {
    const data: any[] = [];
    clients.forEach(client => {
      if (client.userId === currentUserId && client.financials) {
        if (client.origin === 'Particular') {
          if (client.financials.initialPayment) {
            data.push({
              id: `in-${client.id}`, client, type: 'APORTE INICIAL', date: client.createdAt,
              value: client.financials.initialPayment,
              status: translateStatus(client.financials.initialPaymentStatus || 'paid'),
              isParticular: true
            });
          }
          client.financials.installments.forEach(inst => {
            data.push({
              id: inst.id, client, type: `PARCELA ${inst.number.toString().padStart(2, '0')}`,
              date: inst.dueDate, value: inst.value, status: translateStatus(inst.status),
              isParticular: true
            });
          });
          if (client.financials.successFeePercentage && client.financials.successFeePercentage > 0) {
            data.push({
              id: `success-${client.id}`, client, type: `HONORÁRIOS ÊXITO (${client.financials.successFeePercentage}%)`,
              date: client.financials.laborPaymentDate || 'CONCLUSÃO',
              value: client.financials.laborFinalValue > 0 ? client.financials.laborFinalValue : (client.financials.totalAgreed > 0 ? (client.financials.totalAgreed * client.financials.successFeePercentage / 100) : 0),
              status: (client.financials.successFeeStatus === 'paid' || (client.financials.laborPaymentDate && new Date(client.financials.laborPaymentDate + 'T23:59:59') <= new Date())) ? 'LIQUIDADO' : translateStatus(client.financials.successFeeStatus || 'pending'),
              isParticular: true, isExpectancy: true
            });
          }
        } else {
          if (client.caseType === 'Criminal') {
            data.push({
              id: `def70-${client.id}`, client, type: 'CERTIDÃO (70%)', date: client.financials.appointmentDate || client.createdAt,
              value: client.financials.defensoriaValue70 || (client.financials.totalAgreed * 0.7),
              status: client.financials.defensoriaStatus70?.toUpperCase() || 'PENDENTE',
              isEstimated: !client.financials.defensoriaValue70, paymentMonth: client.financials.defensoriaPaymentMonth70, isParticular: false
            });
            if (client.financials.hasRecourse) {
              data.push({
                id: `def30-${client.id}`, client, type: 'CERTIDÃO (30%)', date: client.financials.appointmentDate || client.createdAt,
                value: client.financials.defensoriaValue30 || (client.financials.totalAgreed * 0.3),
                status: client.financials.defensoriaStatus30?.toUpperCase() || 'PENDENTE',
                isEstimated: !client.financials.defensoriaValue30, paymentMonth: client.financials.defensoriaPaymentMonth30, isParticular: false
              });
            }
          } else {
            data.push({
              id: `def100-${client.id}`, client, type: 'CERTIDÃO INTEGRAL', date: client.financials.appointmentDate || client.createdAt,
              value: client.financials.defensoriaValue100 || client.financials.totalAgreed,
              status: client.financials.defensoriaStatus100?.toUpperCase() || 'PENDENTE',
              isEstimated: !client.financials.defensoriaValue100, paymentMonth: client.financials.defensoriaPaymentMonth100, isParticular: false
            });
          }
        }
      }
    });

    return data.filter(item => {
      const matchesTab = activeTab === 'GERAL' || (activeTab === 'PARTICULAR' && item.client.origin === 'Particular') || (activeTab === 'DEFENSORIA' && item.client.origin === 'Defensoria');
      const matchesSearch = item.client.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => (b.paymentMonth || b.date).localeCompare(a.paymentMonth || a.date));
  }, [clients, activeTab, searchTerm, currentUserId]);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    tableData.forEach(item => {
      const cid = item.client.id;
      if (!groups[cid]) groups[cid] = [];
      groups[cid].push(item);
    });
    return Object.values(groups).sort((a, b) => b[0].date.localeCompare(a[0].date));
  }, [tableData]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2 text-left">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Fluxo de Caixa</span>
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Ativos & Honorários</h2>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-none px-10 py-5 flex items-center gap-6">
          <div className="h-1 w-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Monitoramento Bancário Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        {[
          { label: 'RECEITA CONSOLIDADA', value: stats.recebidos, color: 'text-emerald-500' },
          { label: 'PREVISÃO PARTICULAR', value: stats.aReceber, color: 'text-brand-500' },
          { label: 'EXPECTATIVA CONVÊNIO', value: stats.defensoriaPendente, color: 'text-slate-500' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white/[0.02] border border-white/5 p-10 space-y-4">
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-800 italic">R$</span>
              <h3 className={`text-4xl font-black tracking-tighter text-white`}>{s.value.toLocaleString('pt-BR')}</h3>
            </div>
            <div className="h-[1px] w-8 bg-white/10"></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-0 items-center border-b border-white/5 pb-10">
        <div className="flex bg-white/5 p-1 border border-white/5">
          {['GERAL', 'PARTICULAR', 'DEFENSORIA'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-10 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-brand-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full mt-10 lg:mt-0 lg:ml-10 group">
          <input type="text" placeholder="LOCALIZAR LANÇAMENTO..." className="w-full bg-white/5 border border-white/10 p-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-500"><i className="fa-solid fa-magnifying-glass text-xs"></i></div>
        </div>
      </div>

      <div className="bg-[#0A0A0B] border border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-white/5 text-[9px] uppercase font-black text-slate-600 tracking-[0.3em]">
              <tr>
                <th className="px-10 py-8">Titularidade / Registro</th>
                <th className="px-6 py-8">Origem</th>
                <th className="px-6 py-8 text-center">Status Financeiro</th>
                <th className="px-10 py-8 text-right">Valor em Custódia</th>
                <th className="px-10 py-8 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groupedData.map(group => {
                const client = group[0].client;
                const isExpanded = expandedClients.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-white/[0.01] transition-all cursor-pointer group/row" onClick={() => toggleClient(client.id)}>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                          <i className={`fa-solid ${isExpanded ? 'fa-minus' : 'fa-plus'} text-[8px] text-brand-500`}></i>
                          <div className="space-y-1 text-left">
                            <p className="font-black text-white text-lg tracking-tight uppercase italic group-hover/row:text-brand-500 transition-colors">{client.name}</p>
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{client.caseNumber || 'SEM PROCESSO'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-10">
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${client.origin === 'Particular' ? 'text-brand-500' : 'text-emerald-500'}`}>{client.origin}</span>
                      </td>
                      <td className="px-6 py-10 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1 w-6 bg-white/5"></div>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{isExpanded ? 'DETALHADO' : 'AGRUPADO'}</span>
                          <div className="h-1 w-6 bg-white/5"></div>
                        </div>
                      </td>
                      <td className="px-10 py-10 text-right">
                        <p className="text-xl font-black text-white italic tracking-tighter">
                          {formatCurrency(client.financials?.totalAgreed || 0)}
                        </p>
                      </td>
                      <td className="px-10 py-10 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); }} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center">
                          <i className="fa-solid fa-terminal text-xs"></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && group.map((item, idx) => (
                      <tr key={item.id} className="bg-white/[0.02] border-l border-brand-500/30 animate-in slide-in-from-left-2 duration-500">
                        <td className="px-10 py-6 pl-24">
                          <div className="flex items-center gap-4">
                            <div className="h-[1px] w-4 bg-white/10"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-[9px] font-black text-slate-700 uppercase italic">
                          {item.date.includes('T') ? new Date(item.date).toLocaleDateString('pt-BR') : item.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className={`px-4 py-1.5 border font-black text-[9px] tracking-widest uppercase ${item.status === 'LIQUIDADO' || item.status === 'PAGO PELO ESTADO' ? 'border-emerald-500 text-emerald-500' : 'border-slate-800 text-slate-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <p className="text-lg font-black text-white opacity-60 tracking-tighter italic">{formatCurrency(item.value)}</p>
                        </td>
                        <td className="px-10 py-6 text-right">
                          {item.isParticular && (
                            <button onClick={() => togglePaymentStatus(item.client, item.id, item.status)} className={`h-10 w-10 transition-all flex items-center justify-center ${item.status === 'LIQUIDADO' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-800 hover:text-white'}`}>
                              <i className={`fa-solid ${item.status === 'LIQUIDADO' ? 'fa-check-double' : 'fa-check'} text-[10px]`}></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {groupedData.length === 0 && (
            <div className="py-40 text-center text-[10px] font-black uppercase text-slate-900 tracking-[1em]">Vazio Operacional</div>
          )}
        </div>
      </div>

      {editingClient && (
        <FinancialRegistration
          origin={editingClient.origin}
          caseType={editingClient.caseType}
          clientName={editingClient.name}
          existingFinancials={editingClient.financials}
          onBack={() => setEditingClient(null)}
          onFinish={handleUpdateFinancials}
        />
      )}
    </div>
  );
};

export default Finances;
