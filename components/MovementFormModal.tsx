import React, { useState, useMemo, useEffect } from 'react';
import { CourtMovement, Client } from '../types';

interface MovementFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (movement: Partial<CourtMovement> & { id?: string }) => void;
    clients: Client[];
    initialData?: CourtMovement | null;
}

const MovementFormModal: React.FC<MovementFormModalProps> = ({ isOpen, onClose, onSubmit, clients, initialData }) => {
    const [formData, setFormData] = useState({
        clientId: '',
        caseNumber: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        description: '',
        type: 'Deadline' as CourtMovement['type'],
        modality: 'Presencial' as CourtMovement['modality'],
        source: 'Lançamento Manual'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                clientId: initialData.clientId || '',
                caseNumber: initialData.caseNumber,
                date: initialData.date,
                time: initialData.time || '09:00',
                description: initialData.description,
                type: initialData.type,
                modality: initialData.modality || 'Presencial',
                source: initialData.source
            });
        } else {
            setFormData({
                clientId: '',
                caseNumber: '',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                description: '',
                type: 'Deadline',
                modality: 'Presencial',
                source: 'Lançamento Manual'
            });
        }
    }, [initialData, isOpen]);

    const matchedClientName = useMemo(() => {
        if (!formData.caseNumber) return null;
        const client = clients.find(c => c.caseNumber.trim() === formData.caseNumber.trim());
        return client ? client.name : null;
    }, [formData.caseNumber, clients]);

    const handleClientChange = (clientId: string) => {
        const selectedClient = clients.find(c => c.id === clientId);
        setFormData({
            ...formData,
            clientId,
            caseNumber: selectedClient ? selectedClient.caseNumber : ''
        });
    };

    const handleCaseNumberChange = (caseNumber: string) => {
        const client = clients.find(c => c.caseNumber.trim() === caseNumber.trim());
        setFormData({
            ...formData,
            caseNumber,
            clientId: client ? client.id : formData.clientId
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(initialData ? { ...formData, id: initialData.id } : formData);
    };

    if (!isOpen) return null;

    const inputClass = "w-full p-5 bg-white/5 border border-white/10 rounded-none focus:border-brand-500 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-800";
    const labelClass = "block text-[9px] font-black uppercase text-slate-600 mb-3 tracking-[0.4em]";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0A0A0B]/90 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-500">
            <div className="bg-[#0A0A0B] w-full max-w-2xl border border-white/10 p-16 space-y-12 animate-in zoom-in-95 my-8">
                <div className="flex justify-between items-end border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em] italic">Protocolo de Registro</span>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase font-serif">
                            {initialData ? 'Modificar Lançamento' : 'Novo Lançamento Táctico'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="h-12 w-12 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center">
                        <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Identificação do Processo</label>
                            <input
                                type="text"
                                required
                                className={inputClass}
                                placeholder="CÓDIGO ÚNICO (CNJ)"
                                value={formData.caseNumber}
                                onChange={(e) => handleCaseNumberChange(e.target.value)}
                            />
                            {matchedClientName && (
                                <p className="mt-3 text-[9px] font-black text-brand-500 uppercase tracking-[0.2em] italic">
                                    <i className="fa-solid fa-user-check mr-2"></i>Custodiado: {matchedClientName}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Vincular Entidade de Custódia</label>
                            <select className={inputClass} value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)}>
                                <option value="" className="bg-[#0A0A0B]">-- SELECIONAR CLIENTE --</option>
                                {clients.map(c => <option key={c.id} value={c.id} className="bg-[#0A0A0B]">{c.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Data da Operação</label>
                            <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                        </div>

                        <div>
                            <label className={labelClass}>Natureza do Evento</label>
                            <select className={inputClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                                <option value="Deadline" className="bg-[#0A0A0B]">PRAZO PROCESSUAL</option>
                                <option value="Audiência" className="bg-[#0A0A0B]">AUDIÊNCIA / DILIGÊNCIA</option>
                                <option value="Notification" className="bg-[#0A0A0B]">NOTIFICAÇÃO EXTERNA</option>
                            </select>
                        </div>

                        {formData.type === 'Audiência' && (
                            <div className="md:col-span-2 grid grid-cols-2 gap-10 animate-in slide-in-from-top-4 duration-700">
                                <div><label className={labelClass}>Horário</label><input type="time" required className={inputClass} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
                                <div><label className={labelClass}>Modalidade</label><select className={inputClass} value={formData.modality} onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}><option value="Presencial" className="bg-[#0A0A0B]">FÍSICO / PRESENCIAL</option><option value="Online" className="bg-[#0A0A0B]">VIRTUAL / VIDEOCONFERÊNCIA</option></select></div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className={labelClass}>Detalhamento Operacional</label>
                            <textarea
                                required
                                className={`${inputClass} h-32 resize-none`}
                                placeholder="DESREVER AÇÃO OU PRAZO COM PRECISÃO TÉCNICA..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-10 pt-10 border-t border-white/5">
                        <button type="button" onClick={onClose} className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] hover:text-white transition-all">ABORTAR</button>
                        <button type="submit" className="flex-1 bg-brand-500 text-black py-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl">
                            {initialData ? 'SINCRONIZAR ALTERAÇÕES' : 'CONSOLIDAR LANÇAMENTO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovementFormModal;
