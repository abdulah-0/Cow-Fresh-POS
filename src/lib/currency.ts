/**
 * Format currency value in PKR (Pakistani Rupees)
 */
export function formatCurrency(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(value)) return 'Rs. 0.00'

    return `Rs. ${value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`
}

/**
 * Format currency for display without symbol
 */
export function formatCurrencyValue(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(value)) return '0.00'

    return value.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
    // Remove currency symbol and commas
    const cleaned = value.replace(/Rs\.?\s?|,/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
}
