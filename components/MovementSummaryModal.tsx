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
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header Section */}
                <div className="p-8 md:p-10 border-b border-slate-100 space-y-6 text-left">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border ${movement.type === 'Audiência' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-brand-50 border-brand-100 text-brand-600'}`}>
                                {movement.type === 'Audiência' ? 'AUDIÊNCIA' : 'PRAZO JURÍDICO'}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{weekday}, {day} de {month}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all group">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                        {movement.description}
                    </h3>
                </div>

                <div className="p-8 md:p-10 space-y-10 text-left">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Cliente</span>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 font-bold">
                                    {(client?.name || 'V').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm tracking-tight">{client?.name || 'Registro Avulso'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{movement.caseNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Especificações</span>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest rounded-lg border border-slate-100">
                                    {movement.time || '09:00'}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${movement.modality === 'Online' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                    {movement.modality || 'PRESENCIAL'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-8 border-t border-slate-100 text-left">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Fórum / Instância</span>
                        <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <div className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-brand-600 border border-slate-100">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">{movement.source || 'Fórum Central'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronização Ativa</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
                        {googleConnected && !movement.syncedToGoogle && onSyncToGoogle && (
                            <button
                                onClick={onSyncToGoogle}
                                className="w-full py-4 bg-brand-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-3"
                            >
                                <i className="fa-brands fa-google"></i>
                                Sincronizar com Google Agenda
                            </button>
                        )}
                        {movement.syncedToGoogle && (
                            <div className="w-full py-4 bg-emerald-50 text-emerald-600 font-bold text-xs uppercase tracking-widest rounded-2xl border border-emerald-100 flex items-center justify-center gap-3">
                                <i className="fa-solid fa-circle-check"></i>
                                Sincronizado com Google
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="py-3 bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i> Editar
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="py-3 bg-rose-50 text-rose-500 font-bold text-xs uppercase tracking-widest rounded-xl border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-trash-can"></i> Excluir
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
