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
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4 text-left">
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">MONITORAMENTO DE ATIVOS</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase font-serif">Financeiro Estratégico</h2>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocolo de Operação de Capital</p>
        </div>
        <div className="bg-white/5 px-8 py-4 border border-white/10 flex items-center gap-4">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">SISTEMA ANALÍTICO</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'RECEITA CONSOLIDADA', value: stats.recebidos, color: 'text-brand-500', icon: 'fa-vault' },
          { label: 'PREVISÃO PARTICULAR', value: stats.aReceber, color: 'text-white', icon: 'fa-arrow-trend-up' },
          { label: 'EXPECTATIVA CONVÊNIO', value: stats.defensoriaPendente, color: 'text-slate-800', icon: 'fa-building-columns' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white/5 border border-white/5 p-10 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
              <i className={`fa-solid ${s.icon} text-4xl`}></i>
            </div>
            <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4">{s.label}</p>
            <div className="flex items-baseline gap-3 text-white">
              <span className="text-sm font-black text-slate-800 tracking-tighter">BRL</span>
              <h3 className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center border-b border-white/5 pb-10">
        <div className="flex bg-white/5 p-1 border border-white/5 w-full lg:w-fit">
          {['GERAL', 'PARTICULAR', 'DEFENSORIA'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-10 py-3 font-black text-[9px] uppercase tracking-[0.3em] transition-all ${activeTab === tab ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="LOCALIZAR LANÇAMENTO..." className="w-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900 p-4 pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-brand-500 transition-colors"><i className="fa-solid fa-magnifying-glass text-xs"></i></div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">TITULARIDADE / REGISTRO</th>
                <th className="px-8 py-6">ORIGEM</th>
                <th className="px-8 py-6 text-center">STATUS OPERACIONAL</th>
                <th className="px-8 py-6 text-right">VALOR</th>
                <th className="px-8 py-6 text-right">TERMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groupedData.map(group => {
                const client = group[0].client;
                const isExpanded = expandedClients.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-white/5 transition-all cursor-pointer group/row" onClick={() => toggleClient(client.id)}>
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-6">
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[10px] text-slate-900 group-hover/row:text-brand-500`}></i>
                          <div className="text-left space-y-1">
                            <p className="font-black text-white uppercase tracking-widest text-sm group-hover/row:text-brand-500 transition-colors">{client.name}</p>
                            <p className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.2em]">{client.caseNumber || 'S/ PROC'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border ${client.origin === 'Particular' ? 'border-brand-500/20 text-brand-500' : 'border-emerald-500/20 text-emerald-500'}`}>{client.origin}</span>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">{isExpanded ? 'DETALHISTA' : 'RESUMIDO'}</span>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <p className="text-sm font-black text-white tracking-widest">
                          {formatCurrency(client.financials?.totalAgreed || 0)}
                        </p>
                      </td>
                      <td className="px-8 py-8 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); }} className="p-3 border border-white/5 text-slate-800 hover:text-white hover:border-white/20 transition-all">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && group.map((item, idx) => (
                      <tr key={item.id} className="bg-white/[0.01]">
                        <td className="px-8 py-6 pl-20">
                          <div className="flex items-center gap-4">
                            <div className="h-[1px] w-4 bg-white/5"></div>
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-[9px] font-black text-slate-800 uppercase tracking-widest">
                          {item.date.includes('T') ? new Date(item.date).toLocaleDateString('pt-BR') : item.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-2 text-[8px] font-black tracking-[0.3em] uppercase border ${item.status === 'LIQUIDADO' || item.status === 'PAGO PELO ESTADO' ? 'border-emerald-500/20 text-emerald-500' : 'border-slate-500/10 text-slate-800'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className="text-xs font-black text-white tracking-widest">{formatCurrency(item.value)}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {item.isParticular && (
                            <button onClick={() => togglePaymentStatus(item.client, item.id, item.status)} className={`p-3 border transition-all ${item.status === 'LIQUIDADO' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-white/5 text-slate-900 hover:text-white hover:border-white/20'}`}>
                              <i className={`fa-solid ${item.status === 'LIQUIDADO' ? 'fa-check-double text-[10px]' : 'fa-check text-[10px]'}`}></i>
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
            <div className="py-20 text-center space-y-4">
              <i className="fa-solid fa-radar text-4xl text-white/5"></i>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Aguardando Novas Movimentações</p>
            </div>
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
