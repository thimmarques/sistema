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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0B]/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-[#0A0A0B] w-full max-w-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-700">
                {/* Header Section */}
                <div className="p-16 border-b border-white/5 space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className={`px-4 py-1.5 border text-[8px] font-black tracking-[0.3em] uppercase ${movement.type === 'Audiência' ? 'border-orange-500 text-orange-500' : 'border-brand-500 text-brand-500'}`}>
                                {movement.type === 'Audiência' ? 'AUDIÊNCIA' : 'PRAZO JURÍDICO'}
                            </span>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-2 italic">{weekday}, {day} de {month}</p>
                        </div>
                        <button onClick={onClose} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center group">
                            <i className="fa-solid fa-xmark text-xs group-hover:rotate-90 transition-transform"></i>
                        </button>
                    </div>

                    <h3 className="text-4xl font-black text-white italic tracking-tight font-serif leading-tight">
                        {movement.description}
                    </h3>
                </div>

                <div className="p-16 space-y-16">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.4em]">Custodiado (Cliente)</span>
                            <div className="flex items-center gap-6">
                                <div className="h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-brand-500 font-black italic">
                                    {(client?.name || 'V').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-white text-lg tracking-tight uppercase italic">{client?.name || 'REGISTRO AVULSO'}</p>
                                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{movement.caseNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.4em]">Especificações</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-4 py-1.5 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                                    {movement.time || '09:00'}
                                </span>
                                <span className={`px-4 py-1.5 bg-white/5 text-[9px] font-black uppercase tracking-widest border border-white/5 ${movement.modality === 'Online' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                                    {movement.modality || 'PRESENCIAL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-12 border-t border-white/5">
                        <span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.4em]">Fonte de Referência</span>
                        <div className="flex items-start gap-8 bg-white/[0.01] p-8 border border-white/5 group">
                            <div className="h-10 w-10 flex items-center justify-center bg-white/5 text-brand-500">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <div className="space-y-2 flex-1">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">{movement.source || 'INSTÂNCIA JUDICIAL'}</p>
                                <p className="text-[9px] text-slate-700 font-black uppercase tracking-tighter">SINCRONIZAÇÃO AUTOMÁTICA EM CURSO</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-8 border-t border-white/5">
                        {googleConnected && !movement.syncedToGoogle && onSyncToGoogle && (
                            <button
                                onClick={onSyncToGoogle}
                                className="w-full h-16 bg-brand-500 text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all flex items-center justify-center gap-4"
                            >
                                <i className="fa-brands fa-google text-lg"></i>
                                SINCRONIZAR COM A NUVEM
                            </button>
                        )}
                        {movement.syncedToGoogle && (
                            <div className="w-full h-16 bg-white/5 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] border border-emerald-500/20 flex items-center justify-center gap-4">
                                <i className="fa-solid fa-circle-check text-lg"></i>
                                REGISTRO SINCRONIZADO
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="h-14 bg-white/5 text-slate-600 font-black text-[9px] uppercase tracking-[0.3em] hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <i className="fa-solid fa-pen-nib"></i> REVISAR
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="h-14 bg-white/5 text-rose-900 font-black text-[9px] uppercase tracking-[0.3em] hover:text-rose-500 transition-all flex items-center justify-center gap-3"
                                >
                                    <i className="fa-solid fa-trash-can"></i> ELIMINAR
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
