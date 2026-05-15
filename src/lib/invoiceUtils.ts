import { createClient } from '@/lib/supabase/client'

/**
 * Generate a unique invoice number
 * Format: POS-YYYYMMDD-XXXX
 */
export async function generateInvoiceNumber(tenantId: string): Promise<string> {
    const supabase = createClient()

    // Get current date in YYYYMMDD format
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')

    // Get count of sales today for this tenant
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const { count } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('sale_time', startOfDay.toISOString())

    const dailyCounter = (count || 0) + 1
    const counterStr = dailyCounter.toString().padStart(4, '0')

    return `POS-${dateStr}-${counterStr}`
}

/**
 * Ensure invoice number is unique
 */
export async function ensureUniqueInvoiceNumber(tenantId: string): Promise<string> {
    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
        const invoiceNumber = await generateInvoiceNumber(tenantId)

        // Check if it exists
        const { data } = await supabase
            .from('sales')
            .select('id')
            .eq('invoice_number', invoiceNumber)
            .maybeSingle()

        if (!data) {
            return invoiceNumber
        }

        attempts++
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Fallback: add random suffix
    const invoiceNumber = await generateInvoiceNumber(tenantId)
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${invoiceNumber}-${randomSuffix}`
}
