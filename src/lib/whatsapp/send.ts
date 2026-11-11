/**
 * send.ts
 * Unified server-side WhatsApp sender for Cow Fresh POS.
 * Resolves customer phone and opt-in from database when customerId is provided,
 * renders message from template, and dispatches via Green API.
 */

import { createClient } from '@/lib/supabase/client'
import { sendGreenApiText } from './client'
import { renderTemplateMessage } from './templates'
import { WhatsAppSendInput, WhatsAppSendResult } from './types'

export async function sendWhatsAppMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    const supabase = createClient()
    let destinationPhone = input.toPhone || ''
    let customerName = input.payload.customer_name || input.payload.customerName || ''

    // If customerId is provided, lookup their phone and opt-in status from DB
    if (input.customerId) {
        const { data: customer } = await supabase
            .from('customers')
            .select('whatsapp_phone, whatsapp_opt_in, person:people(first_name, last_name, phone_number)')
            .eq('id', input.customerId)
            .maybeSingle()

        if (customer) {
            if (customer.whatsapp_opt_in === false) {
                return {
                    success: false,
                    skippedReason: 'customer_not_opted_in',
                }
            }

            const p = Array.isArray(customer.person) ? customer.person[0] : customer.person
            destinationPhone = destinationPhone || customer.whatsapp_phone || p?.phone_number || ''
            if (!customerName && p) {
                customerName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
            }
        }
    }

    if (!destinationPhone) {
        return {
            success: false,
            error: 'No phone number available for customer',
        }
    }

    // Merge resolved customer name & phone into payload for template rendering
    const payload = {
        ...input.payload,
        customer_name: customerName || input.payload.customer_name,
        customer_phone: destinationPhone,
    }

    const messageText = renderTemplateMessage(input.kind, payload)
    const result = await sendGreenApiText(destinationPhone, messageText)

    // Optional: Log delivery attempt to whatsapp_events if the table exists
    try {
        await supabase.from('whatsapp_events').insert({
            event_type: `send_${input.kind}`,
            provider_message_id: result.idMessage || null,
            from_phone: 'green-api',
            body: messageText,
            raw: { result, kind: input.kind },
            dedupe_key: `greenapi_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        })
    } catch {
        // Non-blocking log failure
    }

    return result
}
