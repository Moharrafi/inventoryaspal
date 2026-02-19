
/**
 * Formats a number as Indonesian Rupiah with abbreviations for large values.
 * e.g. 1.500.000 -> "Rp 1,5 Juta"
 *      2.500.000.000 -> "Rp 2,5 Miliar"
 */
export const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
        return `Rp ${(value / 1000000000).toFixed(1).replace('.', ',')} Miliar`;
    }
    if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(1).replace('.', ',')} Juta`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
};
