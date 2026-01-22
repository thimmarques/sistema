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

  const inputClass = "w-full p-5 bg-white/5 border border-white/10 rounded-none focus:border-brand-500 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-800";
  const labelClass = "block text-[9px] font-black uppercase text-slate-600 mb-3 tracking-[0.4em]";

  return (
    <div className="bg-[#0A0A0B] border border-white/10 p-16 space-y-12 animate-in zoom-in-95">
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-2">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em] italic">Consolidação Bancária</span>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase font-serif">
            Arranjo de Honorários: {caseType}
          </h3>
          <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Entidade: {clientName}</p>
        </div>
        <button onClick={onBack} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center">
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {origin === 'Particular' ? (
          <div className="grid grid-cols-1 gap-12">
            {(isTrabalhista || isPrevidenciario) && (
              <div className="bg-white/[0.02] p-10 border border-white/5 space-y-10">
                <div className="flex items-center gap-6">
                  <i className={`fa-solid ${isTrabalhista ? 'fa-gavel' : 'fa-hospital-user'} text-2xl text-brand-500`}></i>
                  <div>
                    <h4 className="text-lg font-black text-white italic uppercase">{isTrabalhista ? 'Natureza Trabalhista' : 'Natureza Previdenciária'}</h4>
                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">Modelo de Êxito Operacional</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className={labelClass}>Percentual Contratual (%)</label>
                    <input type="number" className={inputClass} value={formData.successFeePercentage} onChange={e => setFormData({ ...formData, successFeePercentage: parseInt(e.target.value) })} />
                  </div>
                  {isPrevidenciario && (
                    <div>
                      <label className={labelClass}>Parcelas de Benefício</label>
                      <input type="number" className={inputClass} value={formData.benefitInstallmentsCount} onChange={e => setFormData({ ...formData, benefitInstallmentsCount: parseInt(e.target.value) })} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-10">
                  <div>
                    <label className={labelClass}>Valor Liquidado (R$)</label>
                    <input type="number" step="0.01" className={inputClass} value={formData.laborFinalValue} onChange={e => setFormData({ ...formData, laborFinalValue: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className={labelClass}>Data do Recebimento</label>
                    <input type="date" className={inputClass} value={formData.laborPaymentDate} onChange={e => setFormData({ ...formData, laborPaymentDate: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {!isTrabalhista && !isPrevidenciario && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2">
                  <label className={labelClass}>Protocolo de Liquidação</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['PIX', 'Cartão', 'Dinheiro'].map(m => (
                      <button key={m} type="button" onClick={() => setFormData({ ...formData, method: m as PaymentMethod })} className={`py-4 text-[9px] font-black uppercase tracking-widest border transition-all ${formData.method === m ? 'bg-brand-500 text-black border-brand-500' : 'bg-white/5 text-slate-700 border-white/5 hover:text-white'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Valor Integral (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Aporte de Entrada (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.initialPayment} onChange={e => setFormData({ ...formData, initialPayment: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Número de Cotas (Parcelas)</label>
                  <input type="number" className={inputClass} value={formData.numInstallments} onChange={e => setFormData({ ...formData, numInstallments: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Dia do Ciclo (Vencimento)</label>
                  <input type="number" className={inputClass} value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) })} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className={labelClass}>Data da Nomeação Judicial</label>
                <input type="date" className={inputClass} value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Valor de Tabela Previsto (R$)</label>
                <input type="number" step="0.01" className={inputClass} value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
              </div>
            </div>

            {isCriminal ? (
              <div className="bg-white/[0.02] p-10 border border-white/5 space-y-10">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">Divisão de Certidão (70/30)</h4>
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input type="checkbox" className="hidden" checked={formData.hasRecourse} onChange={e => setFormData({ ...formData, hasRecourse: e.target.checked })} />
                    <div className={`h-4 w-4 border border-white/20 flex items-center justify-center transition-all ${formData.hasRecourse ? 'bg-brand-500 border-brand-500' : ''}`}>
                      {formData.hasRecourse && <i className="fa-solid fa-check text-[10px] text-black"></i>}
                    </div>
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Ativar 30% (Recurso)</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <label className={labelClass}>Protocolo 1ª Guia (70%)</label>
                    <input type="text" placeholder="VOUCHER / CERTIDÃO" className={inputClass} value={formData.defensoriaVoucher70} onChange={e => setFormData({ ...formData, defensoriaVoucher70: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="0.01" placeholder="VALOR R$" className={inputClass} value={formData.defensoriaValue70} onChange={e => setFormData({ ...formData, defensoriaValue70: parseFloat(e.target.value) })} />
                      <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth70} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth70: e.target.value })} />
                    </div>
                    <select className={inputClass} value={formData.defensoriaStatus70} onChange={e => setFormData({ ...formData, defensoriaStatus70: e.target.value })}>
                      <option value="Aguardando Sentença" className="bg-[#0A0A0B]">AGUARDANDO SENTENÇA</option>
                      <option value="Certidão Emitida" className="bg-[#0A0A0B]">CERTIDÃO EMITIDA</option>
                      <option value="Pago pelo Estado" className="bg-[#0A0A0B]">PAGO PELO ESTADO</option>
                    </select>
                  </div>
                  <div className={`space-y-6 transition-opacity ${!formData.hasRecourse ? 'opacity-20 pointer-events-none' : ''}`}>
                    <label className={labelClass}>Protocolo 2ª Guia (30%)</label>
                    <input type="text" placeholder="VOUCHER RECURSO" className={inputClass} value={formData.defensoriaVoucher30} onChange={e => setFormData({ ...formData, defensoriaVoucher30: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="0.01" placeholder="VALOR R$" className={inputClass} value={formData.defensoriaValue30} onChange={e => setFormData({ ...formData, defensoriaValue30: parseFloat(e.target.value) })} />
                      <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth30} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth30: e.target.value })} />
                    </div>
                    <select className={inputClass} value={formData.defensoriaStatus30} onChange={e => setFormData({ ...formData, defensoriaStatus30: e.target.value })}>
                      <option value="Pendente" className="bg-[#0A0A0B]">PENDENTE DE ACÓRDÃO</option>
                      <option value="Certidão Emitida" className="bg-[#0A0A0B]">CERTIDÃO EMITIDA</option>
                      <option value="Pago pelo Estado" className="bg-[#0A0A0B]">PAGO PELO ESTADO</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] p-10 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-6">
                  <label className={labelClass}>Certidão Integral (100%)</label>
                  <input type="text" placeholder="ID DA GUIA" className={inputClass} value={formData.defensoriaVoucher100} onChange={e => setFormData({ ...formData, defensoriaVoucher100: e.target.value })} />
                  <select className={inputClass} value={formData.defensoriaStatus100} onChange={e => setFormData({ ...formData, defensoriaStatus100: e.target.value })}>
                    <option value="Aguardando Sentença" className="bg-[#0A0A0B]">AGUARDANDO SENTENÇA</option>
                    <option value="Certidão Emitida" className="bg-[#0A0A0B]">CERTIDÃO EMITIDA</option>
                    <option value="Pago pelo Estado" className="bg-[#0A0A0B]">PAGO PELO ESTADO</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Montante Consolidado (R$)</label>
                  <input type="number" step="0.01" className={inputClass} value={formData.defensoriaValue100} onChange={e => setFormData({ ...formData, defensoriaValue100: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className={labelClass}>Mês do Ciclo (Recebimento)</label>
                  <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth100} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth100: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-10 pt-10 border-t border-white/5">
          <button type="button" onClick={onBack} className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] hover:text-white transition-all">RETORNAR</button>
          <button type="submit" className="flex-1 bg-brand-500 text-black py-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-2xl">
            {existingFinancials ? 'SINCRONIZAR ATIVOS' : 'CONSOLIDAR ACORDO JURÍDICO'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialRegistration;
