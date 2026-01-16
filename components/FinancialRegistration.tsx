
import React, { useState, useEffect } from 'react';
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

  // Define o plano padrão baseado na área
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
    // Defensoria Fields
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

    // Só gera parcelas se o plano for parcelado e não for áreas de êxito puro
    if (origin === 'Particular' && formData.plan === 'Installments' && !isTrabalhista) {
      const valuePerInst = (formData.totalAgreed - (formData.initialPayment || 0)) / formData.numInstallments;
      installments = Array.from({ length: formData.numInstallments }).map((_, i) => ({
        id: installments[i]?.id || `inst_${Date.now()}_${i}`,
        number: i + 1,
        value: valuePerInst,
        // Fix: Use the standard Date constructor with Year, MonthIndex, and Day to avoid setYear deprecation errors and incorrect timestamp parsing.
        dueDate: installments[i]?.dueDate || new Date(new Date().getFullYear(), new Date().getMonth() + i + 1, formData.dueDay).toISOString().split('T')[0],
        status: installments[i]?.status || 'pending'
      }));
    } else {
      installments = []; // Limpa parcelas se mudar de plano para "Ao Final"
    }

    onFinish({
      ...formData,
      installments
    });
  };

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-bold text-slate-700 transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] p-10 space-y-10 shadow-2xl animate-in zoom-in-95 my-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {existingFinancials ? 'Atualizar Protocolo Financeiro' : 'Etapa Final: Acordo de Honorários'}
            </span>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              Configuração {caseType}
            </h3>
            <p className="text-sm text-slate-400 font-medium italic">Cliente: <span className="text-slate-700 font-black uppercase">{clientName}</span></p>
          </div>
          <button onClick={onBack} className="h-12 w-12 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {origin === 'Particular' ? (
            <div className="space-y-8">
              {/* Opções para Trabalhista */}
              {isTrabalhista && (
                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 animate-in fade-in">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-200">
                      <i className="fa-solid fa-gavel"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">Modelo de Êxito (Trabalhista)</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pagamento ao final do processo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className={labelClass}>Porcentagem de Honorários (%)</label>
                      <div className="relative">
                        <input type="number" step="1" className={`${inputClass} text-2xl pr-12`} value={formData.successFeePercentage} onChange={e => setFormData({ ...formData, successFeePercentage: parseInt(e.target.value) })} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic">Geralmente fixado em 30% para ações trabalhistas.</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                      <p className="text-sm font-bold text-slate-600">O cliente pagará a porcentagem acima sobre o valor bruto da condenação ou acordo judicial.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div className="space-y-2">
                      <label className={labelClass}>Valor Final após Processo (R$)</label>
                      <input type="number" step="0.01" className={inputClass} value={formData.laborFinalValue} onChange={e => setFormData({ ...formData, laborFinalValue: parseFloat(e.target.value) })} />
                      <p className="text-[10px] text-slate-400 font-medium italic text-right">Valor bruto da condenação ou acordo.</p>
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Data do Pagamento</label>
                      <input type="date" className={inputClass} value={formData.laborPaymentDate} onChange={e => setFormData({ ...formData, laborPaymentDate: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Opções para Previdenciário */}
              {isPrevidenciario && (
                <div className="bg-purple-50/50 p-8 rounded-[2.5rem] border border-purple-100 animate-in fade-in">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-purple-200">
                      <i className="fa-solid fa-hospital-user"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">Modelo Previdenciário (Aposentadorias)</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Êxito + Primeiros Benefícios</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Porcentagem sobre Atrasados (%)</label>
                        <div className="relative">
                          <input type="number" step="1" className={`${inputClass} text-xl pr-12`} value={formData.successFeePercentage} onChange={e => setFormData({ ...formData, successFeePercentage: parseInt(e.target.value) })} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">%</span>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Parcelas Iniciais do Benefício para o Advogado</label>
                        <div className="relative">
                          <input type="number" step="1" className={`${inputClass} text-xl pr-12`} value={formData.benefitInstallmentsCount} onChange={e => setFormData({ ...formData, benefitInstallmentsCount: parseInt(e.target.value) })} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">X</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-2">Número de meses que o advogado receberá o benefício integral após a concessão.</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-purple-100 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-circle-info text-purple-600"></i>
                        <p className="text-sm font-bold text-slate-700">Contrato padrão Previdenciário.</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">Os honorários serão deduzidos diretamente dos primeiros pagamentos ou via precatório/RPV emitido pelo tribunal.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opções para Cível, Criminal e Outros Particular */}
              {!isTrabalhista && !isPrevidenciario && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2">
                      <label className={labelClass}>Forma de Pagamento Principal</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'PIX', icon: 'fa-bolt', label: 'PIX' },
                          { id: 'Cartão', icon: 'fa-credit-card', label: 'Cartão' },
                          { id: 'Dinheiro', icon: 'fa-money-bill-wave', label: 'À Vista' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, method: m.id as PaymentMethod })}
                            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.method === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                          >
                            <i className={`fa-solid ${m.icon} text-lg`}></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Valor Total (R$)</label>
                      <input type="number" step="0.01" className={`${inputClass} text-xl`} value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div>
                      <label className={labelClass}>Valor de Entrada (Sinal)</label>
                      <input type="number" step="0.01" className={inputClass} value={formData.initialPayment} onChange={e => setFormData({ ...formData, initialPayment: parseFloat(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Número de Parcelas</label>
                      <input type="number" className={inputClass} min="1" max="60" value={formData.numInstallments} onChange={e => setFormData({ ...formData, numInstallments: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelClass}>Dia de Vencimento</label>
                      <input type="number" className={inputClass} min="1" max="31" value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Lógica da Defensoria Pública se mantém intacta conforme a primeira solicitação */
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Data da Nomeação (Indicação)</label>
                  <input type="date" className={inputClass} value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Valor Previsto pela Tabela (OAB/Defensoria)</label>
                  <input type="number" step="0.01" className={inputClass} placeholder="Ex: 1.200,00" value={formData.totalAgreed} onChange={e => setFormData({ ...formData, totalAgreed: parseFloat(e.target.value) })} />
                </div>
              </div>

              {isCriminal ? (
                <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-scale-balanced text-indigo-600"></i> Desmembramento da Certidão (70/30)
                    </h4>
                    <label className="flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-xl border shadow-sm">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-indigo-600"
                        checked={formData.hasRecourse}
                        onChange={e => setFormData({ ...formData, hasRecourse: e.target.checked })}
                      />
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Houve Recurso</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                      <label className={labelClass}>Dados da 1ª Guia (70%)</label>
                      <input type="text" placeholder="Nº do Voucher ou Certidão" className={inputClass} value={formData.defensoriaVoucher70} onChange={e => setFormData({ ...formData, defensoriaVoucher70: e.target.value })} />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" step="0.01" placeholder="Valor Real (R$)" className={`${inputClass} text-xs`} value={formData.defensoriaValue70} onChange={e => setFormData({ ...formData, defensoriaValue70: parseFloat(e.target.value) })} />
                        <input type="month" className={`${inputClass} text-xs`} value={formData.defensoriaPaymentMonth70} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth70: e.target.value })} />
                      </div>
                      <select className={inputClass} value={formData.defensoriaStatus70} onChange={e => setFormData({ ...formData, defensoriaStatus70: e.target.value })}>
                        <option value="Aguardando Sentença">Aguardando Sentença</option>
                        <option value="Certidão Emitida">Certidão Emitida</option>
                        <option value="Pago pelo Estado">Pago pelo Estado</option>
                      </select>
                    </div>

                    {formData.hasRecourse ? (
                      <div className="bg-white p-6 rounded-3xl border border-indigo-200 space-y-4 shadow-sm animate-in zoom-in-95">
                        <label className={labelClass}>Dados da 2ª Guia (30%)</label>
                        <input type="text" placeholder="Nº da Certidão de Recurso" className={inputClass} value={formData.defensoriaVoucher30} onChange={e => setFormData({ ...formData, defensoriaVoucher30: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                          <input type="number" step="0.01" placeholder="Valor (R$)" className={`${inputClass} text-xs`} value={formData.defensoriaValue30} onChange={e => setFormData({ ...formData, defensoriaValue30: parseFloat(e.target.value) })} />
                          <input type="month" className={`${inputClass} text-xs`} value={formData.defensoriaPaymentMonth30} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth30: e.target.value })} />
                        </div>
                        <select className={inputClass} value={formData.defensoriaStatus30} onChange={e => setFormData({ ...formData, defensoriaStatus30: e.target.value })}>
                          <option value="Pendente">Pendente de Acórdão</option>
                          <option value="Certidão Emitida">Certidão Emitida</option>
                          <option value="Pago pelo Estado">Pago pelo Estado</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-10 opacity-60">
                        <i className="fa-solid fa-lock text-slate-300 text-3xl mb-3"></i>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Guia de 30% Bloqueada<br />(Apenas para Recursos)</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className={labelClass}>Certidão Integral (100%)</label>
                      <input type="text" placeholder="Nº da Guia / Protocolo" className={inputClass} value={formData.defensoriaVoucher100} onChange={e => setFormData({ ...formData, defensoriaVoucher100: e.target.value })} />
                      <select className={inputClass} value={formData.defensoriaStatus100} onChange={e => setFormData({ ...formData, defensoriaStatus100: e.target.value })}>
                        <option value="Aguardando Sentença">Aguardando Sentença</option>
                        <option value="Certidão Emitida">Certidão Emitida</option>
                        <option value="Pago pelo Estado">Pago pelo Estado</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className={labelClass}>Valor Final Pago (R$)</label>
                      <input type="number" step="0.01" className={inputClass} placeholder="0,00" value={formData.defensoriaValue100} onChange={e => setFormData({ ...formData, defensoriaValue100: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-4">
                      <label className={labelClass}>Mês do Recebimento</label>
                      <input type="month" className={inputClass} value={formData.defensoriaPaymentMonth100} onChange={e => setFormData({ ...formData, defensoriaPaymentMonth100: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-8 pt-10 border-t border-slate-50">
            <button type="button" onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Voltar</button>
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all">
              {existingFinancials ? 'Salvar Alterações Financeiras' : 'Finalizar Cadastro Financeiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialRegistration;
