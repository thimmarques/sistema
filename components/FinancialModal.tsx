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
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0A0A0B]/90 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-500">
            <div className="w-full max-w-5xl shadow-2xl my-8 border border-white/10 overflow-hidden">
                <FinancialRegistration
                    origin={clientOrigin}
                    caseType="Geral" // Can be refined to pass actual caseType if needed
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
