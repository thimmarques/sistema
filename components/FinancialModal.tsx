import React from 'react';
import FinancialRegistration from './FinancialRegistration';
import { ClientOrigin, ClientFinancials } from '../types';

interface FinancialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (financials: ClientFinancials) => void;
    clientOrigin: ClientOrigin;
    initialData?: ClientFinancials;
}

const FinancialModal: React.FC<FinancialModalProps> = ({
    isOpen,
    onClose,
    onFinish,
    clientOrigin,
    initialData
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="w-full max-w-5xl shadow-2xl my-8 bg-white rounded-3xl overflow-hidden animate-in zoom-in-95">
                <FinancialRegistration
                    origin={clientOrigin}
                    caseType="Geral"
                    clientName="Registro em Curso"
                    existingFinancials={initialData}
                    onBack={onClose}
                    onFinish={onFinish}
                />
            </div>
        </div>
    );
};

export default FinancialModal;
