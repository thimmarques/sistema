import React from 'react';
import { CourtMovement, Client, UserSettings } from '../types';

interface MovementSummaryModalProps {
    movement: CourtMovement;
    client?: Client;
    settings: UserSettings;
    onClose: () => void;
    onEdit?: () => void;
    onSyncToGoogle?: () => void;
    googleConnected?: boolean;
    onDelete?: () => void;
}

const MovementSummaryModal: React.FC<MovementSummaryModalProps> = ({
    movement,
    client,
    settings,
    onClose,
    onEdit,
    onSyncToGoogle,
    googleConnected,
    onDelete
}) => {
    const date = new Date(movement.date + 'T12:00:00');
    const day = date.getDate();
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    const weekday = date.toLocaleString('pt-BR', { weekday: 'long' });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-premium animate-in zoom-in-95 duration-500 border border-white/40">
                {/* Header with Artistic Gradient */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-12 text-white relative">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                            <i className={`fa-solid ${movement.type === 'Audiência' ? 'fa-building-columns' : 'fa-calendar-check'} text-brand-200`}></i>
                            {movement.type === 'Audiência' ? 'Audiência Agendada' : 'Prazo Jurídico'}
                        </div>
                        <button onClick={onClose} className="h-10 w-10 bg-white/10 hover:bg-white text-white hover:text-brand-600 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-white/10">
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <h3 className="text-3xl font-black leading-tight tracking-tighter relative z-10">
                        {movement.description}
                    </h3>

                    <div className="mt-6 flex items-center gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-sm ring-1 ring-white/20">
                            <i className="fa-solid fa-file-invoice"></i>
                        </div>
                        <span className="text-[11px] font-black tracking-widest uppercase opacity-80">{movement.caseNumber || 'S/N'}</span>
                    </div>
                </div>

                <div className="p-12 space-y-10 group">
                    {/* Information Bento Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block">Cliente Atendido</span>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-brand-50 text-brand-600 text-sm font-black ring-1 ring-brand-100">
                                    {(client?.name || 'V').charAt(0)}
                                </div>
                                <p className="font-black text-slate-800 text-lg tracking-tight">{client?.name || 'Não vinculado'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block">Área de Atuação</span>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {client?.caseType || 'Geral'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 grid grid-cols-3 gap-6 border border-slate-100/50">
                        <div className="text-center space-y-2 border-r border-slate-200/50">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] block">Dia</span>
                            <p className="font-black text-slate-800 text-xl tracking-tighter">{day} {month.substring(0, 3)}</p>
                        </div>
                        <div className="text-center space-y-2 border-r border-slate-200/50">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] block">Horário</span>
                            <p className="font-black text-slate-800 text-xl tracking-tighter">{movement.time || '—'}</p>
                        </div>
                        <div className="text-center space-y-2">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] block">Formato</span>
                            <div className="flex items-center justify-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${movement.modality === 'Online' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {movement.modality || 'Presencial'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block">Local/Fonte</span>
                        <div className="flex items-start gap-4 p-6 bg-brand-50/30 rounded-[2rem] border border-brand-100/30 group-hover:bg-brand-50/50 transition-colors duration-500">
                            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-brand-100/50 text-brand-600">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <div className="space-y-1 flex-1">
                                <p className="text-[11px] font-black text-brand-800 uppercase tracking-widest">{movement.source || 'Fórum / Instância'}</p>
                                <p className="text-[12px] text-brand-700/70 font-medium leading-relaxed">
                                    Recomenda-se conferência antecipada no portal do tribunal correspondente.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Footer Actions */}
                    <div className="flex flex-col gap-4">
                        {googleConnected && !movement.syncedToGoogle && onSyncToGoogle && (
                            <button
                                onClick={onSyncToGoogle}
                                className="w-full h-16 bg-brand-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4"
                            >
                                <i className="fa-brands fa-google text-lg"></i>
                                Sincronizar Calendário Lex
                            </button>
                        )}
                        {movement.syncedToGoogle && (
                            <div className="w-full h-16 bg-emerald-50 text-emerald-600 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] border border-emerald-100 flex items-center justify-center gap-4 select-none">
                                <i className="fa-solid fa-circle-check text-lg"></i>
                                Evento Sincronizado
                            </div>
                        )}

                        <div className="flex gap-4">
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="flex-1 h-14 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-brand-600 hover:border-brand-100 transition-all flex items-center justify-center gap-2 hover:shadow-md"
                                >
                                    <i className="fa-solid fa-pen"></i> Editar
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="flex-1 h-14 bg-white text-rose-300 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-trash-can"></i> Remover
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovementSummaryModal;
