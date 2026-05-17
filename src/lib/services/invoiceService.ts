import { createClient } from '@/lib/supabase/client'
import type { Invoice, InvoicePaymentStatus } from '@/types'

/**
 * Generate (or refresh) a monthly invoice for a customer.
 * Aggregates all deliveries for the given billing month.
 * Uses upsert so re-running is safe.
 *
 * @param customerId  - customer ID
 * @param billingMonth - first day of the month, e.g. "2026-05-01"
 */
export async function generateInvoice(
    customerId: number,
    billingMonth: string
): Promise<Invoice> {
    const supabase = createClient()

    // 1. Calculate start and end of billing month
    const start = billingMonth // e.g. "2026-05-01"
    const end = new Date(new Date(billingMonth).getFullYear(), new Date(billingMonth).getMonth() + 1, 0)
        .toISOString()
        .split('T')[0] // last day of month

    // 2. Fetch all delivered deliveries for this customer in this month
    const { data: deliveries, error: delErr } = await supabase
        .from('deliveries')
        .select('id, total_amount, delivery_status')
        .eq('customer_id', customerId)
        .eq('delivery_status', 'delivered')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)

    if (delErr) throw delErr

    const totalDeliveries = deliveries?.length ?? 0
    const totalAmount = (deliveries || []).reduce((s: number, d: any) => s + (d.total_amount || 0), 0)

    // 3. Upsert the invoice record
    const { data, error } = await supabase
        .from('invoices')
        .upsert(
            {
                customer_id: customerId,
                billing_month: billingMonth,
                total_deliveries: totalDeliveries,
                total_amount: totalAmount,
                payment_status: 'unpaid',
                whatsapp_sent: false,
                generated_at: new Date().toISOString(),
            },
            { onConflict: 'customer_id,billing_month', ignoreDuplicates: false }
        )
        .select()
        .single()

    if (error) throw error
    return data as Invoice
}

/**
 * Get all invoices, optionally filtered by payment status or billing month.
 */
export async function getInvoices(filters?: {
    payment_status?: InvoicePaymentStatus
    billing_month?: string
    customer_id?: number
}): Promise<any[]> {
    const supabase = createClient()
    try {
        let query = supabase
            .from('invoices')
            .select(`
                *,
                customer:customers(
                    id,
                    company_name,
                    person:people(first_name, last_name, phone_number, email),
                    zone:zones(zone_name)
                )
            `)
            .order('billing_month', { ascending: false })
            .order('generated_at', { ascending: false })

        if (filters?.payment_status) {
            query = query.eq('payment_status', filters.payment_status)
        }
        if (filters?.billing_month) {
            query = query.eq('billing_month', filters.billing_month)
        }
        if (filters?.customer_id) {
            query = query.eq('customer_id', filters.customer_id)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return []
    }
}

/**
 * Update the payment status of an invoice.
 */
export async function updateInvoicePaymentStatus(
    invoiceId: number,
    status: InvoicePaymentStatus
): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('invoices')
            .update({ payment_status: status })
            .eq('id', invoiceId)

        if (error) throw error
    } catch (error) {
        console.error('Error updating payment status:', error)
        throw error
    }
}

/**
 * Mark an invoice as WhatsApp-sent.
 */
export async function markInvoiceWhatsappSent(invoiceId: number): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('invoices')
            .update({ whatsapp_sent: true })
            .eq('id', invoiceId)

        if (error) throw error
    } catch (error) {
        console.error('Error marking whatsapp sent:', error)
        throw error
    }
}

/**
 * Generate invoices for ALL customers who have deliveries in a given month.
 * Returns a summary of how many were created/updated.
 */
export async function generateBulkInvoices(billingMonth: string): Promise<{
    created: number
    errors: number
}> {
    const supabase = createClient()

    const start = billingMonth
    const end = new Date(
        new Date(billingMonth).getFullYear(),
        new Date(billingMonth).getMonth() + 1, 0
    ).toISOString().split('T')[0]

    // Get distinct customers with deliveries this month
    const { data: deliveries, error } = await supabase
        .from('deliveries')
        .select('customer_id')
        .eq('delivery_status', 'delivered')
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)

    if (error) throw error

    const uniqueCustomerIds = [...new Set((deliveries || []).map((d: any) => d.customer_id))]

    let created = 0, errors = 0
    for (const cid of uniqueCustomerIds) {
        try {
            await generateInvoice(cid, billingMonth)
            created++
        } catch {
            errors++
        }
    }

    return { created, errors }
}

/**
 * Get available billing months (months with at least one invoice).
 */
export async function getAvailableBillingMonths(): Promise<string[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('billing_month')
            .order('billing_month', { ascending: false })

        if (error) throw error
        const months = [...new Set((data || []).map((r: any) => r.billing_month))]
        return months
    } catch {
        return []
    }
}

/**
 * Format a billing_month string to a human-readable label.
 * e.g. "2026-05-01" → "May 2026"
 */
export function formatBillingMonth(billingMonth: string): string {
    const d = new Date(billingMonth + 'T12:00:00')
    return d.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
}

/**
 * Get the first day of the current month as a billing month string.
 */
export function getCurrentBillingMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Get the first day of the previous month.
 */
export function getPreviousBillingMonth(): string {
    const now = new Date()
    now.setMonth(now.getMonth() - 1)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * Build a printable invoice HTML string for browser printing.
 */
export function buildInvoiceHTML(invoice: any): string {
    const customer = invoice.customer
    const personName = customer?.person
        ? `${customer.person.first_name} ${customer.person.last_name}`
        : 'Customer'
    const zone = customer?.zone?.zone_name || '—'
    const month = formatBillingMonth(invoice.billing_month)
    const amount = Number(invoice.total_amount || 0).toLocaleString('en-PK')
    const generated = new Date(invoice.generated_at).toLocaleDateString('en-PK', {
        day: '2-digit', month: 'long', year: 'numeric',
    })

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice — ${personName} — ${month}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 640px; margin: 40px auto; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #6d28d9; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #6d28d9; margin: 0; }
    .header p { font-size: 12px; color: #555; margin: 2px 0; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .invoice-meta div { font-size: 13px; }
    .invoice-meta .label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .total-row { font-weight: bold; font-size: 16px; }
    .total-row td { border-top: 2px solid #6d28d9; }
    .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-unpaid { background: #fee2e2; color: #991b1b; }
    .badge-paid { background: #dcfce7; color: #15803d; }
    .badge-partial { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cow Fresh Dairy</h1>
    <p>Plaza # 86 E-1 Commercial Phase 8, Bahria Town, Rawalpindi</p>
    <p>Number: 0331 0377703 | cowfreshdairy@gmail.com</p>
  </div>

  <div class="invoice-meta">
    <div>
      <div class="label">Bill To</div>
      <div><strong>${personName}</strong></div>
      ${customer?.company_name ? `<div>${customer.company_name}</div>` : ''}
      ${customer?.person?.phone_number ? `<div>${customer.person.phone_number}</div>` : ''}
      ${customer?.person?.email ? `<div>${customer.person.email}</div>` : ''}
      <div>Zone: ${zone}</div>
    </div>
    <div style="text-align:right">
      <div class="label">Invoice</div>
      <div><strong>#INV-${String(invoice.id).padStart(5, '0')}</strong></div>
      <div class="label" style="margin-top:8px">Billing Period</div>
      <div><strong>${month}</strong></div>
      <div class="label" style="margin-top:8px">Generated</div>
      <div>${generated}</div>
      <div style="margin-top:8px">
        <span class="badge badge-${invoice.payment_status}">${invoice.payment_status.toUpperCase()}</span>
      </div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>Milk Deliveries — ${month}<br/><small style="color:#888">${invoice.total_deliveries} delivery(ies)</small></td>
        <td style="text-align:right">Rs. ${amount}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td>Total Due</td>
        <td style="text-align:right">Rs. ${amount}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>Thank you for your business! | Cow Fresh Dairy Plaza, Bahria Town, Rawalpindi</p>
    <p>Please make payment within 7 days. For queries: 0331 0377703</p>
  </div>
</body>
</html>
`
}
