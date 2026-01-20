
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
}

const ClientList: React.FC<ClientListProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient, settings, currentUserId }) => {
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

  const [formActiveTab, setFormActiveTab] = useState<'pessoal' | 'endereco' | 'processo'>('pessoal');

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

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Clientes</h2>
          <p className="text-slate-500 font-medium font-bold uppercase text-[10px] tracking-widest">Base de Dados Jurídica</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
          <i className="fa-solid fa-plus text-sm"></i>
          Novo Cliente
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex p-1 bg-slate-100 rounded-[1.2rem] w-fit shadow-inner">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou processo..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-white border-b border-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-10 py-6">Cliente</th>
                <th className="px-6 py-6 text-center">Tipo de Ação</th>
                <th className="px-6 py-6 text-right">Valor em Carteira</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group/row">
                  <td className="px-10 py-6">
                    <p className="font-bold text-slate-700 text-base">{client.name}</p>
                    <p className="text-[11px] text-slate-400 uppercase font-black">{client.caseNumber}</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getCaseTypeStyle(client.caseType)}`}>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className="text-lg font-black text-slate-800 tracking-tight">
                      {client.userId === currentUserId
                        ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-5">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            title="Baixar Procuração"
                            className="text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <i className="fa-solid fa-file-signature"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            title="Baixar Declaração de Hipossuficiência"
                            className="text-slate-300 hover:text-amber-600 transition-colors"
                          >
                            <i className="fa-solid fa-hand-holding-dollar"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); }}
                            className="text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-2">
                          <i className="fa-solid fa-lock text-[8px]"></i> Privado
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Página <span className="text-slate-600">{currentPage}</span> de <span className="text-slate-600">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-10 px-4 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 px-4 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {paginatedClients.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="h-20 w-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                <i className="fa-solid fa-users-slash"></i>
              </div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-6 md:p-10 space-y-8 shadow-2xl animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">Cadastro de Cliente LexAI</h3>
              <button onClick={() => setShowFormModal(false)} className="h-10 w-10 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.2rem] overflow-x-auto no-scrollbar">
              {['pessoal', 'endereco', 'processo'].map(step => (
                <button key={step} type="button" onClick={() => setFormActiveTab(step as any)} className={`flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${formActiveTab === step ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                  {step}
                </button>
              ))}
            </div>

            <form onSubmit={handleNextStep} className="space-y-8">
              <div className="min-h-[400px]">
                {formActiveTab === 'pessoal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="col-span-2">
                      <label className={labelClass}>Tipo de Contratação</label>
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
                      <label className={labelClass}>Nome Completo</label>
                      <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
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
                    <div><label className={labelClass}>Profissão</label><input type="text" className={inputClass} value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} /></div>
                    <div><label className={labelClass}>Renda Mensal (R$)</label><input type="number" step="0.01" className={inputClass} value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) })} /></div>
                    <div><label className={labelClass}>CPF / CNPJ</label><input type="text" className={inputClass} value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2"><label className={labelClass}>RG</label><input type="text" className={inputClass} value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} /></div>
                      <div><label className={labelClass}>Org. Emissor</label><input type="text" placeholder="SSP/SP" className={inputClass} value={formData.rgIssuingBody} onChange={e => setFormData({ ...formData, rgIssuingBody: e.target.value })} /></div>
                    </div>
                    <div className="col-span-2"><label className={labelClass}>E-mail (Endereço Eletrônico)</label><input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                  </div>
                )}

                {formActiveTab === 'endereco' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                    <div><label className={labelClass}>CEP</label><input type="text" className={inputClass} value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Logradouro (Domicílio)</label><input type="text" className={inputClass} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                    <div><label className={labelClass}>Número</label><input type="text" className={inputClass} value={formData.addressNumber} onChange={e => setFormData({ ...formData, addressNumber: e.target.value })} /></div>
                    <div><label className={labelClass}>Bairro</label><input type="text" className={inputClass} value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} /></div>
                    <div><label className={labelClass}>Cidade</label><input type="text" className={inputClass} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                  </div>
                )}

                {formActiveTab === 'processo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div><label className={labelClass}>Número do Processo</label><input type="text" className={inputClass} placeholder="0000000-00.0000.0.00.0000" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} /></div>
                    <div>
                      <label className={labelClass}>Área Jurídica</label>
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
                    <div className="col-span-2"><label className={labelClass}>Objeto / Descrição</label><textarea className={`${inputClass} h-32 resize-none`} value={formData.caseDescription} onChange={e => setFormData({ ...formData, caseDescription: e.target.value })} /></div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-8 pt-6 border-t">
                <button type="button" onClick={() => setShowFormModal(false)} className="text-sm font-black text-slate-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                  {formActiveTab === 'processo' ? 'Continuar para Financeiro' : 'Próxima Etapa'}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto"><i className="fa-solid fa-trash"></i></div>
              <h3 className="text-xl font-black text-slate-800">Confirmar Exclusão</h3>
              <p className="text-sm text-slate-500">Deseja realmente remover o cliente <b>{clientToDelete?.name}</b>?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onDeleteClient(clientToDelete!.id); setShowDeleteModal(false); }} className="w-full bg-rose-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all">Excluir Permanente</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
