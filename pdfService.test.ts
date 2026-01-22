
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateClientPDF } from './pdfService';
import { Client, UserSettings } from './types';

// Mock jsPDF
vi.mock('jspdf', () => {
    const jsPDF = vi.fn();
    jsPDF.prototype.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    jsPDF.prototype.setFillColor = vi.fn();
    jsPDF.prototype.rect = vi.fn();
    jsPDF.prototype.setTextColor = vi.fn();
    jsPDF.prototype.setFont = vi.fn();
    jsPDF.prototype.setFontSize = vi.fn();
    jsPDF.prototype.text = vi.fn();
    jsPDF.prototype.line = vi.fn();
    jsPDF.prototype.setDrawColor = vi.fn();
    jsPDF.prototype.setLineWidth = vi.fn();
    jsPDF.prototype.addPage = vi.fn();
    jsPDF.prototype.save = vi.fn();
    jsPDF.prototype.splitTextToSize = vi.fn().mockReturnValue(['line 1', 'line 2']);
    jsPDF.prototype.getImageProperties = vi.fn().mockReturnValue({ width: 100, height: 100 });
    jsPDF.prototype.addImage = vi.fn();
    return { jsPDF };
});

import { jsPDF } from 'jspdf';

describe('pdfService', () => {
    const mockClient: Client = {
        id: '1',
        name: 'Cliente Teste',
        email: 'teste@cliente.com',
        phone: '1199999999',
        cpf_cnpj: '123.456.789-00',
        origin: 'Particular',
        caseNumber: '0000001-01.2023.8.26.0000',
        caseType: 'Cível',
        caseDescription: 'Ação de Cobrança',
        status: 'Active',
        createdAt: new Date().toISOString(),
        city: 'São Paulo',
        address: 'Rua Teste, 123'
    };

    const mockSettings: UserSettings = {
        name: 'Advogado Teste',
        email: 'adv@teste.com',
        role: 'Advogado',
        oab: '123456',
        oabState: 'SP',
        cpf: '000.000.000-00',
        address: 'Av. Paulista, 1000',
        notifyDeadlines: true,
        deadlineThresholdDays: 5
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('generates a procuration PDF with correct title and filename', () => {
        generateClientPDF('procuration', mockClient, mockSettings);

        const docInstance = vi.mocked(jsPDF).mock.results[0].value;

        // Check if title 'PROCURAÇÃO' was written
        expect(jsPDF.prototype.text).toHaveBeenCalledWith(
            'PROCURAÇÃO',
            expect.any(Number),
            expect.any(Number),
            expect.objectContaining({ align: 'center' })
        );

        // Check if save was called with the correct filename pattern
        expect(jsPDF.prototype.save).toHaveBeenCalledWith(expect.stringContaining('PROCURACAO_Cliente_Teste.pdf'));
    });

    it('generates a contract PDF with correct title', () => {
        generateClientPDF('contract', mockClient, mockSettings);

        expect(jsPDF.prototype.text).toHaveBeenCalledWith(
            'CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS',
            expect.any(Number),
            expect.any(Number),
            expect.objectContaining({ align: 'center' })
        );

        expect(jsPDF.prototype.save).toHaveBeenCalledWith(expect.stringContaining('CONTRATO_HONORARIOS_Cliente_Teste.pdf'));
    });

    it('sets correct brand colors (Luxury Black & Gold)', () => {
        generateClientPDF('declaration', mockClient, mockSettings);

        // Header Background (Slate-900 / 15, 23, 42)
        expect(jsPDF.prototype.setFillColor).toHaveBeenCalledWith(15, 23, 42);

        // Gold line (Amber-500ish / 245, 158, 11)
        expect(jsPDF.prototype.setFillColor).toHaveBeenCalledWith(245, 158, 11);
    });
});
