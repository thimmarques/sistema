
import React, { useState, useMemo, useEffect } from 'react';
import { Client, ClientOrigin, UserSettings } from '../types';
import { generateClientPDF } from '../pdfService';
import FinancialRegistration from './FinancialRegistration';

interface ClientListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  settings?: UserSettings;
  currentUserId?: string;
  allLawyers?: UserSettings[];
  onAddLawyer?: (clientId: string, lawyerId: string) => void;
  onRemoveLawyer?: (clientId: string, lawyerId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  settings,
  currentUserId,
  allLawyers = [],
  onAddLawyer,
  onRemoveLawyer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Geral' | 'Particular' | 'Defensoria'>('Geral');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [originFilter, setOriginFilter] = useState<ClientOrigin>('Particular');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [formActiveTab, setFormActiveTab] = useState<'pessoal' | 'endereco' | 'processo' | 'advogados'>('pessoal');

  const initialFormData = {
    name: '', email: '', phone: '', cpf_cnpj: '', rg: '', rgIssuingBody: '',
    nationality: 'Brasileiro(a)', birthDate: '', maritalStatus: 'Solteiro(a)', profession: '',
    monthlyIncome: 0,
    address: '', addressNumber: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '',
    origin: 'Particular' as ClientOrigin,
    caseNumber: '', caseType: 'Cível', caseDescription: '', status: 'Active' as any,
  };

  const [formData, setFormData] = useState(initialFormData);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const name = client.name || '';
      const cpf = client.cpf_cnpj || '';
      const caseNum = client.caseNumber || '';

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cpf.includes(searchTerm) ||
        caseNum.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'Geral' || client.origin === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [clients, searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedClientId(null);
    setFormActiveTab('pessoal');
    setFormData({ ...initialFormData, origin: originFilter });
    setShowFormModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setIsEditing(true);
    setSelectedClientId(client.id);
    setFormActiveTab('pessoal');
    setFormData({ ...client } as any);
    setShowFormModal(true);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (formActiveTab === 'pessoal') setFormActiveTab('endereco');
    else if (formActiveTab === 'endereco') setFormActiveTab('processo');
    else {
      setShowFormModal(false);
      setShowFinancialModal(true);
    }
  };

  const handleFinishRegistration = (financials: any) => {
    const finalData = { ...formData, financials };
    if (isEditing && selectedClientId) {
      onUpdateClient({ ...finalData, id: selectedClientId } as any);
    } else {
      onAddClient(finalData as any);
    }
    setShowFinancialModal(false);
  };

  const getCaseTypeStyle = (type: string) => {
    switch (type) {
      case 'Cível': return 'bg-indigo-50 text-indigo-500';
      case 'Trabalhista': return 'bg-emerald-50 text-emerald-500';
      case 'Tributário': return 'bg-cyan-50 text-cyan-500';
      case 'Criminal': return 'bg-rose-50 text-rose-500';
      case 'Família': return 'bg-amber-50 text-amber-500';
      case 'Previdenciário': return 'bg-purple-50 text-purple-500';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const inputClass = "w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-sm font-bold text-slate-700 shadow-sm";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Crm Jurídico</span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Clientes</h2>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-plus-circle text-base"></i>
          Novo Cliente
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-center">
        <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-[1.5rem] w-full xl:w-fit shadow-inner border border-white/40">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 xl:flex-none px-10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab
                ? 'bg-white text-brand-600 shadow-lg'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-full relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-slate-300 group-focus-within:text-brand-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou processo..."
            className="w-full pl-14 pr-8 py-5 bg-white rounded-3xl border border-slate-100 focus:border-brand-500 outline-none transition-all text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-premium border border-white/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-10 py-8">Identificação do Cliente</th>
                <th className="px-6 py-8 text-center">Tipo de Ação</th>
                <th className="px-6 py-8 text-right">Faturamento Previso</th>
                <th className="px-10 py-8 text-right">Gerenciamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/70 transition-all group/row">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black ${client.origin === 'Particular' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-base leading-tight mb-1 group-hover/row:text-brand-600 transition-colors">{client.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-md">{client.caseNumber || 'Sem Processo'}</span>
                          {client.status === 'Active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-7 text-center">
                    <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] shadow-sm border ${getCaseTypeStyle(client.caseType)}`}>
                      <i className="fa-solid fa-tag mr-2 opacity-50"></i>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-6 py-7 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-slate-800 tracking-tighter">
                        {client.userId === currentUserId
                          ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valores Contratuáis</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-3">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            title="Baixar Procuração"
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-brand-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                          >
                            <i className="fa-solid fa-file-signature text-sm"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            title="Baixar Declaração"
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                          >
                            <i className="fa-solid fa-hand-holding-dollar text-sm"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                          >
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                          >
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </>
                      ) : (
                        <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-2 border border-slate-100">
                          <i className="fa-solid fa-lock text-[9px]"></i> Portfólio Privado
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Página <span className="text-brand-600 underline decoration-brand-500/30 underline-offset-4">{currentPage}</span> de <span className="text-brand-600">{totalPages}</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-11 px-6 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:shadow-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <i className="fa-solid fa-arrow-left-long mr-2"></i>
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-11 px-6 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-brand-600 hover:border-brand-200 hover:shadow-lg disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Próxima
                  <i className="fa-solid fa-arrow-right-long ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {paginatedClients.length === 0 && (
            <div className="py-24 text-center space-y-6">
              <div className="h-24 w-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-4 border border-slate-100 shadow-inner">
                <i className="fa-solid fa-users-slash"></i>
              </div>
              <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.3em]">Nenhum cliente na base de dados</p>
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-8 md:p-12 space-y-10 shadow-premium animate-in zoom-in-95 duration-500 my-auto border border-white/40">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Cadastro Inteligente</span>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                  {isEditing ? 'Editar Registro' : 'Novo Cliente Jurídico'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="h-12 w-12 bg-slate-100 rounded-full text-slate-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all duration-300 active:scale-90"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="flex gap-3 p-1.5 bg-slate-100/50 rounded-[1.8rem] overflow-x-auto no-scrollbar shadow-inner border border-slate-100">
              {[
                { id: 'pessoal', label: 'Pessoal', icon: 'fa-user-tie' },
                { id: 'endereco', label: 'Localidade', icon: 'fa-map-location-dot' },
                { id: 'processo', label: 'Processual', icon: 'fa-briefcase' },
                { id: 'advogados', label: 'Advogados', icon: 'fa-user-group' }
              ].map(step => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setFormActiveTab(step.id as any)}
                  className={`flex-1 py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center justify-center gap-3 ${formActiveTab === step.id ? 'bg-brand-600 text-white shadow-xl shadow-brand-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                  disabled={step.id === 'advogados' && !isEditing}
                >
                  <i className={`fa-solid ${step.icon}`}></i>
                  {step.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleNextStep} className="space-y-10">
              <div className="min-h-[420px]">
                {formActiveTab === 'pessoal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-2">
                      <label className={labelClass}>Origem da Demanda</label>
                      <select
                        className={inputClass}
                        value={formData.origin}
                        onChange={e => {
                          const newOrigin = e.target.value as ClientOrigin;
                          setFormData(prev => ({
                            ...prev,
                            origin: newOrigin,
                            caseType: newOrigin === 'Defensoria' && !['Cível', 'Criminal'].includes(prev.caseType)
                              ? 'Cível'
                              : prev.caseType
                          }));
                        }}
                      >
                        <option value="Particular">Particular / Contratual</option>
                        <option value="Defensoria">Convênio Defensoria Pública (OAB)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Nome Completo do Assistido</label>
                      <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: João da Silva Santos" />
                    </div>
                    <div><label className={labelClass}>Nacionalidade</label><input type="text" className={inputClass} value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} /></div>
                    <div>
                      <label className={labelClass}>Estado Civil</label>
                      <select className={inputClass} value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                        <option value="União Estável">União Estável</option>
                      </select>
                    </div>
                    <div><label className={labelClass}>Profissão Atual</label><input type="text" className={inputClass} value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} /></div>
                    <div><label className={labelClass}>Rendimento Mensal</label><input type="number" step="0.01" className={inputClass} value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) })} /></div>
                    <div><label className={labelClass}>Documento (CPF / CNPJ)</label><input type="text" className={inputClass} value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })} /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2"><label className={labelClass}>RG / Identidade</label><input type="text" className={inputClass} value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} /></div>
                      <div><label className={labelClass}>Órgão</label><input type="text" placeholder="SSP/SP" className={inputClass} value={formData.rgIssuingBody} onChange={e => setFormData({ ...formData, rgIssuingBody: e.target.value })} /></div>
                    </div>
                    <div className="col-span-2"><label className={labelClass}>E-mail de Contato</label><input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="cliente@email.com" /></div>
                  </div>
                )}

                {formActiveTab === 'endereco' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-1"><label className={labelClass}>CEP</label><input type="text" className={inputClass} value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} placeholder="00000-000" /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Endereço Completo</label><input type="text" className={inputClass} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                    <div><label className={labelClass}>Número</label><input type="text" className={inputClass} value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} /></div>
                    <div><label className={labelClass}>Bairro</label><input type="text" className={inputClass} value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} /></div>
                    <div><label className={labelClass}>Cidade / Município</label><input type="text" className={inputClass} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                  </div>
                )}

                {formActiveTab === 'processo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-2">
                      <label className={labelClass}>Número do Processo (CNJ)</label>
                      <input type="text" className={inputClass} placeholder="0000000-00.0000.0.00.0000" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Natureza da Ação</label>
                      <select className={inputClass} value={formData.caseType} onChange={e => setFormData({ ...formData, caseType: e.target.value })}>
                        <option value="Cível">Cível</option>
                        <option value="Criminal">Criminal</option>
                        {formData.origin === 'Particular' && (
                          <>
                            <option value="Trabalhista">Trabalhista</option>
                            <option value="Família">Família</option>
                            <option value="Tributário">Tributário</option>
                            <option value="Previdenciário">Previdenciário</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Status do Processo</label>
                      <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                        <option value="Active">Ativo / Em curso</option>
                        <option value="Pending">Pendente</option>
                        <option value="Closed">Arquivado / Finalizado</option>
                      </select>
                    </div>
                    <div className="col-span-2"><label className={labelClass}>Breve Relato do Caso</label><textarea className={`${inputClass} h-40 resize-none`} value={formData.caseDescription} onChange={e => setFormData({ ...formData, caseDescription: e.target.value })} placeholder="Detalhe os principais pontos da demanda..." /></div>
                  </div>
                )}

                {formActiveTab === 'advogados' && isEditing && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-6">Equipe Vinculada</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-100 shadow-sm ring-4 ring-brand-500/5">
                          <div className="h-12 w-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase shadow-lg shadow-brand-500/20">
                            {settings?.name?.substring(0, 2) || settings?.email?.substring(0, 2) || 'AD'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-slate-800 leading-tight">{settings?.name} (Você)</p>
                            <p className="text-[10px] text-brand-500 uppercase font-black tracking-tighter">Responsável Primário</p>
                          </div>
                        </div>

                        {clients.find(c => c.id === selectedClientId)?.lawyers?.map((lawyer: any) => (
                          <div key={lawyer.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 group">
                            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                              {lawyer.name?.substring(0, 2) || lawyer.email?.substring(0, 2) || 'AD'}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800 leading-tight">{lawyer.name || lawyer.email}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Co-Patronos</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveLawyer?.(selectedClientId!, lawyer.id)}
                              className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 active:scale-90"
                            >
                              <i className="fa-solid fa-user-minus"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className={labelClass}>Delegar para Outros Advogados</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                        {allLawyers
                          .filter(l => (l as any).id !== currentUserId && !clients.find(c => c.id === selectedClientId)?.lawyers?.some((al: any) => al.id === (l as any).id))
                          .map(lawyer => (
                            <button
                              key={(lawyer as any).id}
                              type="button"
                              onClick={() => onAddLawyer?.(selectedClientId!, (lawyer as any).id)}
                              className="flex items-center gap-4 p-4 bg-white hover:bg-brand-50 rounded-2xl border border-slate-100 hover:border-brand-200 transition-all text-left shadow-sm group"
                            >
                              <div className="h-10 w-10 bg-slate-50 group-hover:bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 text-[10px] font-black uppercase transition-colors">
                                {lawyer.name?.substring(0, 2) || lawyer.email?.substring(0, 2)}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-black text-slate-700 group-hover:text-brand-700">{lawyer.name || lawyer.email}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-black">{lawyer.oab ? `OAB ${lawyer.oab}` : 'Advogado Colaborador'}</p>
                              </div>
                              <i className="fa-solid fa-user-plus text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all"></i>
                            </button>
                          ))
                        }
                        {allLawyers.filter(l => (l as any).id !== currentUserId).length === 0 && (
                          <div className="col-span-2 py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                            <i className="fa-solid fa-user-lock text-slate-100 text-3xl mb-2"></i>
                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nenhum colega disponível para delegação</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-8 pt-10 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-6 py-4 text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 text-white py-5 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {formActiveTab === 'advogados' ? 'Finalizar Registro' : formActiveTab === 'processo' ? 'Continuar para Financeiro' : 'Próxima Etapa'}
                  <i className="fa-solid fa-arrow-right-long opacity-50"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinancialModal && (
        <FinancialRegistration
          origin={formData.origin}
          caseType={formData.caseType}
          clientName={formData.name}
          onBack={() => { setShowFinancialModal(false); setShowFormModal(true); }}
          onFinish={handleFinishRegistration}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-premium border border-white/40 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-6">
              <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto shadow-sm border border-rose-100 animate-bounce-subtle">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Zona de Risco</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Deseja realmente remover o cliente <span className="text-rose-600 font-black underline decoration-rose-500/20">{clientToDelete?.name}</span>? Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <button
                onClick={() => { onDeleteClient(clientToDelete!.id); setShowDeleteModal(false); }}
                className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 shadow-xl shadow-rose-500/10 transition-all active:scale-95"
              >
                Confirmar Exclusão
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-800 tracking-widest transition-all"
              >
                Manter Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
