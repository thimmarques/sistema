import React, { useState, useEffect, useRef, useMemo } from 'react';
import { analyzeCourtEmail, generateLegalDraft } from '../geminiService';
import { CourtMovement, GmailEmail } from '../types';

interface GmailAnalysisProps {
  onMovementDetected: (movement: CourtMovement) => void;
  monitoredSenders: string[];
  onAddMonitoredSender: (email: string) => void;
}

const GmailAnalysis: React.FC<GmailAnalysisProps> = ({ onMovementDetected, monitoredSenders, onAddMonitoredSender }) => {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [draftResponse, setDraftResponse] = useState<string | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEmails = useMemo(() => {
    if (monitoredSenders.length === 0) return emails;
    return emails.filter(email => monitoredSenders.includes(email.from));
  }, [emails, monitoredSenders]);

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = () => {
    setIsFetching(true);
    setTimeout(() => {
      const mockEmails: GmailEmail[] = [
        { id: '1', threadId: 't1', from: 'publicacao@tjsp.jus.br', subject: 'INTIMAÇÃO ELETRÔNICA - PROCESSO 0001234-56.2023.8.26.0001', snippet: 'FICA V. SA. INTIMADO...', body: 'Prezado Dr. Alexandre Lima, \n\nNo processo 0001234-56.2023.8.26.0001, foi publicado despacho determinando o prazo de 15 dias para manifestação sobre o laudo do perito. Data limite: 25/05/2024.', date: new Date().toISOString(), hasAttachments: true, status: 'new' },
        { id: '2', threadId: 't2', from: 'pje-notifica@trf3.jus.br', subject: 'CITAÇÃO - PROCESSO 0005678-12.2023.8.26.0001', snippet: 'MANDADO EXPEDIDO...', body: 'O Tribunal Regional Federal da 3ª Região comunica a citação da parte ré para contestação em 30 dias úteis.', date: new Date(Date.now() - 86400000).toISOString(), hasAttachments: false, status: 'new' }
      ];
      setEmails(mockEmails);
      setIsFetching(false);
    }, 800);
  };

  const handleQuickAddSender = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSenderEmail.trim()) {
      onAddMonitoredSender(newSenderEmail.trim());
      setNewSenderEmail('');
      setShowAddSource(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);
        if (selectedEmail) triggerAnalysis(selectedEmail, base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectEmail = async (email: GmailEmail) => {
    setSelectedEmail(email);
    setAttachmentFile(null);
    setFileBase64(null);
    triggerAnalysis(email);
  };

  const triggerAnalysis = async (email: GmailEmail, b64?: string, mime?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setDraftResponse(null);
    try {
      const fileData = b64 ? { data: b64, mimeType: mime || 'application/pdf' } : undefined;
      const result = await analyzeCourtEmail(email.body, email.from, fileData);
      setAnalysisResult(result);
    } catch (error) { console.error(error); } finally { setIsAnalyzing(false); }
  };

  const handleGenerateDraft = async () => {
    if (!analysisResult) return;
    setIsDrafting(true);
    try {
      const draft = await generateLegalDraft(analysisResult);
      setDraftResponse(draft);
    } catch (error) { alert("ERRO DE MINUTA."); } finally { setIsDrafting(false); }
  };

  const handleAction = (action: 'sync' | 'calendar' | 'task' | 'discard') => {
    if (action === 'discard') {
      setSelectedEmail(null);
      setAnalysisResult(null);
      setDraftResponse(null);
      setAttachmentFile(null);
      return;
    }
    if (!analysisResult || !selectedEmail) return;
    const movement: CourtMovement = {
      id: Math.random().toString(36).substr(2, 9),
      caseNumber: analysisResult.caseNumber,
      date: analysisResult.date,
      description: analysisResult.description,
      type: (analysisResult.movementType || '').includes('Audiência') ? 'Audiência' : 'Deadline',
      source: `Gmail: ${selectedEmail.from}`
    };
    if (action === 'sync' || action === 'calendar') onMovementDetected(movement);
    if (action === 'task') alert(`Tarefa salva.`);
    if (action === 'sync') {
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, status: 'processed' } : e));
      setSelectedEmail(null);
      setAnalysisResult(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-180px)] border border-white/5 animate-in fade-in duration-1000">
      {/* Inbox Column */}
      <div className="w-full lg:w-1/3 bg-[#0A0A0B] border-r border-white/5 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">Monitoramento Core</h3>
            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{monitoredSenders.length} FONTES ATIVAS</p>
          </div>
          <button onClick={fetchEmails} className={`text-slate-600 hover:text-white ${isFetching ? 'animate-spin' : ''}`}>
            <i className="fa-solid fa-rotate-right text-xs"></i>
          </button>
        </div>

        {showAddSource && (
          <div className="p-6 bg-brand-500 border-b border-brand-600">
            <form onSubmit={handleQuickAddSender} className="flex gap-4">
              <input autoFocus type="email" placeholder="E-MAIL INSTITUCIONAL..." className="flex-1 bg-black/10 border border-black/10 p-3 text-[10px] font-black text-black placeholder:text-black/40 outline-none" value={newSenderEmail} onChange={(e) => setNewSenderEmail(e.target.value)} />
              <button type="submit" className="bg-black text-brand-500 px-6 py-3 text-[9px] font-black uppercase hover:bg-slate-900 transition-all">OK</button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {filteredEmails.map((email) => (
            <div key={email.id} onClick={() => handleSelectEmail(email)} className={`p-8 cursor-pointer transition-all hover:bg-white/[0.01] relative ${selectedEmail?.id === email.id ? 'bg-white/[0.02] border-l-4 border-brand-500' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest truncate max-w-[150px]">{email.from}</span>
                <span className="text-[8px] font-black text-slate-800 uppercase">{new Date(email.date).toLocaleDateString()}</span>
              </div>
              <h4 className={`text-[11px] font-serif italic text-white leading-tight uppercase ${email.status === 'processed' ? 'opacity-30' : ''}`}>{email.subject}</h4>
            </div>
          ))}
          <button onClick={() => setShowAddSource(!showAddSource)} className="w-full p-8 text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] hover:text-brand-500 transition-all border-t border-white/5">
            <i className="fa-solid fa-plus mr-3"></i> ADICIONAR NOVA FONTE
          </button>
        </div>
      </div>

      {/* Analysis Column */}
      <div className="flex-1 bg-[#0A0A0B] overflow-hidden flex flex-col">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            <div className="p-12 border-b border-white/5 bg-white/[0.01]">
              <div className="flex justify-between items-start gap-10">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase font-serif leading-tight">{selectedEmail.subject}</h2>
                <button onClick={() => handleAction('discard')} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center"><i className="fa-solid fa-xmark text-xs"></i></button>
              </div>
              <div className="mt-8 flex gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white/5 border border-white/5 text-[9px] font-black text-slate-400 tracking-widest hover:text-white hover:border-brand-500 transition-all">
                  ANALISAR ANEXO (PDF)
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div className="flex-1 p-12 overflow-y-auto space-y-12 custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-800 animate-pulse">
                  <i className="fa-solid fa-terminal text-4xl mb-6"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">DECODIFICANDO DADOS JURÍDICOS...</p>
                </div>
              ) : analysisResult && (
                <div className="space-y-12 animate-in slide-in-from-right-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 border border-white/5">
                    <div className="p-10 bg-white/[0.02]">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-3">Protocolo Processual</p>
                      <p className="text-xl font-black text-white italic tracking-tighter">{analysisResult.caseNumber}</p>
                    </div>
                    <div className="p-10 bg-white/[0.02]">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-3">Data Identificada</p>
                      <p className="text-xl font-black text-white italic tracking-tighter">{analysisResult.date}</p>
                    </div>
                    <div className="p-10 bg-white/[0.02] md:col-span-2">
                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-3">Síntese da Movimentação</p>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-loose">{analysisResult.description}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-8 border border-white/5">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Minuta Estratégica</h4>
                      <button onClick={handleGenerateDraft} className="px-8 py-3 bg-brand-500 text-black text-[9px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all">
                        {isDrafting ? 'GERANDO...' : 'REQUISITAR MINUTA AI'}
                      </button>
                    </div>
                    {draftResponse && (
                      <div className="p-10 border border-white/5 text-[11px] font-black text-slate-500 leading-relaxed uppercase tracking-widest italic bg-white/[0.01]">
                        {draftResponse}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 border-t border-white/5 pt-12">
                    {[
                      { id: 'sync', label: 'CONSOLIDAR', icon: 'fa-check-double', color: 'bg-emerald-500' },
                      { id: 'calendar', label: 'AGENDA', icon: 'fa-calendar-plus', color: 'bg-white/5' },
                      { id: 'task', label: 'TAREFA', icon: 'fa-thumbtack', color: 'bg-white/5' },
                      { id: 'discard', label: 'DESCARTAR', icon: 'fa-trash-can', color: 'bg-white/5' }
                    ].map(act => (
                      <button key={act.id} onClick={() => handleAction(act.id as any)} className={`flex flex-col items-center justify-center gap-4 p-8 transition-all ${act.color === 'bg-emerald-500' ? 'bg-emerald-500 text-black hover:bg-emerald-600' : 'bg-white/5 text-slate-600 hover:text-white'}`}>
                        <i className={`fa-solid ${act.icon} text-lg`}></i>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-24 text-center space-y-10 group">
            <div className="h-24 w-24 border border-white/5 flex items-center justify-center group-hover:border-brand-500 transition-all duration-700">
              <i className="fa-solid fa-envelope-open-text text-4xl text-slate-900 group-hover:text-brand-500 translate-y-1 group-hover:translate-y-0 transition-all"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase font-serif">Inbox Inteligente</h3>
              <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] mt-3">Aguardando Protocolo de Análise</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailAnalysis;
