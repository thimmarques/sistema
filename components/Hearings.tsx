
import React, { useMemo } from 'react';
import { Client, CourtMovement } from '../types';

interface HearingsProps {
    movements: CourtMovement[];
    clients: Client[];
}

const Hearings: React.FC<HearingsProps> = ({ movements, clients }) => {
    const hearingsByOrigin = useMemo(() => {
        const hearings = movements.filter(m => m.type === 'Audiência');

        return {
            Particular: hearings.filter(h => {
                const client = clients.find(c => c.id === h.clientId);
                return client?.origin === 'Particular';
            }),
            Defensoria: hearings.filter(h => {
                const client = clients.find(c => c.id === h.clientId);
                return client?.origin === 'Defensoria';
            })
        };
    }, [movements, clients]);

    const renderHearingCard = (h: CourtMovement) => {
        const client = clients.find(c => c.id === h.clientId);
        const date = new Date(h.date);
        const day = date.getDate() + 1;
        const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        return (
            <div key={h.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start gap-6">
                    <div className="flex flex-col items-center justify-center min-w-[70px] h-20 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-rose-500 tracking-widest leading-none mb-1">{month}</span>
                        <span className="text-2xl font-black text-slate-800 leading-none">{day < 10 ? `0${day}` : day}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{h.time || '09:00'}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                {client?.name || 'Cliente não encontrado'}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${h.modality === 'Online' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                                {h.modality || 'Presencial'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium mt-1">{h.caseNumber}</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{h.source || 'Fórum Central'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Audiências Agendadas</h2>
                    <p className="text-slate-500 font-medium font-bold uppercase text-[10px] tracking-widest">Cronograma Jurídico LexAI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Particular Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-user-tie"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Setor Particular</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {hearingsByOrigin.Particular.length > 0 ? (
                            hearingsByOrigin.Particular.map(renderHearingCard)
                        ) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma audiência particular agendada</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Defensoria Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <i className="fa-solid fa-landmark"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Convênio Defensoria</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {hearingsByOrigin.Defensoria.length > 0 ? (
                            hearingsByOrigin.Defensoria.map(renderHearingCard)
                        ) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma audiência da defensoria agendada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hearings;
