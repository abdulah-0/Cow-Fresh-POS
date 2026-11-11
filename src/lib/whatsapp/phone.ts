/**
 * phone.ts
 * Pakistani and E.164 phone number formatting and validation for Green API
 */

export function cleanPhone(raw: string | null | undefined): string {
    if (!raw) return ''
    return raw.replace(/[^\d+]/g, '').trim()
}

/**
 * Converts a phone number to Green API chat format (digits@c.us)
 * Handles Pakistani 03xx, +923xx, 923xx, and international numbers
 */
export function formatToWhatsAppChatId(phone: string, defaultCountry = '92'): string | null {
    let cleaned = cleanPhone(phone)
    if (!cleaned) return null

    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1)
    }

    // Convert local 03001234567 to 923001234567
    if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = defaultCountry + cleaned.substring(1)
    }

    // Minimum check for valid MSISDN length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return null
    }

    return `${cleaned}@c.us`
}

export function formatToE164Digits(phone: string, defaultCountry = '92'): string | null {
    const chatId = formatToWhatsAppChatId(phone, defaultCountry)
    if (!chatId) return null
    return chatId.replace('@c.us', '')
}
