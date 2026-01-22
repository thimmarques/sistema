import React, { useMemo, useState } from 'react';
import { Client, CourtMovement, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';
import MovementFormModal from './MovementFormModal';

interface HearingsProps {
    movements: CourtMovement[];
    clients: Client[];
    settings: UserSettings;
    onAddMovement?: (movement: CourtMovement) => void;
    onUpdateMovement?: (movement: CourtMovement) => void;
    onDeleteMovement?: (movement: CourtMovement) => void;
}

const Hearings: React.FC<HearingsProps> = ({
    movements,
    clients,
    settings,
    onAddMovement,
    onUpdateMovement,
    onDeleteMovement
}) => {
    const [selectedHearing, setSelectedHearing] = useState<CourtMovement | null>(null);
    const [movementToEdit, setMovementToEdit] = useState<CourtMovement | null>(null);
    const [showForm, setShowForm] = useState(false);

    const hearingsByOrigin = useMemo(() => {
        const hearings = movements.filter(m => m.type === 'Audiência');
        return {
            Particular: hearings.filter(h => clients.find(c => c.id === h.clientId)?.origin === 'Particular'),
            Defensoria: hearings.filter(h => clients.find(c => c.id === h.clientId)?.origin === 'Defensoria')
        };
    }, [movements, clients]);

    const renderHearingCard = (h: CourtMovement) => {
        const client = clients.find(c => c.id === h.clientId);
        const date = new Date(h.date + 'T12:00:00');
        const day = date.getDate();
        const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        return (
            <div
                key={h.id}
                className="bg-white/[0.01] border border-white/5 p-10 group hover:bg-white/[0.02] hover:border-brand-500/30 transition-all cursor-pointer flex flex-col md:flex-row gap-10"
                onClick={() => setSelectedHearing(h)}
            >
                <div className="flex flex-col items-center justify-center min-w-[100px] h-24 bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-black text-brand-500 tracking-[0.3em] mb-1">{month}</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{day < 10 ? `0${day}` : day}</span>
                    <span className="text-[10px] font-black text-slate-800 mt-2">{h.time || '09:00'}</span>
                </div>
                <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-white italic tracking-tight group-hover:text-brand-500 transition-colors uppercase">
                                {client?.name || 'REGISTRO AVULSO'}
                            </h4>
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{h.caseNumber}</p>
                        </div>
                        <span className={`px-4 py-1.5 border font-black text-[9px] tracking-[0.2em] uppercase ${h.modality === 'Online' ? 'border-cyan-500 text-cyan-500' : 'border-emerald-500 text-emerald-500'}`}>
                            {h.modality || 'PRESENCIAL'}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-6">
                        <div className="flex items-center gap-4">
                            <i className="fa-solid fa-location-dot text-brand-500 text-xs"></i>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{h.source || 'INSTÂNCIA CENTRAL'}</span>
                        </div>
                        <div className="flex gap-1 w-full md:w-auto">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedHearing(h); }} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center"><i className="fa-solid fa-eye text-xs"></i></button>
                            <button onClick={(e) => { e.stopPropagation(); setMovementToEdit(h); setShowForm(true); }} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="space-y-1 text-left">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda de Audiências</h2>
                <p className="text-slate-500">Controle tático de compromissos judiciais.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t border-slate-100 pt-10">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-1 w-8 bg-brand-600 rounded-full"></div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Carteira Particular</h3>
                    </div>
                    <div className="space-y-4">
                        {hearingsByOrigin.Particular.length > 0 ? hearingsByOrigin.Particular.map(h => {
                            const client = clients.find(c => c.id === h.clientId);
                            const date = new Date(h.date + 'T12:00:00');
                            const day = date.getDate();
                            const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

                            return (
                                <div
                                    key={h.id}
                                    className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer flex gap-6"
                                    onClick={() => setSelectedHearing(h)}
                                >
                                    <div className="flex flex-col items-center justify-center min-w-[70px] h-20 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-bold text-brand-600 tracking-wider mb-0.5">{month}</span>
                                        <span className="text-2xl font-bold text-slate-900 leading-none">{day < 10 ? `0${day}` : day}</span>
                                        <span className="text-[10px] font-bold text-slate-400 mt-1">{h.time || '09:00'}</span>
                                    </div>
                                    <div className="flex-1 space-y-4 text-left">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-900 uppercase text-sm leading-tight group-hover:text-brand-600 transition-colors">
                                                    {client?.name || 'Registro Avulso'}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.caseNumber}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full font-bold text-[9px] tracking-widest uppercase border ${h.modality === 'Online' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                {h.modality || 'PRESENCIAL'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-location-dot text-slate-300 text-[10px]"></i>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{h.source || 'Fórum Central'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedHearing(h); }} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"><i className="fa-solid fa-eye text-xs"></i></button>
                                                <button onClick={(e) => { e.stopPropagation(); setMovementToEdit(h); setShowForm(true); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sem compromissos hoje</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Convênio Público</h3>
                    </div>
                    <div className="space-y-4">
                        {hearingsByOrigin.Defensoria.length > 0 ? hearingsByOrigin.Defensoria.map(h => {
                            const client = clients.find(c => c.id === h.clientId);
                            const date = new Date(h.date + 'T12:00:00');
                            const day = date.getDate();
                            const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

                            return (
                                <div
                                    key={h.id}
                                    className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex gap-6"
                                    onClick={() => setSelectedHearing(h)}
                                >
                                    <div className="flex flex-col items-center justify-center min-w-[70px] h-20 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider mb-0.5">{month}</span>
                                        <span className="text-2xl font-bold text-slate-900 leading-none">{day < 10 ? `0${day}` : day}</span>
                                        <span className="text-[10px] font-bold text-slate-400 mt-1">{h.time || '09:00'}</span>
                                    </div>
                                    <div className="flex-1 space-y-4 text-left">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-slate-900 uppercase text-sm leading-tight group-hover:text-emerald-600 transition-colors">
                                                    {client?.name || 'Registro Avulso'}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.caseNumber}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full font-bold text-[9px] tracking-widest uppercase border ${h.modality === 'Online' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                {h.modality || 'PRESENCIAL'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-location-dot text-slate-300 text-[10px]"></i>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{h.source || 'Fórum Central'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedHearing(h); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><i className="fa-solid fa-eye text-xs"></i></button>
                                                <button onClick={(e) => { e.stopPropagation(); setMovementToEdit(h); setShowForm(true); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sem compromissos hoje</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedHearing && (
                <MovementSummaryModal
                    movement={movements.find(m => m.id === selectedHearing.id) || selectedHearing}
                    client={clients.find(c => c.id === selectedHearing.clientId || c.caseNumber === selectedHearing.caseNumber)}
                    settings={settings}
                    onClose={() => setSelectedHearing(null)}
                    onEdit={() => {
                        const h = movements.find(m => m.id === selectedHearing.id) || selectedHearing;
                        setSelectedHearing(null);
                        setMovementToEdit(h);
                        setShowForm(true);
                    }}
                    onDelete={() => {
                        const h = movements.find(m => m.id === selectedHearing.id) || selectedHearing;
                        if (window.confirm('EXCLUIR REGISTRO PERMANENTEMENTE?')) {
                            onDeleteMovement?.(h);
                            setSelectedHearing(null);
                        }
                    }}
                />
            )}

            <MovementFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setMovementToEdit(null); }}
                onSubmit={(data) => {
                    if (data.id) onUpdateMovement?.(data as CourtMovement);
                    else onAddMovement?.(data as CourtMovement);
                    setShowForm(false);
                    setMovementToEdit(null);
                }}
                clients={clients}
                initialData={movementToEdit}
            />
        </div>
    );
};

export default Hearings;
