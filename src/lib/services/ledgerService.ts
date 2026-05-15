import { createClient } from '@/lib/supabase/client'

export interface LedgerEntry {
    id: number
    tenant_id: string
    supplier_id?: number
    customer_id?: number
    transaction_time: string
    transaction_type: 'credit' | 'payment' | 'adjustment' | 'advance'
    amount: number
    description: string
    payment_method?: string
    reference_id?: number
    reference_type?: string
    created_at: string
}

export interface LedgerSummary {
    totalCredit: number
    totalPayment: number
    balance: number
}

/**
 * Supplier Ledger Services
 */

export async function getSupplierLedger(tenantId: string, supplierId: number): Promise<LedgerEntry[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('supplier_ledger_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('supplier_id', supplierId)
        .order('transaction_time', { ascending: true })

    if (error) throw error
    return data || []
}

export async function addSupplierLedgerEntry(entry: Partial<LedgerEntry>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('supplier_ledger_entries')
        .insert([entry])
        .select()
        .single()

    if (error) throw error
    return data
}

export function calculateLedgerSummary(entries: LedgerEntry[]): LedgerSummary {
    const totalCredit = entries
        .filter(e => e.transaction_type === 'credit')
        .reduce((sum, e) => sum + Number(e.amount), 0)
    
    const totalPayment = entries
        .filter(e => e.transaction_type === 'payment' || e.transaction_type === 'advance')
        .reduce((sum, e) => sum + Number(e.amount), 0)

    return {
        totalCredit,
        totalPayment,
        balance: totalCredit - totalPayment
    }
}

/**
 * Customer Ledger Services
 */

export async function getCustomerLedger(tenantId: string, customerId: number): Promise<LedgerEntry[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('customer_ledger_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('customer_id', customerId)
        .order('transaction_time', { ascending: true })

    if (error) throw error
    return data || []
}

export async function addCustomerLedgerEntry(entry: Partial<LedgerEntry>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('customer_ledger_entries')
        .insert([entry])
        .select()
        .single()

    if (error) throw error
    return data
}
