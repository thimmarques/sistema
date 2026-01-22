
export const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export const formatCurrencyShort = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
};

export const getInitials = (n: string) => {
    if (!n) return '';
    return n.split(' ').filter(p => p.length > 0).map(part => part[0]).join('').substring(0, 3).toUpperCase();
};
