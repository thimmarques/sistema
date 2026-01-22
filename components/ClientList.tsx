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
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2 text-left">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Custódia Jurídica</span>
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Portfólio de Clientes</h2>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-500 text-black px-10 py-5 rounded-none font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          Novo Registro
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-0 items-center justify-between border-b border-white/5 pb-8">
        <div className="flex bg-white/5 p-1 rounded-none w-full xl:w-fit border border-white/5">
          {(['Geral', 'Particular', 'Defensoria'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-4 font-black text-[9px] uppercase tracking-[0.2em] transition-all ${activeTab === tab
                ? 'bg-brand-500 text-black'
                : 'text-slate-600 hover:text-slate-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="w-full xl:max-w-xl relative group mt-8 xl:mt-0">
          <input
            type="text"
            placeholder="PESQUISAR REGISTRO..."
            className="w-full pl-6 pr-12 py-5 bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white shadow-sm focus:border-brand-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-500 transition-colors">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0B] overflow-hidden border border-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead className="bg-white/5 text-[9px] uppercase font-black text-slate-600 tracking-[0.3em]">
              <tr>
                <th className="px-10 py-6">Entidade / Identificação</th>
                <th className="px-6 py-6 text-center">Natureza</th>
                <th className="px-6 py-6 text-right">Patrimônio / Valor</th>
                <th className="px-10 py-6 text-right">Ações de Comando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-all group/row">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`h-10 w-10 border flex items-center justify-center text-[10px] font-black italic ${client.origin === 'Particular' ? 'border-brand-500 text-brand-500' : 'border-emerald-500 text-emerald-500'}`}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="font-black text-white text-base tracking-tight group-hover/row:text-brand-500 transition-colors uppercase italic">{client.name}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{client.caseNumber || 'S/ PROC'}</span>
                          {client.status === 'Active' && <div className="h-1 w-1 bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]"></div>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-center text-[10px]">
                    <span className={`px-4 py-1.5 border font-black uppercase tracking-widest ${getCaseTypeStyle(client.caseType)}`}>
                      {client.caseType}
                    </span>
                  </td>
                  <td className="px-6 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-black text-white tracking-tighter italic">
                        {client.userId === currentUserId
                          ? `R$ ${(client.financials?.totalAgreed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : "PROTEGIDO"}
                      </span>
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">Fluxo Contratual</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-1">
                      {client.origin === 'Particular' && client.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => generateClientPDF('procuration', client, settings!)}
                            className="h-10 w-10 bg-white/5 text-slate-600 hover:text-brand-500 transition-all active:scale-90 flex items-center justify-center"
                          >
                            <i className="fa-solid fa-file-signature text-[10px]"></i>
                          </button>
                          <button
                            onClick={() => generateClientPDF('declaration', client, settings!)}
                            className="h-10 w-10 bg-white/5 text-slate-600 hover:text-emerald-500 transition-all active:scale-90 flex items-center justify-center"
                          >
                            <i className="fa-solid fa-hand-holding-dollar text-[10px]"></i>
                          </button>
                        </>
                      )}
                      {client.userId === currentUserId ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="h-10 w-10 bg-white/5 text-slate-600 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                          >
                            <i className="fa-solid fa-terminal text-[10px]"></i>
                          </button>
                          <button
                            onClick={() => { setClientToDelete(client); setShowDeleteModal(true); onDeleteClient(client.id); }}
                            className="h-10 w-10 bg-white/5 text-slate-600 hover:text-rose-500 transition-all active:scale-90 flex items-center justify-center"
                          >
                            <i className="fa-solid fa-trash-can text-[10px]"></i>
                          </button>
                        </>
                      ) : (
                        <div className="px-4 py-2 bg-white/5 text-[8px] font-black uppercase text-slate-800 tracking-[0.2em] flex items-center gap-3">
                          <i className="fa-solid fa-eye-slash text-[8px]"></i> Privado
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
    </div>
  );
};

export default ClientList;
