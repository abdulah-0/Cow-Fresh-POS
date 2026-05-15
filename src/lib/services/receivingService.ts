import { createClient } from '@/lib/supabase/client'

export interface ReceivingInput {
    supplier_id?: number
    reference?: string
    payment_type?: string
    comment?: string
    total_amount?: number
    items: ReceivingItemInput[]
}

export interface ReceivingItemInput {
    item_id: number
    description?: string
    quantity_purchased: number
    item_cost_price: number
    item_unit_price: number
    discount_percent: number
    item_location: number
}

/**
 * Create receiving and update stock
 */
export async function createReceiving(
    receiving: ReceivingInput,
    tenantId: string,
    employeeId: number
): Promise<any> {
    const supabase = createClient()

    try {
        // Create receiving record
        const { data: receivingRecord, error: receivingError } = await supabase
            .from('receivings')
            .insert({
                tenant_id: tenantId,
                supplier_id: receiving.supplier_id,
                employee_id: employeeId,
                comment: receiving.comment || '',
                payment_type: receiving.payment_type,
                reference: receiving.reference,
                total_amount: receiving.total_amount || 0,
                receiving_time: new Date().toISOString(),
            })
            .select()
            .single()

        if (receivingError) throw receivingError

        // Create Supplier Ledger Entry
        if (receiving.supplier_id) {
            const totalAmount = receiving.total_amount || 0
            
            // 1. Record the debt (Credit)
            await supabase.from('supplier_ledger_entries').insert({
                tenant_id: tenantId,
                supplier_id: receiving.supplier_id,
                transaction_type: 'credit',
                amount: totalAmount,
                description: `Stock Receiving #${receivingRecord.id}${receiving.reference ? ` (Ref: ${receiving.reference})` : ''}`,
                reference_id: receivingRecord.id,
                reference_type: 'receiving',
                transaction_time: new Date().toISOString()
            })

            // 2. If it was already paid (Cash/Card/Check), record the payment entry to clear balance
            if (receiving.payment_type && receiving.payment_type !== 'credit') {
                await supabase.from('supplier_ledger_entries').insert({
                    tenant_id: tenantId,
                    supplier_id: receiving.supplier_id,
                    transaction_type: 'payment',
                    amount: totalAmount,
                    description: `Payment for Receiving #${receivingRecord.id}`,
                    payment_method: receiving.payment_type,
                    reference_id: receivingRecord.id,
                    reference_type: 'receiving',
                    transaction_time: new Date().toISOString()
                })
            }
        }

        // Create receiving items
        const receivingItems = receiving.items.map((item, index) => ({
            receiving_id: receivingRecord.id,
            item_id: item.item_id,
            description: item.description,
            serialnumber: null,
            line: index + 1,
            quantity_purchased: item.quantity_purchased,
            item_cost_price: item.item_cost_price,
            item_unit_price: item.item_unit_price,
            discount_percent: item.discount_percent,
            item_location: item.item_location,
        }))

        const { error: itemsError } = await supabase
            .from('receivings_items')
            .insert(receivingItems)

        if (itemsError) throw itemsError

        // Update stock quantities
        for (const item of receiving.items) {
            // Get current quantity
            const { data: currentQty } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('item_id', item.item_id)
                .eq('location_id', item.item_location)
                .single()

            const newQuantity = (currentQty?.quantity || 0) + item.quantity_purchased

            // Update or insert quantity
            const { error: qtyError } = await supabase
                .from('inventory')
                .upsert({
                    item_id: item.item_id,
                    location_id: item.item_location,
                    quantity: newQuantity,
                })

            if (qtyError) throw qtyError

            // Create inventory transaction
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await supabase.from('inventory_transactions').insert({
                    tenant_id: tenantId,
                    item_id: item.item_id,
                    user_id: user.id,
                    location_id: item.item_location,
                    quantity_change: item.quantity_purchased,
                    comment: `Receiving #${receivingRecord.id}${receiving.reference ? ` - ${receiving.reference}` : ''}`,
                    trans_date: new Date().toISOString(),
                })
            }

            // Update item cost price if different
            if (item.item_cost_price) {
                await supabase
                    .from('items')
                    .update({ cost_price: item.item_cost_price })
                    .eq('id', item.item_id)
            }
        }

        return receivingRecord
    } catch (error) {
        console.error('Error creating receiving:', error)
        throw error
    }
}

/**
 * Get receivings with filters
 */
export async function getReceivings(
    tenantId: string,
    filters?: {
        supplier_id?: number
        dateFrom?: Date
        dateTo?: Date
    }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('receivings')
            .select(`
                *,
                supplier:suppliers(*),
                employee:employees(
                    person:people(first_name, last_name)
                ),
                receivings_items(*)
            `)
            .eq('tenant_id', tenantId)
            .order('receiving_time', { ascending: false })

        if (filters?.supplier_id) {
            query = query.eq('supplier_id', filters.supplier_id)
        }

        if (filters?.dateFrom) {
            query = query.gte('receiving_time', filters.dateFrom.toISOString())
        }

        if (filters?.dateTo) {
            query = query.lte('receiving_time', filters.dateTo.toISOString())
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting receivings:', error)
        return []
    }
}

/**
 * Get receiving by ID
 */
export async function getReceivingById(receivingId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('receivings')
            .select(`
                *,
                supplier:suppliers(*),
                employee:employees(
                    person:people(first_name, last_name)
                ),
                receivings_items(
                    *,
                    item:items(*)
                )
            `)
            .eq('id', receivingId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error getting receiving:', error)
        throw error
    }
}

/**
 * Get suppliers
 */
export async function getSuppliers(tenantId: string): Promise<any[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select(`
                *,
                person:people(*)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .order('company_name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting suppliers:', error)
        return []
    }
}
