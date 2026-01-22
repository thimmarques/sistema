
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyShort, getInitials } from './format';

describe('format utils', () => {
    describe('formatCurrency', () => {
        it('should format numbers to BRL currency', () => {
            // Use clean string comparison to avoid issues with non-breaking spaces in currency format
            const result = formatCurrency(1234.56).replace(/\s/g, ' ');
            expect(result).toContain('R$');
            expect(result).toContain('1.234,56');
        });
    });

    describe('formatCurrencyShort', () => {
        it('should format numbers to BRL currency without decimals', () => {
            const result = formatCurrencyShort(1234.56).replace(/\s/g, ' ');
            expect(result).toContain('R$');
            expect(result).toContain('1.235'); // Rounded
        });
    });

    describe('getInitials', () => {
        it('should return initials from a name', () => {
            expect(getInitials('John Doe')).toBe('JD');
            expect(getInitials('Lex AI Intelligence')).toBe('LAI');
        });

        it('should handle single names', () => {
            expect(getInitials('Lex')).toBe('L');
        });

        it('should return empty string for empty input', () => {
            expect(getInitials('')).toBe('');
        });
    });
});
