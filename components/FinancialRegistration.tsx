import React, { useState } from 'react';
import { ClientOrigin, ClientFinancials, PaymentMethod, PaymentPlan } from '../types';

interface FinancialRegistrationProps {
  origin: ClientOrigin;
  caseType: string;
  clientName: string;
  existingFinancials?: ClientFinancials;
  onBack: () => void;
  onFinish: (financials: ClientFinancials) => void;
}

const FinancialRegistration: React.FC<FinancialRegistrationProps> = ({
  origin,
  caseType,
  clientName,
  existingFinancials,
  onBack,
  onFinish
}) => {
  const isCriminal = caseType === 'Criminal';
  const isTrabalhista = caseType === 'Trabalhista';
  const isPrevidenciario = caseType === 'Previdenciário';

  const getDefaultPlan = (): PaymentPlan => {
    if (origin === 'Defensoria') return 'DefensoriaStandard';
    if (isTrabalhista) return 'OnSuccess';
    if (isPrevidenciario) return 'PrevidenciarioMix';
    return 'Installments';
  };

  const [formData, setFormData] = useState<any>({
    totalAgreed: existingFinancials?.totalAgreed || 0,
    initialPayment: existingFinancials?.initialPayment || 0,
    successFeePercentage: existingFinancials?.successFeePercentage || (isTrabalhista || isPrevidenciario ? 30 : 20),
    benefitInstallmentsCount: existingFinancials?.benefitInstallmentsCount || (isPrevidenciario ? 3 : 0),
    method: existingFinancials?.method || (origin === 'Defensoria' ? 'Certidão Estadual' : 'PIX'),
    plan: existingFinancials?.plan || getDefaultPlan(),
    numInstallments: existingFinancials?.installments?.length || 1,
    dueDay: existingFinancials?.dueDay || 10,
    defensoriaVoucher70: existingFinancials?.defensoriaVoucher70 || '',
    defensoriaStatus70: existingFinancials?.defensoriaStatus70 || 'Aguardando Sentença',
    defensoriaValue70: existingFinancials?.defensoriaValue70 || 0,
    defensoriaPaymentMonth70: existingFinancials?.defensoriaPaymentMonth70 || '',
    defensoriaVoucher30: existingFinancials?.defensoriaVoucher30 || '',
    defensoriaStatus30: existingFinancials?.defensoriaStatus30 || 'Pendente',
    defensoriaValue30: existingFinancials?.defensoriaValue30 || 0,
    defensoriaPaymentMonth30: existingFinancials?.defensoriaPaymentMonth30 || '',
    defensoriaVoucher100: existingFinancials?.defensoriaVoucher100 || '',
    defensoriaStatus100: existingFinancials?.defensoriaStatus100 || 'Pendente',
    defensoriaValue100: existingFinancials?.defensoriaValue100 || 0,
    defensoriaPaymentMonth100: existingFinancials?.defensoriaPaymentMonth100 || '',
    hasRecourse: existingFinancials?.hasRecourse || false,
    appointmentDate: existingFinancials?.appointmentDate || new Date().toISOString().split('T')[0],
    laborFinalValue: existingFinancials?.laborFinalValue || 0,
    laborPaymentDate: existingFinancials?.laborPaymentDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let installments = existingFinancials?.installments || [];

    if (origin === 'Particular' && formData.plan === 'Installments' && !isTrabalhista) {
      const valuePerInst = (formData.totalAgreed - (formData.initialPayment || 0)) / formData.numInstallments;
      installments = Array.from({ length: formData.numInstallments }).map((_, i) => ({
        id: installments[i]?.id || `inst_${Date.now()}_${i}`,
        number: i + 1,
        value: valuePerInst,
        dueDate: installments[i]?.dueDate || new Date(new Date().getFullYear(), new Date().getMonth() + i + 1, formData.dueDay).toISOString().split('T')[0],
        status: installments[i]?.status || 'pending'
      }));
    } else {
      installments = [];
    }

    const isPastOrPresent = formData.laborPaymentDate && new Date(formData.laborPaymentDate + 'T23:59:59') <= new Date();
    const successFeeStatus = (isPastOrPresent && formData.laborFinalValue > 0) ? 'paid' : formData.successFeeStatus || (existingFinancials?.successFeeStatus || 'pending');

    onFinish({ ...formData, successFeeStatus, installments });
  };

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest ml-1";

  return (
    <div className="bg-white p-8 md:p-12 space-y-10 animate-fade-in text-left">
      <div className="flex justify-between items-start border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Acordo Financeiro: {caseType}
          </h3>
          <p className="text-xs text-slate-500">Titular: {clientName.toUpperCase()}</p>
        </div>
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {origin === 'Particular' ? (
          <div className="grid grid-cols-1 gap-10">
            {(isTrabalhista || isPrevidenciario) && (
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                    <i className={`fa-solid ${isTrabalhista ? 'fa-gavel' : 'fa-hospital-user'}`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-sm tracking-tight">{isTrabalhista ? 'Natureza Trabalhista' : 'Natureza Previdenciária'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modelo de Êxito</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Percentual (%)</label>
                    <input type="number" className={inputClass} value={formData.successFeePercentage} onChange={e => setFormData({ ...formData, successFeePercentage: parseInt(e.target.value) })} />
                  </div>
                  {isPrevidenciario && (
                    <div className="space-y-2">
                      <label className={labelClass}>Qtd de Benefícios</label>
                      <input type="number" className={inputClass} value={formData.benefitInstallmentsCount} onChange={e => setFormData({ ...formData, benefitInstallmentsCount: parseInt(e.target.value) })} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 pt-8">
                  <div className="space-y-2">
                    <label className={labelClass}>Valor p/ Liquidação (R$)</label>
                    <input type="number" step="0.01" className={inputClass} value={formData.laborFinalValue} onChange={e => setFormData({ ...formData, laborFinalValue: parseFloat(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Data Prevista</label>
                    <input type="date" className={inputClass} value={formData.laborPaymentDate} onChange={e => setFormData({ ...formData, laborPaymentDate: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {!isTrabalhista && !isPrevidenciario && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Forma de Pagamento</label>
                  <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
                    {['PIX', 'Cartão', 'Dinheiro'].map(m => (
                      <button key={m} type="button" onClick={() => setFormData({ ...formData, method: m as PaymentMethod })} className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${formData.method === m ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Valor Total (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Entrada (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.initialPayment} onChange={e => setFormData({ ...formData, initialPayment: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Parcelas</label>
                  <input type="number" className={inputClass} value={formData.numInstallments} onChange={e => setFormData({ ...formData, numInstallments: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Dia Vencimento</label>
                  <input type="number" className={inputClass} value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) })} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Data da Nomeação</label>
                <input type="date" className={inputClass} value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Valor Honorários (R$)</label>
                <input type="number" step="0.01" className={inputClass} value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
              </div>
            </div>

            {isCriminal ? (
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Divisão de Guia (70/30)</h4>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="hidden" checked={formData.hasRecourse} onChange={e => setFormData({ ...formData, hasRecourse: e.target.checked })} />
                    <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${formData.hasRecourse ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                      {formData.hasRecourse && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Adicionar Recurso (30%)</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className={labelClass}>Guia Principal (70%)</label>
                    <input type="text" placeholder="Protocolo / Voucher" className={inputClass} value={formData.defensoriaVoucher70} onChange={e => setFormData({ ...formData, defensoriaVoucher70: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" step="0.01" placeholder="Valor R$" className={inputClass} value={formData.defensoriaValue70} onChange={e => setFormData({ ...formData, defensoriaValue70: parseFloat(e.target.value) })} />
                      <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth70} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth70: e.target.value })} />
                    </div>
                    <select className={inputClass} value={formData.defensoriaStatus70} onChange={e => setFormData({ ...formData, defensoriaStatus70: e.target.value })}>
                      <option value="Aguardando Sentença">Aguardando Sentença</option>
                      <option value="Certidão Emitida">Certidão Emitida</option>
                      <option value="Pago pelo Estado">Pago pelo Estado</option>
                    </select>
                  </div>
                  <div className={`space-y-4 transition-all ${!formData.hasRecourse ? 'opacity-30 pointer-events-none filter grayscale' : ''}`}>
                    <label className={labelClass}>Recurso (30%)</label>
                    <input type="text" placeholder="Protocolo Recurso" className={inputClass} value={formData.defensoriaVoucher30} onChange={e => setFormData({ ...formData, defensoriaVoucher30: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" step="0.01" placeholder="Valor R$" className={inputClass} value={formData.defensoriaValue30} onChange={e => setFormData({ ...formData, defensoriaValue30: parseFloat(e.target.value) })} />
                      <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth30} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth30: e.target.value })} />
                    </div>
                    <select className={inputClass} value={formData.defensoriaStatus30} onChange={e => setFormData({ ...formData, defensoriaStatus30: e.target.value })}>
                      <option value="Pendente">Aguardando Acórdão</option>
                      <option value="Certidão Emitida">Certidão Emitida</option>
                      <option value="Pago pelo Estado">Pago pelo Estado</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className={labelClass}>Registro da Guia (100%)</label>
                  <input type="text" placeholder="ID da Certidão" className={inputClass} value={formData.defensoriaVoucher100} onChange={e => setFormData({ ...formData, defensoriaVoucher100: e.target.value })} />
                  <select className={inputClass} value={formData.defensoriaStatus100} onChange={e => setFormData({ ...formData, defensoriaStatus100: e.target.value })}>
                    <option value="Aguardando Sentença">Aguardando Sentença</option>
                    <option value="Certidão Emitida">Certidão Emitida</option>
                    <option value="Pago pelo Estado">Pago pelo Estado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Valor Liquidado (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.defensoriaValue100} onChange={e => setFormData({ ...formData, defensoriaValue100: parseFloat(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Mês de Recebimento</label>
                  <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth100} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth100: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
          <button type="button" onClick={onBack} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Voltar</button>
          <button type="submit" className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">
            {existingFinancials ? 'Atualizar Ativos' : 'Finalizar Cadastro'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialRegistration;
