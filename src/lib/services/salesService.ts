import { createClient } from '@/lib/supabase/client'
import { Cart, Sale, Payment, DiscountType } from '@/types'
import { ensureUniqueInvoiceNumber } from '@/lib/invoiceUtils'

/**
 * Complete a sale transaction
 * This creates the sale record, sale items, payments, and updates inventory
 */
export async function completeSale(
    cart: Cart,
    tenantId: string,
    employeeId: number
): Promise<Sale> {
    const supabase = createClient()

    try {
        // Generate unique invoice number
        const invoiceNumber = await ensureUniqueInvoiceNumber(tenantId)

        // Calculate items subtotal
        const itemsSubtotal = cart.items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity
            const discount = item.discount_type === 'percent'
                ? itemTotal * (item.discount / 100)
                : item.discount
            return sum + (itemTotal - discount)
        }, 0)

        // Apply global discount
        const globalDiscountAmount = cart.discount_type === 'percent'
            ? itemsSubtotal * (cart.discount / 100)
            : cart.discount
        
        const subtotal = Math.max(0, itemsSubtotal - globalDiscountAmount)
        const total = subtotal

        // Create sale record
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
                tenant_id: tenantId,
                customer_id: cart.customer?.id || null,
                employee_id: employeeId,
                comment: cart.comment || '',
                invoice_number: invoiceNumber,
                sale_status: 'completed',
                sale_total: total,
                tax: 0,
                discount_amount: globalDiscountAmount,
                discount_type: cart.discount_type,
                sale_time: new Date().toISOString(),
            })
            .select()
            .single()

        if (saleError) throw saleError

        // Create sale items
        const saleItems = cart.items.map((item, index) => ({
            sale_id: sale.id,
            item_id: item.item_id,
            description: item.description || null,
            serialnumber: item.serialnumber || null,
            line: index + 1,
            quantity: item.quantity,
            item_cost_price: item.cost_price,
            item_unit_price: item.price,
            discount_percent: item.discount_type === 'percent' ? item.discount : 0,
        }))

        const { error: itemsError } = await supabase
            .from('sales_items')
            .insert(saleItems)

        if (itemsError) throw itemsError

        // Create payment records
        const { error: paymentsError } = await supabase
            .from('sales_payments')
            .insert(
                cart.payments.map((payment) => ({
                    sale_id: sale.id,
                    payment_type: payment.payment_type,
                    payment_amount: payment.payment_amount,
                }))
            )

        if (paymentsError) throw paymentsError

        // Create Customer Ledger Entry
        if (cart.customer?.id) {
            // 1. Record the sale as a credit (amount customer owes)
            await supabase.from('customer_ledger_entries').insert({
                tenant_id: tenantId,
                customer_id: cart.customer.id,
                transaction_type: 'credit',
                amount: total,
                description: `Sale Invoice #${invoiceNumber}`,
                reference_id: sale.id,
                reference_type: 'sale',
                transaction_time: new Date().toISOString()
            })

            // 2. Record each payment made
            for (const payment of cart.payments) {
                if (payment.payment_amount > 0) {
                    await supabase.from('customer_ledger_entries').insert({
                        tenant_id: tenantId,
                        customer_id: cart.customer.id,
                        transaction_type: 'payment',
                        amount: payment.payment_amount,
                        description: `Payment for Sale Invoice #${invoiceNumber}`,
                        payment_method: payment.payment_type,
                        reference_id: sale.id,
                        reference_type: 'sale',
                        transaction_time: new Date().toISOString()
                    })
                }
            }
        }

        // Update inventory quantities
        for (const item of cart.items) {
            // Get current inventory
            const { data: currentInv } = await supabase
                .from('inventory')
                .select('quantity')
                .eq('item_id', item.item_id)
                .eq('location_id', item.item_location)
                .maybeSingle()

            if (currentInv) {
                // Update inventory
                const { error: invError } = await supabase
                    .from('inventory')
                    .update({ quantity: currentInv.quantity - item.quantity })
                    .eq('item_id', item.item_id)
                    .eq('location_id', item.item_location)

                if (invError) {
                    console.error('Error updating inventory:', invError)
                }
            }

            // Create inventory transaction for audit
            await supabase.from('inventory_transactions').insert({
                item_id: item.item_id,
                location_id: item.item_location,
                quantity: -item.quantity,
                transaction_type: 'sale',
                reference_id: sale.id,
                reference_type: 'sale',
                employee_id: employeeId,
                comment: `Sale #${invoiceNumber}`,
            })
        }

        return sale as Sale
    } catch (error) {
        console.error('Error completing sale:', error)
        throw error
    }
}

/**
 * Suspend a sale for later completion
 */
export async function suspendSale(
    cart: Cart,
    tenantId: string,
    employeeId: number
): Promise<number> {
    const supabase = createClient()

    try {
        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity
            const discount = item.discount_type === 'percent'
                ? itemTotal * (item.discount / 100)
                : item.discount
            return sum + (itemTotal - discount)
        }, 0)

        const total = subtotal

        // Create sale record with suspended status
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
                tenant_id: tenantId,
                customer_id: cart.customer?.id || null,
                employee_id: employeeId,
                comment: cart.comment || 'SUSPENDED',
                sale_status: 'suspended',
                sale_total: total,
                tax: 0,
                discount_amount: cart.discount,
                discount_type: cart.discount_type,
                sale_time: new Date().toISOString(),
            })
            .select()
            .single()

        if (saleError) throw saleError

        // Create sale items
        const saleItems = cart.items.map((item, index) => ({
            sale_id: sale.id,
            item_id: item.item_id,
            description: item.description || null,
            serialnumber: item.serialnumber || null,
            line: index + 1,
            quantity: item.quantity,
            item_cost_price: item.cost_price,
            item_unit_price: item.price,
            discount_percent: item.discount_type === 'percent' ? item.discount : 0,
        }))

        const { error: itemsError } = await supabase
            .from('sales_items')
            .insert(saleItems)

        if (itemsError) throw itemsError

        return sale.id
    } catch (error) {
        console.error('Error suspending sale:', error)
        throw error
    }
}

/**
 * Load a suspended sale
 */
export async function loadSuspendedSale(saleId: number): Promise<Cart | null> {
    const supabase = createClient()

    try {
        const { data: sale, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items (*),
                customer:customers (*)
            `)
            .eq('id', saleId)
            .eq('sale_status', 'suspended')
            .single()

        if (error) throw error
        if (!sale) return null

        // Convert to cart format
        const cart: Cart = {
            items: (sale.sales_items || []).map((item: any) => ({
                item_id: item.item_id,
                name: '', // Will need to fetch item details
                item_number: '',
                description: item.description,
                price: item.item_unit_price,
                cost_price: item.item_cost_price,
                quantity: item.quantity_purchased,
                discount: item.discount_percent,
                discount_type: 'percent' as const,
                serialnumber: item.serialnumber || '',
                is_serialized: false,
                allow_alt_description: false,
                item_location: 1,
            })),
            customer: sale.customer || undefined,
            payments: [],
            comment: sale.comment,
            mode: 'sale',
            discount: sale.discount_amount || 0,
            discount_type: sale.discount_type as DiscountType || 'percent',
        }

        return cart
    } catch (error) {
        console.error('Error loading suspended sale:', error)
        return null
    }
}

/**
 * Void a completed sale
 */
export async function voidSale(saleId: number): Promise<void> {
    const supabase = createClient()

    try {
        // Update sale status
        const { error } = await supabase
            .from('sales')
            .update({ sale_status: 'cancelled' })
            .eq('id', saleId)

        if (error) throw error

        // TODO: Restore inventory quantities
    } catch (error) {
        console.error('Error voiding sale:', error)
        throw error
    }
}

/**
 * Get all sales for a tenant
 */
export async function getSales(tenantId: string, filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
}): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('sales')
            .select(`
                *,
                customer:customers(
                    *,
                    person:people(*)
                ),
                items:sales_items(
                    *,
                    item:items(name)
                ),
                payments:sales_payments(*),
                employee:employees(
                    *,
                    person:people(*)
                )
            `)
            .eq('tenant_id', tenantId)
            .order('sale_time', { ascending: false })

        // Apply filters
        if (filters?.status) {
            query = query.eq('sale_status', filters.status)
        }
        if (filters?.dateFrom) {
            query = query.gte('sale_time', filters.dateFrom)
        }
        if (filters?.dateTo) {
            query = query.lte('sale_time', filters.dateTo)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching sales:', error)
        throw error
    }
}
