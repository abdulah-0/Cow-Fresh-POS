import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/send'

/**
 * POST /api/whatsapp/send
 * Server API route for sending WhatsApp messages via Green API Cloud.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { kind, customerId, toPhone, payload } = body

        if (!kind) {
            return NextResponse.json(
                { success: false, error: 'Message "kind" is required (e.g. receipt, delivery_update)' },
                { status: 400 }
            )
        }

        const result = await sendWhatsAppMessage({
            kind,
            customerId: customerId ? Number(customerId) : undefined,
            toPhone,
            payload: payload || {},
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('WhatsApp Send Route Error:', error)
        return NextResponse.json(
            { success: false, error: error?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
