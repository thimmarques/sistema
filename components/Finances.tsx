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
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2 text-left">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Gestão de Ativos</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financeiro</h2>
          <p className="text-sm text-slate-500 font-medium">Controle de receitas e honorários</p>
        </div>
        <div className="bg-white px-6 py-2 rounded-full border border-slate-200 flex items-center gap-3 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Transações em Tempo Real</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Receita Consolidada', value: stats.recebidos, color: 'text-blue-600', icon: 'fa-vault', bg: 'bg-blue-50' },
          { label: 'A Receber (Particular)', value: stats.aReceber, color: 'text-slate-900', icon: 'fa-arrow-trend-up', bg: 'bg-white' },
          { label: 'Estimativa (Convênio)', value: stats.defensoriaPendente, color: 'text-slate-600', icon: 'fa-building-columns', bg: 'bg-slate-50' }
        ].map((s, idx) => (
          <div key={idx} className={`${s.bg} border border-slate-200 p-6 rounded-xl shadow-sm space-y-4 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-all">
              <i className={`fa-solid ${s.icon} text-6xl`}></i>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-slate-400">R$</span>
              <h3 className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center border-b border-slate-200 pb-8">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full lg:w-fit">
          {['GERAL', 'PARTICULAR', 'DEFENSORIA'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full group">
          <input type="text" placeholder="Localizar lançamento..." className="w-full bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 p-3 pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><i className="fa-solid fa-magnifying-glass text-sm"></i></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Titularidade / Registro</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedData.map(group => {
                const client = group[0].client;
                const isExpanded = expandedClients.has(client.id);
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-slate-50 transition-all cursor-pointer group/row" onClick={() => toggleClient(client.id)}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs text-slate-400 group-hover/row:text-blue-500 transition-colors`}></i>
                          <div className="text-left">
                            <p className="font-bold text-slate-900 text-sm">{client.name}</p>
                            <p className="text-xs font-medium text-slate-500">{client.caseNumber || 'S/ Processo'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-slate-100 ${client.origin === 'Particular' ? 'text-blue-600' : 'text-emerald-600'}`}>{client.origin}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{isExpanded ? 'Expandido' : 'Resumido'}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(client.financials?.totalAgreed || 0)}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && group.map((item, idx) => (
                      <tr key={item.id} className="bg-slate-50/50">
                        <td className="px-6 py-4 pl-16">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                          {item.date.includes('T') ? new Date(item.date).toLocaleDateString('pt-BR') : item.date.split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${item.status === 'LIQUIDADO' || item.status === 'PAGO PELO ESTADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-slate-700">{formatCurrency(item.value)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.isParticular && (
                            <button onClick={() => togglePaymentStatus(item.client, item.id, item.status)} className={`p-2 rounded-lg transition-all ${item.status === 'LIQUIDADO' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                              <i className={`fa-solid ${item.status === 'LIQUIDADO' ? 'fa-check-double text-xs' : 'fa-check text-xs'}`}></i>
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
              <i className="fa-solid fa-folder-open text-4xl text-slate-200"></i>
              <p className="text-sm font-medium text-slate-500">Nenhum registro financeiro encontrado</p>
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
