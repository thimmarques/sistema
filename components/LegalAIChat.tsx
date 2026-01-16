
import React, { useState, useRef, useEffect } from 'react';
import { legalChat, researchCaseLaw } from '../geminiService';
import { Message } from '../types';

const LegalAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o LexAI, seu assistente jurídico avançado. Em que posso ajudar hoje? (Posso analisar casos, redigir petições ou pesquisar jurisprudência em tempo real)', timestamp: new Date() }
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
      
      const aiMessage: Message = { 
        role: 'model', 
        text: responseText, 
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro na minha inteligência artificial. Tente novamente mais tarde.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center animate-pulse">
            <i className="fa-solid fa-robot text-white"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">LexAI Pro Assistant</h3>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="h-1 w-1 bg-indigo-600 rounded-full"></span>
              Gemini-3-Pro Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border rounded-lg hover:border-indigo-300 transition-all">
            <input 
              type="checkbox" 
              className="accent-indigo-600"
              checked={researchMode}
              onChange={(e) => setResearchMode(e.target.checked)}
            />
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <i className="fa-brands fa-google text-slate-400"></i>
              Modo Pesquisa (Google)
            </span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                <i className={`fa-solid ${msg.role === 'user' ? 'fa-user text-xs' : 'fa-robot text-xs'}`}></i>
              </div>
              <div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10' 
                    : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Render grounding sources if they exist */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Fontes Verificadas:</p>
                      <ul className="space-y-1.5">
                        {msg.sources.map((chunk, cIdx) => (
                          chunk.web && (
                            <li key={cIdx}>
                              <a 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-link text-[9px]"></i>
                                <span className="underline decoration-indigo-200 underline-offset-2">{chunk.web.title || chunk.web.uri}</span>
                              </a>
                            </li>
                          )
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200 flex gap-2 items-center">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
                <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
              </div>
              <span className="text-xs text-slate-500 italic">O LexAI está pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50 border-t">
        <div className="relative max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder={researchMode ? "Qual jurisprudência ou notícia devo pesquisar?" : "Pergunte algo ao seu assistente..."}
            className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-14 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            className="absolute right-2 top-2 h-9 w-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          Assistente Legal alimentado por Google Gemini. Verifique sempre informações críticas.
        </p>
      </div>
    </div>
  );
};

export default LegalAIChat;
