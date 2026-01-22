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
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4 text-left">
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">CONTROLE DE CUSTÓDIA</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase font-serif">Cadastro de Clientes</h2>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocolo de Registro Integrado</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-500 text-black px-12 py-5 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl relative group"
        >
          <span className="group-hover:tracking-[0.5em] transition-all">Novo Cliente</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
        <div className="flex bg-white/5 p-1 border border-white/5 w-full xl:w-fit">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-3 font-black text-[9px] uppercase tracking-[0.3em] transition-all ${activeTab === tab
                ? 'bg-brand-500 text-black shadow-[0_0_20px_rgba(126,138,238,0.2)]'
                : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-full xl:max-w-md relative group">
          <input
            type="text"
            placeholder="PESQUISAR REGISTRO..."
            className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-brand-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5">
              <tr>
                <th className="px-8 py-6">IDENTIFICAÇÃO OPERACIONAL</th>
                <th className="px-8 py-6 text-center">NATUREZA</th>
                <th className="px-8 py-6 text-right">PATRIMÔNIO</th>
                <th className="px-8 py-6 text-right">TERMINAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-white/5 transition-all group/row">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`h-12 w-12 border flex items-center justify-center text-[10px] font-black ${client.origin === 'Particular' ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-emerald-500 text-emerald-500 bg-emerald-500/5'}`}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left space-y-1">
                        <p className="font-black text-white uppercase tracking-widest text-sm group-hover/row:text-brand-500 transition-colors">{client.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.2em]">{client.caseNumber || 'S/ PROC'}</span>
                          {client.status === 'Active' && <div className="h-1 w-1 bg-brand-500"></div>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border ${getCaseTypeStyle(client.caseType).replace('bg-', 'bg-white/5 border-')}`}>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-sm font-black text-white tracking-widest">
                        {client.userId === currentUserId
                          ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "PROTEGIDO"}
                      </span>
                      <span className="text-[8px] font-black text-slate-800 uppercase tracking-[0.3em]">FLUXO CAPITAL</span>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="flex justify-end gap-3">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            className="p-3 border border-white/5 text-slate-800 hover:text-white hover:border-white/20 transition-all"
                            title="Procuração"
                          >
                            <i className="fa-solid fa-file-signature text-xs"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            className="p-3 border border-white/5 text-slate-800 hover:text-white hover:border-white/20 transition-all"
                            title="Declaração"
                          >
                            <i className="fa-solid fa-hand-holding-dollar text-xs"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-3 border border-white/5 text-slate-800 hover:text-white hover:border-white/20 transition-all"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); onDeleteClient(client.id); }}
                            className="p-3 border border-white/5 text-slate-800 hover:text-rose-500 hover:border-rose-500/20 transition-all"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </>
                      ) : (
                        <div className="px-4 py-2 bg-white/5 border border-white/10 text-[8px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-3">
                          <i className="fa-solid fa-eye-slash"></i> PRIVADO
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-500">
          <div className="bg-[#0A0A0B] border border-white/10 w-full max-w-4xl p-16 space-y-12 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-start border-b border-white/5 pb-10">
              <div className="space-y-4 text-left">
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">PROTOCOLO DE DADOS</p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase font-serif">
                  {isEditing ? 'Atualizar Registro' : 'Novo Terminal Cliente'}
                </h3>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-4 border border-white/5 text-slate-800 hover:text-white transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="flex bg-white/5 p-1 border border-white/5">
              {(['pessoal', 'endereco', 'processo'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFormActiveTab(tab)}
                  className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${formActiveTab === tab ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  {tab === 'pessoal' ? 'PESSOAL' : tab === 'endereco' ? 'ENDEREÇO' : 'PROCESSO'}
                </button>
              ))}
            </div>

            <form onSubmit={handleNextStep} className="space-y-10">
              {formActiveTab === 'pessoal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="md:col-span-2 space-y-4 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] ml-1">Entidade / Nome Completo</label>
                    <input type="text" required className="w-full p-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-4 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] ml-1">CPF / CNPJ</label>
                    <input type="text" className="w-full p-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900" value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: e.target.value })} />
                  </div>
                  <div className="space-y-4 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] ml-1">Terminal Telefônico</label>
                    <input type="text" className="w-full p-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
              )}

              {formActiveTab === 'processo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="md:col-span-2 space-y-4 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] ml-1">Identificador Processual</label>
                    <input type="text" required className="w-full p-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} />
                  </div>
                  <div className="space-y-4 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em] ml-1">Modalidade Originária</label>
                    <select className="w-full p-6 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value as any })}>
                      <option value="Particular">PARTICULAR</option>
                      <option value="Defensoria">DEFENSORIA</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 pt-10 border-t border-white/5">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-5 text-[9px] font-black text-slate-700 hover:text-white uppercase tracking-widest transition-all">Abortar</button>
                <button type="submit" className="flex-[2] bg-brand-500 text-black py-5 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl">
                  {formActiveTab === 'processo' ? 'CONSOLIDAR FINANCEIRO' : 'AVANÇAR PROTOCOLO'}
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
