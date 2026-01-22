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
        <div className="space-y-16 animate-in fade-in duration-1000 pb-40">
            <div className="space-y-2 text-left">
                <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Cronograma Operacional</span>
                <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Agenda de Audiências</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1 border-t border-white/5 pt-16">
                <div className="space-y-10 p-4">
                    <div className="flex items-center gap-6">
                        <div className="h-[1px] w-12 bg-brand-500"></div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Carteira Particular</h3>
                    </div>
                    <div className="space-y-8">
                        {hearingsByOrigin.Particular.length > 0 ? hearingsByOrigin.Particular.map(renderHearingCard) : (
                            <div className="p-24 text-center border border-white/5 bg-white/[0.01]">
                                <p className="text-[9px] font-black text-slate-900 uppercase tracking-[1em]">FLUXO LIMPO</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-10 p-4 xl:border-l border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="h-[1px] w-12 bg-emerald-500"></div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Convênio Público</h3>
                    </div>
                    <div className="space-y-8">
                        {hearingsByOrigin.Defensoria.length > 0 ? hearingsByOrigin.Defensoria.map(renderHearingCard) : (
                            <div className="p-24 text-center border border-white/5 bg-white/[0.01]">
                                <p className="text-[9px] font-black text-slate-900 uppercase tracking-[1em]">FLUXO LIMPO</p>
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
