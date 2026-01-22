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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Custódia Jurídica</h2>
          <p className="text-slate-500">Gestão completa de registro de clientes.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Novo Cliente
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between border-b border-slate-200 pb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-fit">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === tab
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-full xl:max-w-md relative group">
          <input
            type="text"
            placeholder="Pesquisar registro..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 shadow-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Entidade / Identificação</th>
                <th className="px-6 py-4 text-center">Natureza</th>
                <th className="px-6 py-4 text-right">Patrimônio / Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-all group/row">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-bold ${client.origin === 'Particular' ? 'bg-brand-50 border-brand-100 text-brand-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 group-hover/row:text-brand-600 transition-colors">{client.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{client.caseNumber || 'S/ Proc'}</span>
                          {client.status === 'Active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCaseTypeStyle(client.caseType)}`}>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-900">
                        {client.userId === currentUserId
                          ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "PROTEGIDO"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Honorários</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            title="Procuração"
                          >
                            <i className="fa-solid fa-file-signature"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Declaração"
                          >
                            <i className="fa-solid fa-hand-holding-dollar"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); onDeleteClient(client.id); }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      ) : (
                        <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider rounded-lg flex items-center gap-2">
                          <i className="fa-solid fa-eye-slash"></i> Privado
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
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 md:p-10 space-y-8 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {isEditing ? 'Editar Registro' : 'Novo Cliente'}
                </h3>
                <p className="text-xs text-slate-500">Gestão de custódia e dados processuais.</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['pessoal', 'endereco', 'processo'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFormActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${formActiveTab === tab ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {tab === 'pessoal' ? 'PESSOAL' : tab === 'endereco' ? 'ENDEREÇO' : 'PROCESSO'}
                </button>
              ))}
            </div>

            <form onSubmit={handleNextStep} className="space-y-6">
              {formActiveTab === 'pessoal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nome Completo</label>
                    <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">CPF / CNPJ</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Telefone</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail</label>
                    <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Data de Nascimento</label>
                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                  </div>
                </div>
              )}

              {formActiveTab === 'endereco' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Endereço</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Bairro</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Cidade</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                </div>
              )}

              {formActiveTab === 'processo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Número do Processo</label>
                    <input type="text" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Modalidade</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value as any })}>
                      <option value="Particular">Particular</option>
                      <option value="Defensoria">Defensoria</option>
                    </select>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Natureza</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 outline-none text-sm" value={formData.caseType} onChange={e => setFormData({ ...formData, caseType: e.target.value })}>
                      <option value="Cível">Cível</option>
                      <option value="Trabalhista">Trabalhista</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Família">Família</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">
                  {formActiveTab === 'processo' ? 'Financeiro' : 'Próximo'}
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
