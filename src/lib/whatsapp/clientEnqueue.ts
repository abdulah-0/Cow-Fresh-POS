/**
 * clientEnqueue.ts
 * Browser-safe client helper to invoke the WhatsApp send API route.
 * Replaces old outbox worker polling with instant direct cloud dispatch.
 */

import { WhatsAppMessageKind, WhatsAppSendResult } from './types'

export interface ClientSendWhatsAppParams {
    kind: WhatsAppMessageKind
    customerId?: number
    toPhone?: string
    payload: Record<string, any>
}

export async function sendWhatsAppFromClient(
    params: ClientSendWhatsAppParams
): Promise<WhatsAppSendResult> {
    try {
        const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            return {
                success: false,
                error: err.error || `HTTP ${response.status}`,
            }
        }

        return await response.json()
    } catch (err: any) {
        return {
            success: false,
            error: err?.message || 'Network error sending WhatsApp message',
        }
    }
}

/**
 * Backward compatibility alias so existing calls work seamlessly
 */
export const enqueueWhatsAppFromClient = sendWhatsAppFromClient
