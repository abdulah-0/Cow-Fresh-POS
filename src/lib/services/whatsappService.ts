/**
 * whatsappService.ts
 * Server-only service for sending official WhatsApp notifications via Meta WhatsApp Business Cloud API.
 * Uses permanent access token and phone number ID from environment variables.
 */

export interface WhatsAppTemplateParams {
    phone: string
    templateName: string
    languageCode?: string
    components?: any[]
}

export interface WhatsAppResult {
    success: boolean
    configured: boolean
    messageId?: string
    error?: string
    details?: any
}

/**
 * Sends an approved Meta WhatsApp Cloud API template message.
 * Safe fallback if WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID are unconfigured.
 */
export async function sendWhatsAppTemplate({
    phone,
    templateName,
    languageCode = 'en',
    components = [],
}: WhatsAppTemplateParams): Promise<WhatsAppResult> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId || token.trim() === '' || phoneId.trim() === '') {
        console.warn('[WhatsApp Cloud API] Credentials missing in .env (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID)')
        return {
            success: false,
            configured: false,
            error: 'Meta WhatsApp Cloud API credentials not configured in environment',
        }
    }

    // Clean phone number (format: 923001234567, strip non-digits)
    const cleanedPhone = phone.replace(/\D/g, '')
    if (!cleanedPhone || cleanedPhone.length < 7) {
        return {
            success: false,
            configured: true,
            error: 'Invalid recipient phone number format',
        }
    }

    try {
        const url = `https://graph.facebook.com/v20.0/${phoneId.trim()}/messages`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanedPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components,
                },
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            const errorMsg = data?.error?.message || `Meta Cloud API returned status ${response.status}`
            console.error('[WhatsApp Cloud API Error]:', errorMsg, data)
            return {
                success: false,
                configured: true,
                error: errorMsg,
                details: data,
            }
        }

        return {
            success: true,
            configured: true,
            messageId: data?.messages?.[0]?.id,
        }
    } catch (err: any) {
        console.error('[WhatsApp Cloud API Exception]:', err)
        return {
            success: false,
            configured: true,
            error: err.message || 'Network failure communicating with Meta WhatsApp API',
        }
    }
}
