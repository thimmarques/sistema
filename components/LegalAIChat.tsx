import React, { useState, useRef, useEffect } from 'react';
import { legalChat, researchCaseLaw } from '../geminiService';
import { Message } from '../types';

const LegalAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'SISTEMA INICIALIZADO. SOU O LEXAI, SEU ASSISTENTE JURÍDICO DE ELITE. POSSO ANALISAR ESTRUTURAS PROCESSUAIS, REDIGIR PETIÇÕES DE ALTO IMPACTO E PESQUISAR JURISPRUDÊNCIA EM TEMPO REAL. COMO DEVO ATUAR?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      let responseText = '';
      let sources: any[] = [];
      if (researchMode) {
        const result = await researchCaseLaw(input);
        responseText = result.text;
        sources = result.sources;
      } else {
        responseText = await legalChat(messages, input);
      }
      const aiMessage: Message = { role: 'model', text: responseText, timestamp: new Date(), sources: sources.length > 0 ? sources : undefined };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'FALHA OPERACIONAL NA REDE NEURAL. REINICIE O PROTOCOLO DE CHAT.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-brand-900 border border-brand-800 overflow-hidden animate-in fade-in duration-1000">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 border border-brand-500 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-brand-500/10 blur-md animate-pulse"></div>
            <i className="fa-solid fa-robot text-brand-500 text-xl relative z-10"></i>
          </div>
          <div>
            <h3 className="font-black text-white italic tracking-tighter uppercase text-lg">LexAI Core Assistant</h3>
            <p className="text-[10px] text-brand-500 font-black uppercase tracking-[0.4em] flex items-center gap-2 mt-1">
              <span className="h-1 w-1 bg-brand-500 rounded-full animate-ping"></span>
              Ultra-Protocol Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-4 cursor-pointer bg-white/5 px-6 py-3 border border-white/5 hover:border-brand-500 transition-all">
            <input type="checkbox" className="hidden" checked={researchMode} onChange={(e) => setResearchMode(e.target.checked)} />
            <div className={`h-4 w-4 border border-white/20 flex items-center justify-center transition-all ${researchMode ? 'bg-brand-500 border-brand-500' : ''}`}>
              {researchMode && <i className="fa-solid fa-check text-[10px] text-black"></i>}
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
              <i className="fa-brands fa-google"></i> PESQUISA GLOBAL (REALTIME)
            </span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-10 w-10 border flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-white/5 border-white/10 text-slate-600' : 'bg-brand-500/10 border-brand-500 text-brand-500'}`}>
                <i className={`fa-solid ${msg.role === 'user' ? 'fa-user text-xs' : 'fa-terminal text-xs'}`}></i>
              </div>
              <div className="space-y-4">
                <div className={`p-8 border leading-relaxed text-xs font-black uppercase tracking-widest ${msg.role === 'user' ? 'bg-brand-800/50 border-brand-800 text-brand-50' : 'bg-brand-900 border-accent-gold/30 text-brand-300'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                      <p className="text-[8px] font-black text-brand-500 uppercase tracking-[0.4em]">Fontes Verificadas:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.sources.map((chunk, cIdx) => chunk.web && (
                          <a key={cIdx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white text-[9px] flex items-center gap-3 transition-colors">
                            <i className="fa-solid fa-link text-[8px]"></i>
                            <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-[8px] font-black text-slate-800 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  TIMESTAMP: {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-8 border border-white/5 flex gap-4 items-center">
              <div className="flex gap-2">
                <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
                <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
              </div>
              <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em] italic">LexAI Processando Dados...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-white/[0.01] border-t border-white/5">
        <div className="relative max-w-5xl mx-auto flex gap-4">
          <input
            type="text"
            placeholder={researchMode ? "PROTOCOLAR CONSULTA EXTERNA..." : "PERGUNTAR AO CORE..."}
            className="flex-1 bg-white/5 border border-white/10 p-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            className="h-14 w-20 bg-brand-500 text-black flex items-center justify-center hover:bg-brand-600 transition-all disabled:opacity-20"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
        <p className="text-[8px] text-center text-slate-800 font-black uppercase tracking-[0.5em] mt-6 italic">
          LexAI Core Engine &bull; Proteção de Sigilo Ativa
        </p>
      </div>
    </div>
  );
};

export default LegalAIChat;
