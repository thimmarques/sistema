import React, { useState, useMemo, useEffect } from 'react';
import { Client, AppSection, UserSettings, ClientOrigin, Lawyer } from '../types';
import { formatCurrency } from '../src/utils/format';
import { generateClientPDF } from '../pdfService';
import FinancialModal from "./FinancialModal.tsx";

interface ClientListProps {
  clients: Client[];
  onAddClient: (client: Partial<Client>) => void;
  onUpdateClient: (client: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  settings?: UserSettings;
  currentUserId: string;
  allLawyers?: Lawyer[];
  onAddLawyer: (clientId: string, lawyerId: string) => void;
  onRemoveLawyer: (clientId: string, lawyerId: string) => void;
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
    address: '', addressNumber: '', neighborhood: '', city: '', state: '', zipCode: '',
    origin: 'Particular' as ClientOrigin,
    caseNumber: '', caseType: 'Cível', caseDescription: '', status: 'Active' as any,
    financials: undefined as any
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
      case 'Cível': return 'border-brand-500 text-brand-500';
      case 'Trabalhista': return 'border-emerald-500 text-emerald-500';
      case 'Tributário': return 'border-cyan-500 text-cyan-500';
      case 'Criminal': return 'border-rose-500 text-rose-500';
      case 'Família': return 'border-amber-500 text-amber-500';
      case 'Previdenciário': return 'border-purple-500 text-purple-500';
      default: return 'border-slate-500 text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2 text-left">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Gestão de Carteira</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Custódia de Clientes</h2>
          <p className="text-sm text-slate-500 font-medium">Controle de registros e processos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 shadow-sm hover:shadow-md flex items-center gap-2 group"
        >
          <i className="fa-solid fa-plus text-sm"></i>
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full xl:w-fit">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-full xl:max-w-md relative group">
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF ou processo..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Natureza</th>
                <th className="px-6 py-4 text-right">Patrimônio</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border ${client.origin === 'Particular' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 text-sm">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium text-slate-500 tracking-wide">{client.caseNumber || 'S/ Processo'}</span>
                          {client.status === 'Active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getCaseTypeStyle(client.caseType).replace('bg-', 'bg-slate-50 border-')}`}>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">
                        {client.userId === currentUserId
                          ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "---"}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Fluxo</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Procuração"
                          >
                            <i className="fa-solid fa-file-signature text-sm"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Declaração"
                          >
                            <i className="fa-solid fa-hand-holding-dollar text-sm"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); onDeleteClient(client.id); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </>
                      ) : (
                        <div className="px-3 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2">
                          <i className="fa-solid fa-eye-slash"></i> Restrito
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFinancialModal && (
        <FinancialModal
          isOpen={showFinancialModal}
          onClose={() => setShowFinancialModal(false)}
          onFinish={handleFinishRegistration}
          clientOrigin={formData.origin}
          initialData={formData.financials}
        />
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl p-8 md:p-12 animate-in zoom-in-95 my-8 relative">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">
                Cadastro de Cliente LexAI
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] transition-all"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="flex bg-[#F1F5F9] p-2 rounded-2xl mb-10">
              {(['pessoal', 'endereco', 'processo'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFormActiveTab(tab)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formActiveTab === tab
                      ? 'bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20'
                      : 'text-[#94A3B8] hover:text-[#64748B]'
                    }`}
                >
                  {tab === 'pessoal' ? 'PESSOAL' : tab === 'endereco' ? 'ENDERECO' : 'PROCESSO'}
                </button>
              ))}
            </div>

            <form onSubmit={handleNextStep} className="space-y-8">
              {formActiveTab === 'pessoal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">TIPO DE CONTRATAÇÃO</label>
                    <div className="relative">
                      <select
                        className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/5 transition-all appearance-none"
                        value={formData.origin}
                        onChange={e => setFormData({ ...formData, origin: e.target.value as any })}
                      >
                        <option value="Particular">Particular / Contratual</option>
                        <option value="Defensoria">Defensoria / Convênio</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"></i>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">NOME COMPLETO</label>
                    <input
                      type="text"
                      required
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/5 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">NACIONALIDADE</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                      value={formData.nationality}
                      onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">ESTADO CIVIL</label>
                    <div className="relative">
                      <select
                        className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all appearance-none"
                        value={formData.maritalStatus}
                        onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                      >
                        <option value="Solteiro(a)">Solteiro(a)</option>
                        <option value="Casado(a)">Casado(a)</option>
                        <option value="Divorciado(a)">Divorciado(a)</option>
                        <option value="Viúvo(a)">Viúvo(a)</option>
                        <option value="União Estável">União Estável</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"></i>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">PROFISSÃO</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">RENDA MENSAL (R$)</label>
                    <input
                      type="number"
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                      value={formData.monthlyIncome}
                      onChange={e => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                      value={formData.cpf_cnpj}
                      onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-5 gap-3">
                    <div className="col-span-3 space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">RG</label>
                      <input
                        type="text"
                        className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                        value={formData.rg}
                        onChange={e => setFormData({ ...formData, rg: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">ORG. EMISSOR</label>
                      <input
                        type="text"
                        placeholder="SSP/SP"
                        className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                        value={formData.rgIssuingBody}
                        onChange={e => setFormData({ ...formData, rgIssuingBody: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">E-MAIL (ENDEREÇO ELETRÔNICO)</label>
                    <input
                      type="email"
                      className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {formActiveTab === 'endereco' && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">CEP</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                  </div>
                  <div className="md:col-span-4 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">LOGRADOURO</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">NÚMERO</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} />
                  </div>
                  <div className="md:col-span-4 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">BAIRRO</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                  </div>
                  <div className="md:col-span-4 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">CIDADE</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">ESTADO</label>
                    <input type="text" className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                </div>
              )}

              {formActiveTab === 'processo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">NÚMERO DO PROCESSO</label>
                    <input type="text" required className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] transition-all" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">TIPO DE AÇÃO</label>
                    <div className="relative">
                      <select className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] cursor-pointer appearance-none" value={formData.caseType} onChange={e => setFormData({ ...formData, caseType: e.target.value as any })}>
                        {['Cível', 'Criminal', 'Trabalhista', 'Família', 'Tributário', 'Previdenciário', 'Outros'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"></i>
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-[#94A3B8] tracking-widest px-1">ORIGEM</label>
                    <div className="relative">
                      <select className="w-full h-14 px-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-semibold text-[#1E293B] outline-none focus:border-[#4F46E5] cursor-pointer appearance-none" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value as any })}>
                        <option value="Particular">Particular</option>
                        <option value="Defensoria">Defensoria</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"></i>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-6 pt-8 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-6 py-4 font-black text-[#94A3B8] hover:text-[#64748B] transition-all text-xs uppercase tracking-widest"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 max-w-lg bg-[#4F46E5] text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#4338CA] transition-all active:scale-[0.98] shadow-xl shadow-[#4F46E5]/30"
                >
                  {formActiveTab === 'processo' ? 'FINALIZAR CADASTRO' : 'PRÓXIMA ETAPA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
