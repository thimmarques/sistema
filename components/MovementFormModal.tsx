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

    const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400";
    const labelClass = "block text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest ml-1";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 md:p-10 space-y-8 animate-in zoom-in-95 my-8">
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div className="space-y-1 text-left">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {initialData ? 'Editar Evento' : 'Novo Agendamento'}
                        </h3>
                        <p className="text-xs text-slate-500">Preencha os dados do compromisso judicial.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2 text-left">
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
                                <p className="mt-2 text-[10px] font-bold text-brand-600 uppercase tracking-wider flex items-center gap-2">
                                    <i className="fa-solid fa-user-check"></i> Cliente: {matchedClientName}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2 space-y-2 text-left">
                            <label className={labelClass}>Vincular Cliente</label>
                            <select className={inputClass} value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)}>
                                <option value="">-- Selecione o Cliente --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2 text-left">
                            <label className={labelClass}>Data</label>
                            <input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                        </div>

                        <div className="space-y-2 text-left">
                            <label className={labelClass}>Tipo de Evento</label>
                            <select className={inputClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                                <option value="Deadline">Prazo Processual</option>
                                <option value="Audiência">Audiência / Diligência</option>
                                <option value="Notification">Notificação</option>
                            </select>
                        </div>

                        {formData.type === 'Audiência' && (
                            <div className="md:col-span-2 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2 text-left"><label className={labelClass}>Horário</label><input type="time" required className={inputClass} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
                                <div className="space-y-2 text-left"><label className={labelClass}>Modalidade</label><select className={inputClass} value={formData.modality} onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}><option value="Presencial">Presencial</option><option value="Online">Virtual / Online</option></select></div>
                            </div>
                        )}

                        <div className="md:col-span-2 space-y-2 text-left">
                            <label className={labelClass}>Descrição / Observações</label>
                            <textarea
                                required
                                className={`${inputClass} h-28 resize-none`}
                                placeholder="Detalhes do compromisso..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" className="flex-[2] bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">
                            {initialData ? 'Salvar Alterações' : 'Agendar Evento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovementFormModal;
