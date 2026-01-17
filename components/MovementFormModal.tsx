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

    const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700";
    const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 my-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
                    </h3>
                    <button onClick={onClose} className="h-10 w-10 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Número do Processo</label>
                            <input
                                type="text"
                                required
                                className={inputClass}
                                placeholder="0000000-00.0000.0.00.0000"
                                value={formData.caseNumber}
                                onChange={(e) => handleCaseNumberChange(e.target.value)}
                            />
                            {matchedClientName && (
                                <p className="mt-1.5 text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                    <i className="fa-solid fa-user-check"></i>Cliente Identificado: <span className="uppercase">{matchedClientName}</span>
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Vincular Cliente (Opcional)</label>
                            <select className={inputClass} value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)}>
                                <option value="">-- Selecione um Cliente --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Data do Evento</label>
                                <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Evento</label>
                                <select className={inputClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                                    <option value="Deadline">Prazo Processual</option>
                                    <option value="Audiência">Audiência</option>
                                    <option value="Notification">Notificação / Outro</option>
                                </select>
                            </div>
                        </div>
                        {formData.type === 'Audiência' && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div><label className={labelClass}>Horário</label><input type="time" required className={inputClass} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
                                <div><label className={labelClass}>Modalidade</label><select className={inputClass} value={formData.modality} onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}><option value="Presencial">Presencial</option><option value="Online">Online / Videoconferência</option></select></div>
                            </div>
                        )}
                        <div>
                            <label className={labelClass}>Descrição do Lançamento</label>
                            <textarea
                                required
                                className={`${inputClass} h-24 resize-none`}
                                placeholder="Ex: Prazo para réplica à contestação..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-6 pt-4">
                        <button type="button" onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                            {initialData ? 'Salvar Alterações' : 'Salvar na Agenda'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovementFormModal;
