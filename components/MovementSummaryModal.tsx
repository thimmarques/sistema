import React from 'react';
import { CourtMovement, Client, UserSettings } from '../types';

interface MovementSummaryModalProps {
    movement: CourtMovement;
    client?: Client;
    settings: UserSettings;
    onClose: () => void;
}

const MovementSummaryModal: React.FC<MovementSummaryModalProps> = ({ movement, client, settings, onClose }) => {
    const date = new Date(movement.date + 'T12:00:00');
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    const weekday = date.toLocaleString('pt-BR', { weekday: 'long' });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header with Background Gradient */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors group"
                    >
                        <i className="fa-solid fa-xmark text-white"></i>
                    </button>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-4">
                        <i className={`fa-solid ${movement.type === 'Audiência' ? 'fa-building-columns' : 'fa-calendar-check'}`}></i>
                        {movement.type === 'Audiência' ? 'Resumo da Audiência' : 'Detalhes do Prazo'}
                    </div>

                    <h3 className="text-2xl font-black leading-tight uppercase tracking-tight">
                        {movement.description}
                    </h3>
                </div>

                <div className="p-8 space-y-8">
                    {/* Client & Area Section */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Cliente</span>
                            <p className="font-bold text-slate-800 text-lg">{client?.name || 'Não vinculado'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Área do Direito</span>
                            <p className="font-bold text-slate-800 text-lg">{client?.caseType || 'Não informada'}</p>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Lawyer & Case Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Advogado do Caso</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] text-indigo-600">
                                    <i className="fa-solid fa-user-tie"></i>
                                </div>
                                <p className="font-bold text-slate-700">{settings.name || 'Advogado LexAI'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Processo</span>
                            <p className="font-mono text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg inline-block">
                                {movement.caseNumber || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="bg-slate-50 rounded-3xl p-6 grid grid-cols-3 gap-4">
                        <div className="text-center space-y-1 border-r border-slate-200">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter block">Data</span>
                            <p className="font-black text-slate-800 text-base">{day} {month.substring(0, 3)}</p>
                        </div>
                        <div className="text-center space-y-1 border-r border-slate-200">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter block">Horário</span>
                            <p className="font-black text-slate-800 text-base">{movement.time || '09:00'}</p>
                        </div>
                        <div className="text-center space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter block">Modalidade</span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${movement.modality === 'Online' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {movement.modality || 'Presencial'}
                            </span>
                        </div>
                    </div>

                    {/* Important Info Section */}
                    <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Informações Importantes</span>
                        <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                            <i className="fa-solid fa-circle-info text-indigo-400 mt-1"></i>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">{movement.source || 'Fórum Central'}</p>
                                <p className="text-xs text-indigo-700/80 leading-relaxed font-medium">
                                    Verifique a pauta de audiências com 15 minutos de antecedência. Em caso de modalidade online, certifique-se de que o link de acesso foi enviado ao cliente.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all active:scale-[0.98]"
                    >
                        Fechar Resumo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MovementSummaryModal;
