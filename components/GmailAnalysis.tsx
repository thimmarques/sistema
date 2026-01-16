
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
  
  // Quick add source state
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSenderEmail, setNewSenderEmail] = useState('');

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtragem inteligente baseada na white-list definida pelo usuário
  const filteredEmails = useMemo(() => {
    if (monitoredSenders.length === 0) return emails;
    return emails.filter(email => monitoredSenders.includes(email.from));
  }, [emails, monitoredSenders]);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = () => {
    setIsFetching(true);
    setTimeout(() => {
      const mockEmails: GmailEmail[] = [
        {
          id: '1',
          threadId: 't1',
          from: 'publicacao@tjsp.jus.br',
          subject: 'Intimação Eletrônica - Processo 0001234-56.2023.8.26.0001',
          snippet: 'Fica V. Sa. intimado para manifestação sobre o laudo pericial...',
          body: 'Prezado Dr. Alexandre Lima, \n\nNo processo 0001234-56.2023.8.26.0001, foi publicado despacho determinando o prazo de 15 dias para manifestação sobre o laudo do perito. Data limite: 25/05/2024.',
          date: new Date().toISOString(),
          hasAttachments: true,
          status: 'new'
        },
        {
          id: '2',
          threadId: 't2',
          from: 'pje-notifica@trf3.jus.br',
          subject: 'Citação - Processo 0005678-12.2023.8.26.0001',
          snippet: 'Mandado de citação e intimação expedido...',
          body: 'O Tribunal Regional Federal da 3ª Região comunica a citação da parte ré para contestação em 30 dias úteis.',
          date: new Date(Date.now() - 86400000).toISOString(),
          hasAttachments: false,
          status: 'new'
        },
        {
          id: '3',
          threadId: 't3',
          from: 'spam@unsolicited.com',
          subject: 'Oferta de Software Jurídico',
          snippet: 'Compre agora o melhor software...',
          body: 'Promoção imperdível...',
          date: new Date(Date.now() - 200000).toISOString(),
          hasAttachments: false,
          status: 'new'
        }
      ];
      setEmails(mockEmails);
      setIsFetching(false);
    }, 800);
  };

  const handleQuickAddSender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderEmail.trim()) return;
    onAddMonitoredSender(newSenderEmail.trim());
    setNewSenderEmail('');
    setShowAddSource(false);
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
    } catch (error) {
      console.error("Erro na análise:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!analysisResult) return;
    setIsDrafting(true);
    try {
      const draft = await generateLegalDraft(analysisResult);
      setDraftResponse(draft);
    } catch (error) {
      alert("Erro ao gerar minuta.");
    } finally {
      setIsDrafting(false);
    }
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
      type: (analysisResult.movementType || '').includes('Audiência') ? 'Hearing' : 'Deadline',
      source: `Gmail: ${selectedEmail.from}`
    };

    if (action === 'sync' || action === 'calendar') {
      onMovementDetected(movement);
    }

    if (action === 'task') {
      alert(`Tarefa salva para o processo ${movement.caseNumber}: ${movement.description}`);
    }

    if (action === 'sync') {
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? {...e, status: 'processed'} : e));
      setSelectedEmail(null);
      setAnalysisResult(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
      {/* Coluna da Esquerda: Inbox Filtrada */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <i className="fa-brands fa-google text-red-500"></i>
              <h3 className="font-bold text-slate-800 text-sm">Monitor de Tribunais</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-slate-400 font-medium">
                {monitoredSenders.length} fontes ativas
              </p>
              <button 
                onClick={() => setShowAddSource(!showAddSource)}
                className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
              >
                <i className="fa-solid fa-circle-plus"></i>
                Adicionar Fonte
              </button>
            </div>
          </div>
          <button onClick={fetchEmails} className={`text-slate-400 hover:text-indigo-600 ${isFetching ? 'animate-spin' : ''}`}>
            <i className="fa-solid fa-rotate-right text-xs"></i>
          </button>
        </div>

        {/* Quick Add Form Overlay */}
        {showAddSource && (
          <div className="p-3 bg-indigo-600 border-b border-indigo-700 animate-in slide-in-from-top duration-200 shadow-inner">
            <form onSubmit={handleQuickAddSender} className="flex gap-2">
              <input 
                autoFocus
                type="email" 
                placeholder="E-mail do tribunal..." 
                className="flex-1 text-[11px] text-white placeholder-white/60 bg-indigo-500/50 px-2 py-1.5 rounded-lg border border-indigo-400 outline-none focus:ring-2 focus:ring-white/20 transition-all"
                value={newSenderEmail}
                onChange={(e) => setNewSenderEmail(e.target.value)}
              />
              <button type="submit" className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-indigo-50 transition-colors shadow-sm">
                Ok
              </button>
              <button type="button" onClick={() => setShowAddSource(false)} className="text-indigo-100 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {isFetching ? (
            <div className="p-10 text-center text-slate-400 text-xs">Buscando e-mails...</div>
          ) : filteredEmails.length > 0 ? filteredEmails.map((email) => (
            <div 
              key={email.id} 
              onClick={() => handleSelectEmail(email)}
              className={`p-4 cursor-pointer transition-all hover:bg-slate-50 relative ${
                selectedEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[150px]">{email.from}</span>
                <span className="text-[10px] text-slate-400">{new Date(email.date).toLocaleDateString()}</span>
              </div>
              <h4 className={`text-xs font-bold truncate ${email.status === 'new' ? 'text-slate-800' : 'text-slate-400'}`}>{email.subject}</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                  <i className="fa-solid fa-shield-halved text-[8px]"></i> Verificado
                </span>
                {email.status === 'processed' && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">Sincronizado</span>
                )}
              </div>
            </div>
          )) : (
            <div className="p-10 text-center">
              <i className="fa-solid fa-filter-circle-xmark text-slate-200 text-4xl mb-3"></i>
              <p className="text-xs text-slate-400 px-4">Nenhum e-mail das fontes monitoradas encontrado.</p>
              <button 
                onClick={() => setShowAddSource(true)}
                className="text-[10px] text-indigo-600 font-bold mt-4 hover:underline"
              >
                Configurar primeira fonte agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coluna da Direita: Detalhes e Ações */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b bg-slate-50/30">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold text-slate-800">{selectedEmail.subject}</h2>
                <button onClick={() => handleAction('discard')} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
              </div>
              
              {selectedEmail.hasAttachments && !attachmentFile && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 border border-indigo-100"
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  Analisar Anexo Oficial
                </button>
              )}
              {attachmentFile && (
                <div className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-100">
                  <i className="fa-solid fa-check-double"></i>
                  Anexo "{attachmentFile.name}" integrado
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
                  <i className="fa-solid fa-wand-magic-sparkles text-4xl mb-4"></i>
                  <p className="text-sm font-bold">Extraindo dados jurídicos...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Processo</p>
                      <p className="text-sm font-mono font-bold text-indigo-900">{analysisResult.caseNumber}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Data / Prazo</p>
                      <p className="text-sm font-bold text-indigo-900">{analysisResult.date}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border rounded-2xl sm:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Movimentação</p>
                      <p className="text-sm text-slate-700 font-medium">{analysisResult.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase">Minuta de Resposta</h4>
                      {!draftResponse && (
                        <button onClick={handleGenerateDraft} className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">
                          {isDrafting ? 'Gerando...' : 'Gerar Minuta'}
                        </button>
                      )}
                    </div>
                    {draftResponse && (
                      <div className="p-4 bg-slate-50 border border-dashed rounded-2xl text-xs text-slate-600 leading-relaxed">
                        {draftResponse}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t">
                    <button 
                      onClick={() => handleAction('sync')}
                      className="flex flex-col items-center gap-2 p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg"
                    >
                      <i className="fa-solid fa-check-double text-lg"></i>
                      <span className="text-[10px] font-bold">Sincronizar</span>
                    </button>
                    <button 
                      onClick={() => handleAction('calendar')}
                      className="flex flex-col items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100"
                    >
                      <i className="fa-solid fa-calendar-plus text-lg"></i>
                      <span className="text-[10px] font-bold">Agenda</span>
                    </button>
                    <button 
                      onClick={() => handleAction('task')}
                      className="flex flex-col items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100"
                    >
                      <i className="fa-solid fa-thumbtack text-lg"></i>
                      <span className="text-[10px] font-bold">Tarefa</span>
                    </button>
                    <button 
                      onClick={() => handleAction('discard')}
                      className="flex flex-col items-center gap-2 p-3 bg-slate-50 text-slate-500 rounded-xl border border-slate-200"
                    >
                      <i className="fa-solid fa-trash-can text-lg"></i>
                      <span className="text-[10px] font-bold">Descartar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-300">Não foi possível processar este conteúdo.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
            <i className="fa-solid fa-envelope-open-text text-6xl mb-4"></i>
            <h3 className="text-lg font-bold text-slate-400">Inbox Inteligente LexAI</h3>
            <p className="text-sm max-w-[280px] mx-auto mt-2">
              Selecione um e-mail verificado para iniciar a análise automática de prazos e audiências.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailAnalysis;
