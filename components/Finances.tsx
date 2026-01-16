
import React, { useMemo, useState } from 'react';
import { Client, ClientFinancials, Installment } from '../types';
import FinancialRegistration from './FinancialRegistration';

interface FinancesProps {
  clients: Client[];
  onUpdateClient: (client: Client) => void;
  onAddNotification: (type: 'success' | 'info' | 'alert', title: string, message: string) => void;
  initialTab?: 'PARTICULAR' | 'DEFENSORIA' | 'GERAL';
}

const Finances: React.FC<FinancesProps> = ({ clients, onUpdateClient, onAddNotification, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'PARTICULAR' | 'DEFENSORIA' | 'GERAL'>(initialTab || 'GERAL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const stats = useMemo(() => {
    let recebidos = 0;
    let aReceber = 0;
    let defensoriaPendente = 0;

    clients.forEach(c => {
      if (c.origin === 'Particular' && c.financials) {
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
        if (c.financials.successFeeStatus === 'paid') {
          const val = (c.financials.totalAgreed * (c.financials.successFeePercentage || 0)) / 100;
          recebidos += val;
        }
      }

      if (c.origin === 'Defensoria' && c.financials) {
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
      if (client.financials) {
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
              date: 'Fim do Processo',
              value: client.financials.totalAgreed > 0 ? (client.financials.totalAgreed * client.financials.successFeePercentage / 100) : 0,
              status: translateStatus(client.financials.successFeeStatus || 'pending'),
              isParticular: true,
              isExpectancy: true
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

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão Financeira</h2>
          <p className="text-sm text-slate-400 font-medium">Controle de honorários especializados por área jurídica.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i> Receita Confirmada
          </p>
          <h3 className="text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform origin-left">R$ {stats.recebidos.toLocaleString('pt-BR')}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fa-solid fa-clock"></i> Particular Pendente
          </p>
          <h3 className="text-3xl font-black text-indigo-600 group-hover:scale-105 transition-transform origin-left">R$ {stats.aReceber.toLocaleString('pt-BR')}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 transition-all hover:shadow-md group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <i className="fa-solid fa-file-invoice"></i> Defensoria (Total Estimado)
          </p>
          <h3 className="text-3xl font-black text-slate-800 group-hover:scale-105 transition-transform origin-left">R$ {stats.defensoriaPendente.toLocaleString('pt-BR')}</h3>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full lg:w-fit">
          {['GERAL', 'PARTICULAR', 'DEFENSORIA'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
          <input type="text" placeholder="Filtrar lançamentos..." className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b">
            <tr>
              <th className="px-10 py-6">Cliente</th>
              <th className="px-6 py-6">Lançamento / Método</th>
              <th className="px-6 py-6">Tipo Ação</th>
              <th className="px-6 py-6 text-center">Status / Previsão</th>
              <th className="px-10 py-6 text-right">Valor</th>
              <th className="px-6 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableData.length > 0 ? tableData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group/row">
                <td className="px-10 py-6">
                  <p className="font-bold text-slate-700 text-sm">{item.client.name}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${item.client.origin === 'Particular' ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {item.client.origin}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase">{item.client.financials?.method}</span>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">Data: {item.date.includes('T') ? new Date(item.date).toLocaleDateString('pt-BR') : item.date.split('-').reverse().join('/')}</p>
                  </div>
                </td>
                <td className="px-6 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.client.caseType}</td>
                <td className="px-6 py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'PAGO' || item.status === 'PAGO PELO ESTADO' ? 'bg-emerald-50 text-emerald-500' :
                        item.status === 'CERTIDÃO EMITIDA' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                      {item.status}
                    </span>
                    {item.paymentMonth && (
                      <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1 mt-1">
                        <i className="fa-solid fa-calendar-check text-[8px]"></i> {formatPaymentMonth(item.paymentMonth)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  <p className="font-black text-slate-800">
                    {item.isExpectancy && item.value === 0 ? 'A Definir' : `R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </p>
                  {item.client.origin === 'Defensoria' && (
                    <p className={`text-[9px] font-black uppercase tracking-tight ${item.isEstimated ? 'text-amber-500 italic' : 'text-emerald-500'}`}>
                      {item.isEstimated ? 'Previsão inicial' : 'Valor Confirmado'}
                    </p>
                  )}
                  {item.isExpectancy && (
                    <p className="text-[9px] font-black uppercase tracking-tight text-indigo-500 italic">Expectativa de Êxito</p>
                  )}
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    {item.isParticular && !item.isExpectancy && (
                      <button
                        onClick={() => togglePaymentStatus(item.client, item.id, item.status)}
                        className={`h-10 w-10 rounded-xl transition-all flex items-center justify-center ${item.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        title={item.status === 'PAGO' ? "Marcar como Pendente" : "Confirmar Recebimento"}
                      >
                        <i className={`fa-solid ${item.status === 'PAGO' ? 'fa-check-double' : 'fa-check'}`}></i>
                      </button>
                    )}
                    <button
                      onClick={() => setEditingClient(item.client)}
                      className="h-10 w-10 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                      title="Editar Plano de Pagamento"
                    >
                      <i className="fa-solid fa-file-pen text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-10 py-20 text-center text-slate-300 text-xs font-black uppercase tracking-[0.2em] italic">Nenhum registro financeiro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
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
