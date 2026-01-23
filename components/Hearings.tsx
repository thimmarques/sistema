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
                className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm group hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col md:flex-row gap-8"
                onClick={() => setSelectedHearing(h)}
            >
                <div className="flex flex-col items-center justify-center min-w-[80px] h-20 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-bold text-blue-600 tracking-wider mb-1 uppercase">{month}</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{day < 10 ? `0${day}` : day}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">{h.time || '09:00'}</span>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="text-left">
                            <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {client?.name || 'Registro Avulso'}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{h.caseNumber}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full border font-bold text-[10px] tracking-wide uppercase ${h.modality === 'Online' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                            {h.modality || 'Presencial'}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-location-dot text-blue-500 text-xs"></i>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h.source || 'Não especificado'}</span>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedHearing(h); }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"><i className="fa-solid fa-eye text-sm"></i></button>
                            <button onClick={(e) => { e.stopPropagation(); setMovementToEdit(h); setShowForm(true); }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"><i className="fa-solid fa-pen-to-square text-sm"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2 text-left">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wide">Pauta de Juízo</p>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audiências</h2>
                    <p className="text-sm text-slate-500 font-medium">Controle de sustentação e conciliações</p>
                </div>
                <div className="bg-white px-6 py-2 rounded-full border border-slate-200 flex items-center gap-3 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monitoramento em Tempo Real</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Carteira Particular</h3>
                    </div>
                    <div className="space-y-4">
                        {hearingsByOrigin.Particular.length > 0 ? hearingsByOrigin.Particular.map(h => renderHearingCard(h)) : (
                            <div className="py-16 text-center bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                <i className="fa-solid fa-calendar-xmark text-slate-200 text-4xl"></i>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma audiência particular</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-l-4 border-emerald-600 pl-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Convênio Público</h3>
                    </div>
                    <div className="space-y-4">
                        {hearingsByOrigin.Defensoria.length > 0 ? hearingsByOrigin.Defensoria.map(h => renderHearingCard(h)) : (
                            <div className="py-16 text-center bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                <i className="fa-solid fa-calendar-xmark text-slate-200 text-4xl"></i>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma audiência defensoria</p>
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
