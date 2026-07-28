import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppTemplate } from '@/lib/services/whatsappService'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { phone, templateName, languageCode, components, invoiceId } = body

        if (!phone || !templateName) {
            return NextResponse.json(
                { error: 'phone and templateName parameters are required' },
                { status: 400 }
            )
        }

        const result = await sendWhatsAppTemplate({
            phone,
            templateName,
            languageCode,
            components,
        })

        // If sent successfully and invoiceId is provided, mark invoice as sent
        if (result.success && invoiceId) {
            try {
                const supabase = await createClient()
                await supabase
                    .from('invoices')
                    .update({ whatsapp_sent: true })
                    .eq('id', invoiceId)
            } catch (dbErr) {
                console.error('[WhatsApp Route] Failed to update invoice whatsapp_sent flag:', dbErr)
            }
        }

        return NextResponse.json(result)
    } catch (err: any) {
        console.error('[WhatsApp Route Exception]:', err)
        return NextResponse.json(
            { success: false, configured: true, error: err.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
