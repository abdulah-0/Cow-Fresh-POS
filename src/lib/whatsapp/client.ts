/**
 * client.ts
 * Cloud Green-API WhatsApp Client for Cow Fresh POS.
 * Directly communicates with Green-API Cloud (https://api.green-api.com).
 * Zero local Docker containers or background workers needed.
 */

import { formatToWhatsAppChatId } from './phone'

interface GreenApiConfig {
    idInstance: string
    apiTokenInstance: string
    apiUrl?: string
    enabled: boolean
}

export function getGreenApiConfig(): GreenApiConfig {
    const idInstance = process.env.GREEN_API_ID_INSTANCE || process.env.GREEN_API_INSTANCE_ID || ''
    const apiTokenInstance = process.env.GREEN_API_TOKEN_INSTANCE || process.env.GREEN_API_TOKEN || ''
    const apiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com'
    const enabled = process.env.WHATSAPP_ENABLED === 'true' && Boolean(idInstance && apiTokenInstance)

    return {
        idInstance,
        apiTokenInstance,
        apiUrl: apiUrl.replace(/\/$/, ''),
        enabled,
    }
}

/**
 * Send a WhatsApp text message through Green API Cloud
 */
export async function sendGreenApiText(
    phone: string,
    message: string
): Promise<{ success: boolean; idMessage?: string; error?: string }> {
    const config = getGreenApiConfig()

    if (!config.enabled) {
        return {
            success: false,
            error: 'WhatsApp integration is disabled or GREEN_API credentials not configured in .env',
        }
    }

    const chatId = formatToWhatsAppChatId(phone)
    if (!chatId) {
        return {
            success: false,
            error: `Invalid phone number format: "${phone}"`,
        }
    }

    const endpoint = `${config.apiUrl}/waInstance${config.idInstance}/sendMessage/${config.apiTokenInstance}`

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId,
                message,
            }),
        })

        if (!response.ok) {
            const errBody = await response.text()
            console.error('[Green API Error]', response.status, errBody)
            return {
                success: false,
                error: `Green-API HTTP ${response.status}: ${errBody}`,
            }
        }

        const data = await response.json()
        return {
            success: true,
            idMessage: data?.idMessage,
        }
    } catch (err: any) {
        console.error('[Green API Network Exception]', err)
        return {
            success: false,
            error: err?.message || 'Network error reaching Green-API cloud',
        }
    }
}

/**
 * Check instance state on Green-API (authorized / notAuthorized / sleepMode)
 */
export async function getGreenApiState(): Promise<{ stateInstance: string } | null> {
    const config = getGreenApiConfig()
    if (!config.idInstance || !config.apiTokenInstance) return null

    try {
        const endpoint = `${config.apiUrl}/waInstance${config.idInstance}/getStateInstance/${config.apiTokenInstance}`
        const res = await fetch(endpoint)
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}
