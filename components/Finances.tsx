
import React, { useMemo, useState, useEffect } from 'react';
import { Client, ClientFinancials, Installment } from '../types';
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
      // Only include financial stats for clients owned by the current user
      if (c.userId === currentUserId && c.financials) {
        if (c.origin === 'Particular') {
          // Entrada
          if (c.financials.initialPayment) {
            if (c.financials.initialPaymentStatus === 'paid') recebidos += c.financials.initialPayment;
            else aReceber += c.financials.initialPayment;
          }

          // Parcelas
          c.financials.installments.forEach(inst => {
            if (inst.status === 'paid') recebidos += inst.value;
            else aReceber += inst.value;
          });

          // Êxito / Trabalhista / Previdenciário (Simulação de expectativa)
          if (c.financials.successFeeStatus === 'paid' || c.financials.laborPaymentDate) {
            const val = c.financials.laborFinalValue || (c.financials.totalAgreed * (c.financials.successFeePercentage || 0)) / 100;
            recebidos += val;
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
  }, [clients]);

  const translateStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID': return 'PAGO';
      case 'PENDING': return 'PENDENTE';
      case 'OVERDUE': return 'ATRASADO';
      default: return status;
    }
  };

  const togglePaymentStatus = (client: Client, itemId: string, currentStatus: string) => {
    if (!client.financials) return;

    const newFinancials = { ...client.financials };
    const currentIsPaid = currentStatus.toUpperCase() === 'PAGO' || currentStatus.toUpperCase() === 'PAID';
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
      isPaying ? 'Pagamento Confirmado' : 'Pagamento Estornado',
      `O status do lançamento de ${client.name} foi alterado para ${isPaying ? 'PAGO' : 'PENDENTE'}.`
    );
  };

  const handleUpdateFinancials = (financials: ClientFinancials) => {
    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        financials
      });
      onAddNotification('success', 'Estrutura Financeira Atualizada', `O plano de pagamento de ${editingClient.name} foi modificado.`);
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
      // Only show financial records for clients owned by the current user
      if (client.userId === currentUserId && client.financials) {
        if (client.origin === 'Particular') {
          // Entrada
          if (client.financials.initialPayment) {
            data.push({
              id: `in-${client.id}`,
              client,
              type: 'ENTRADA / SINAL',
              date: client.createdAt,
              value: client.financials.initialPayment,
              status: translateStatus(client.financials.initialPaymentStatus || 'paid'),
              isParticular: true
            });
          }
          // Parcelas (Cível/Criminal)
          client.financials.installments.forEach(inst => {
            data.push({
              id: inst.id,
              client,
              type: `PARCELA ${inst.number.toString().padStart(2, '0')}`,
              date: inst.dueDate,
              value: inst.value,
              status: translateStatus(inst.status),
              isParticular: true
            });
          });
          // Honorários de Êxito (Trabalhista / Previdenciário / Cláusula de Êxito)
          if (client.financials.successFeePercentage && client.financials.successFeePercentage > 0) {
            const label = client.caseType === 'Previdenciário' ? `ÊXITO (${client.financials.successFeePercentage}%) + ${client.financials.benefitInstallmentsCount} PARC. BENEF.` : `ÊXITO (${client.financials.successFeePercentage}%)`;
            data.push({
              id: `success-${client.id}`,
              client,
              type: label,
              date: client.financials.laborPaymentDate || 'Fim do Processo',
              value: client.financials.laborFinalValue > 0 ? client.financials.laborFinalValue : (client.financials.totalAgreed > 0 ? (client.financials.totalAgreed * client.financials.successFeePercentage / 100) : 0),
              status: (client.financials.successFeeStatus === 'paid' || (client.financials.laborPaymentDate && new Date(client.financials.laborPaymentDate + 'T23:59:59') <= new Date())) ? 'PAGO' : translateStatus(client.financials.successFeeStatus || 'pending'),
              isParticular: true,
              isExpectancy: true,
              laborFinalValue: client.financials.laborFinalValue,
              laborPaymentDate: client.financials.laborPaymentDate
            });
          }
        } else {
          // Lógica Defensoria
          if (client.caseType === 'Criminal') {
            data.push({
              id: `def70-${client.id}`,
              client,
              type: 'CERTIDÃO (70%)',
              date: client.financials.appointmentDate || client.createdAt,
              value: client.financials.defensoriaValue70 || (client.financials.totalAgreed * 0.7),
              status: client.financials.defensoriaStatus70?.toUpperCase() || 'PENDENTE',
              isEstimated: !client.financials.defensoriaValue70,
              paymentMonth: client.financials.defensoriaPaymentMonth70,
              isParticular: false
            });
            if (client.financials.hasRecourse) {
              data.push({
                id: `def30-${client.id}`,
                client,
                type: 'CERTIDÃO (30%)',
                date: client.financials.appointmentDate || client.createdAt,
                value: client.financials.defensoriaValue30 || (client.financials.totalAgreed * 0.3),
                status: client.financials.defensoriaStatus30?.toUpperCase() || 'PENDENTE',
                isEstimated: !client.financials.defensoriaValue30,
                paymentMonth: client.financials.defensoriaPaymentMonth30,
                isParticular: false
              });
            }
          } else {
            data.push({
              id: `def100-${client.id}`,
              client,
              type: 'CERTIDÃO INTEGRAL',
              date: client.financials.appointmentDate || client.createdAt,
              value: client.financials.defensoriaValue100 || client.financials.totalAgreed,
              status: client.financials.defensoriaStatus100?.toUpperCase() || 'PENDENTE',
              isEstimated: !client.financials.defensoriaValue100,
              paymentMonth: client.financials.defensoriaPaymentMonth100,
              isParticular: false
            });
          }
        }
      }
    });

    return data.filter(item => {
      const matchesTab =
        activeTab === 'GERAL' ||
        (activeTab === 'PARTICULAR' && item.client.origin === 'Particular') ||
        (activeTab === 'DEFENSORIA' && item.client.origin === 'Defensoria');

      const matchesSearch = item.client.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => {
      const dateA = a.paymentMonth || a.date;
      const dateB = b.paymentMonth || b.date;
      return dateB.localeCompare(dateA);
    });
  }, [clients, activeTab, searchTerm]);

  const groupedData = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    tableData.forEach(item => {
      const cid = item.client.id;
      if (!groups[cid]) groups[cid] = [];
      groups[cid].push(item);
    });
    return Object.values(groups).sort((a, b) => {
      // Sort groups by the most recent item date
      return b[0].date.localeCompare(a[0].date);
    });
  }, [tableData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Gestão de Ativos</span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Finanças & Honorários</h2>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo em Tempo Real</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-10 rounded-[3rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-sack-dollar"></i> Receita Confirmada
          </p>
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-xl font-bold opacity-60">R$</span>
            <h3 className="text-4xl font-black tracking-tighter">{stats.recebidos.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Saldo em Carteira</span>
            <i className="fa-solid fa-arrow-trend-up text-white/30"></i>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-white/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 h-32 w-32 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left"></i> Particular Pendente
          </p>
          <div className="flex items-baseline gap-2 text-slate-800">
            <span className="text-xl font-bold text-slate-300">R$</span>
            <h3 className="text-4xl font-black tracking-tighter">{stats.aReceber.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Expectativa de Recebimento</span>
            <i className="fa-solid fa-hourglass-half text-brand-500/30"></i>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl shadow-slate-900/10 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 h-32 w-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <i className="fa-solid fa-building-columns"></i> Defensoria Estimado
          </p>
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-xl font-bold opacity-30">R$</span>
            <h3 className="text-4xl font-black tracking-tighter">{stats.defensoriaPendente.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Convênio OAB/Defensoria</span>
            <i className="fa-solid fa-landmark text-white/10"></i>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-[1.8rem] w-full lg:w-fit shadow-inner border border-white/40">
          {['GERAL', 'PARTICULAR', 'DEFENSORIA'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 lg:flex-none px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-slate-300 group-focus-within:text-brand-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
          <input type="text" placeholder="Buscar por cliente ou processo..." className="w-full bg-white border border-slate-100 rounded-3xl pl-16 pr-8 py-5 outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-bold shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-premium border border-white/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-8">Vínculo Processual</th>
                <th className="px-6 py-8">Categoria</th>
                <th className="px-6 py-8 text-center">Status de Liquidação</th>
                <th className="px-10 py-8 text-right">Valor Final</th>
                <th className="px-6 py-8 text-right">Gerenciamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedData.length > 0 ? groupedData.map(group => {
                const client = group[0].client;
                const isExpanded = expandedClients.has(client.id);
                const totalItems = group.length;

                return (
                  <React.Fragment key={client.id}>
                    <tr className="bg-white hover:bg-slate-50/50 transition-all cursor-pointer group/parent" onClick={() => toggleClient(client.id)}>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/20' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                            <i className={`fa-solid ${isExpanded ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-base leading-tight mb-1 group-hover/parent:text-brand-600 transition-colors">{client.name}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${client.origin === 'Particular' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                              {client.origin} • {totalItems} Lançamento(s)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Área Atuante</span>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{client.caseType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center">
                        <span className="text-[10px] font-black text-slate-400 px-5 py-2 bg-slate-50 border border-slate-100 rounded-xl uppercase tracking-widest shadow-sm group-hover/parent:bg-white transition-colors">
                          {isExpanded ? 'Ocultar Detalhes' : 'Ver Extrato'}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Montante Contratual</span>
                          <span className="text-lg font-black text-slate-800 tracking-tighter">
                            {client.financials?.totalAgreed ? `R$ ${client.financials.totalAgreed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                          className="h-12 w-12 bg-white border border-slate-200 rounded-2xl text-slate-300 hover:text-brand-600 hover:border-brand-100 transition-all flex items-center justify-center shadow-sm active:scale-95 group-hover/parent:shadow-md"
                          title="Configurar Plano Financeiro"
                        >
                          <i className="fa-solid fa-sliders text-sm"></i>
                        </button>
                      </td>
                    </tr>

                    {/* Extrato Detalhado */}
                    {isExpanded && group.map((item, idx) => (
                      <tr key={item.id} className={`bg-slate-50/30 transition-all group/row animate-in fade-in slide-in-from-left-4 duration-500`} style={{ animationDelay: `${idx * 50}ms` }}>
                        <td className="px-10 py-5 pl-28 relative">
                          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-brand-200/50"></div>
                          <div className="absolute left-[68px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-brand-400"></div>
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-white border border-slate-100 text-slate-400 px-3 py-1 rounded-lg font-black uppercase shadow-sm">{item.client.financials?.method || 'N/A'}</span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter italic whitespace-nowrap">
                              {item.laborPaymentDate ? item.laborPaymentDate.split('-').reverse().join('/') : item.date.includes('T') ? new Date(item.date).toLocaleDateString('pt-BR') : item.date.split('-').reverse().join('/')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${item.status === 'PAGO' || item.status === 'PAGO PELO ESTADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              item.status === 'CERTIDÃO EMITIDA' ? 'bg-brand-50 text-brand-600 border-brand-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {item.status}
                            </span>
                            {item.paymentMonth && (
                              <span className="text-[9px] font-black text-brand-600/60 uppercase tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-calendar-check opacity-50"></i> {formatPaymentMonth(item.paymentMonth)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-10 py-5 text-right">
                          <p className="font-black text-slate-800 text-base tracking-tighter">
                            {item.isExpectancy && item.value === 0 ? 'A Definir' : `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                          </p>
                          {item.client.origin === 'Defensoria' && (
                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${item.isEstimated ? 'text-amber-500 italic opacity-70' : 'text-emerald-500'}`}>
                              {item.isEstimated ? 'Estimativa' : 'Consolidado'}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-3">
                            {item.isParticular && (
                              <button
                                onClick={() => togglePaymentStatus(item.client, item.id, item.status)}
                                className={`h-10 w-10 rounded-2xl transition-all flex items-center justify-center shadow-sm active:scale-90 ${item.status === 'PAGO' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-white text-slate-300 hover:text-emerald-600 hover:border-emerald-100 border border-slate-100'
                                  }`}
                                title={item.status === 'PAGO' ? "Relançar como Pendente" : "Marcar como Recebido"}
                              >
                                <i className={`fa-solid ${item.status === 'PAGO' ? 'fa-check-double' : 'fa-check'}`}></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center group">
                    <div className="h-24 w-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                      <i className="fa-solid fa-money-bill-transfer"></i>
                    </div>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] italic">Nenhum registro financeiro localizado para os critérios informados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
