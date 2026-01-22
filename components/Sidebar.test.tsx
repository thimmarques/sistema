
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';
import { AppSection } from '../types';
import React from 'react';

describe('Sidebar', () => {
    const mockOnSelectSection = vi.fn();

    it('renders all menu items', () => {
        render(
            <Sidebar
                activeSection={AppSection.DASHBOARD}
                onSelectSection={mockOnSelectSection}
            />
        );

        expect(screen.getByText(/Painel Geral/i)).toBeInTheDocument();
        expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
        expect(screen.getByText(/Gestão Financeira/i)).toBeInTheDocument();
        expect(screen.getByText(/Agenda Jurídica/i)).toBeInTheDocument();
        expect(screen.getByText(/Inteligência/i)).toBeInTheDocument();
    });

    it('calls onSelectSection when a menu item is clicked', () => {
        render(
            <Sidebar
                activeSection={AppSection.DASHBOARD}
                onSelectSection={mockOnSelectSection}
            />
        );

        fireEvent.click(screen.getByText(/Clientes/i));
        expect(mockOnSelectSection).toHaveBeenCalledWith(AppSection.CLIENTS);
    });

    it('highlights the active section', () => {
        render(
            <Sidebar
                activeSection={AppSection.FINANCES}
                onSelectSection={mockOnSelectSection}
            />
        );

        // The active item has unique styling (e.g., bg-white/10)
        const financeButton = screen.getByText(/Gestão Financeira/i).closest('button');
        expect(financeButton).toHaveClass('bg-white/10');
    });

    it('shows initials when logo is not provided', () => {
        render(
            <Sidebar
                activeSection={AppSection.DASHBOARD}
                onSelectSection={mockOnSelectSection}
                name="LexAI Intelligence"
            />
        );

        // getInitials('LexAI Intelligence') -> 'LI'
        expect(screen.getByText('LI')).toBeInTheDocument();
    });
});
