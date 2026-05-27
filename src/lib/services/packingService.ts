import { createClient } from '@/lib/supabase/client'
import { adjustStock } from './inventoryService'

export interface PackingProductInput {
    product_id: number
    quantity_produced: number
}

export interface PackingInput {
    date: string // YYYY-MM-DD
    total_milk_received: number
    total_milk_used: number
    remaining_milk: number
    products: PackingProductInput[]
}

/**
 * Get a single packing entry by date
 */
export async function getPackingEntryByDate(date: string): Promise<any | null> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('packing_entries')
            .select(`
                *,
                products:packing_products(
                    product_id,
                    quantity_produced,
                    product:items(id, name, unit_type, unit_price)
                )
            `)
            .eq('date', date)
            .maybeSingle()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching packing entry by date:', error)
        return null
    }
}

/**
 * Get all past packing entries chronologically
 */
export async function getPackingHistory(): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('packing_entries')
            .select(`
                *,
                products:packing_products(
                    product_id,
                    quantity_produced,
                    product:items(id, name, unit_type, unit_price)
                )
            `)
            .order('date', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching packing history:', error)
        return []
    }
}

/**
 * Create a new daily packing entry (automatically redirects to update if it exists)
 */
export async function createPackingEntry(input: PackingInput): Promise<any> {
    const supabase = createClient()
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id || 'system'

        // Check if there is already an entry for this date
        const existing = await getPackingEntryByDate(input.date)
        if (existing) {
            return await updatePackingEntry(existing.id, input)
        }

        // Insert new entry
        const { data: entry, error: entryError } = await supabase
            .from('packing_entries')
            .insert({
                date: input.date,
                total_milk_received: input.total_milk_received,
                total_milk_used: input.total_milk_used,
                remaining_milk: input.remaining_milk,
            })
            .select()
            .single()

        if (entryError) throw entryError

        // Insert packing products and update stock
        if (input.products && input.products.length > 0) {
            const productInserts = input.products.map(p => ({
                packing_entry_id: entry.id,
                product_id: p.product_id,
                quantity_produced: p.quantity_produced
            }))

            const { error: productsError } = await supabase
                .from('packing_products')
                .insert(productInserts)

            if (productsError) throw productsError

            // Adjust stock for each product: increment inventory at Main Store (location_id = 1)
            for (const p of input.products) {
                if (p.quantity_produced > 0) {
                    await adjustStock({
                        itemId: p.product_id,
                        locationId: 1, // Main Store
                        quantity: p.quantity_produced,
                        comment: `Daily packing entry production on ${input.date}`,
                        userId: userId
                    })
                }
            }
        }

        return entry
    } catch (error) {
        console.error('Error creating packing entry:', error)
        throw error
    }
}

/**
 * Update an existing packing entry and reconcile stock differences
 */
export async function updatePackingEntry(entryId: string, input: PackingInput): Promise<any> {
    const supabase = createClient()
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id || 'system'

        // Fetch existing products to calculate difference
        const { data: existingProducts, error: fetchErr } = await supabase
            .from('packing_products')
            .select('*')
            .eq('packing_entry_id', entryId)

        if (fetchErr) throw fetchErr

        // Update packing entry totals
        const { data: entry, error: entryError } = await supabase
            .from('packing_entries')
            .update({
                total_milk_received: input.total_milk_received,
                total_milk_used: input.total_milk_used,
                remaining_milk: input.remaining_milk,
                updated_at: new Date().toISOString()
            })
            .eq('id', entryId)
            .select()
            .single()

        if (entryError) throw entryError

        // Process products and adjust inventory based on differentials
        const existingMap = new Map<number, number>()
        existingProducts?.forEach((p: any) => {
            existingMap.set(p.product_id, p.quantity_produced)
        })

        // Delete existing products for this entry from packing_products so we can re-insert
        const { error: deleteErr } = await supabase
            .from('packing_products')
            .delete()
            .eq('packing_entry_id', entryId)

        if (deleteErr) throw deleteErr

        // Insert new/updated products
        if (input.products && input.products.length > 0) {
            const productInserts = input.products.map(p => ({
                packing_entry_id: entryId,
                product_id: p.product_id,
                quantity_produced: p.quantity_produced
            }))

            const { error: productsError } = await supabase
                .from('packing_products')
                .insert(productInserts)

            if (productsError) throw productsError

            // Reconcile stock
            for (const p of input.products) {
                const oldQty = existingMap.get(p.product_id) || 0
                const diff = p.quantity_produced - oldQty
                if (diff !== 0) {
                    await adjustStock({
                        itemId: p.product_id,
                        locationId: 1, // Main Store
                        quantity: diff,
                        comment: `Reconcile daily packing entry production on ${input.date} (diff: ${diff > 0 ? '+' : ''}${diff})`,
                        userId: userId
                    })
                }
                existingMap.delete(p.product_id) // Mark as processed
            }
        }

        // For any old old products that were completely removed from the packing list, reverse their stock entirely
        for (const [prodId, oldQty] of existingMap.entries()) {
            if (oldQty > 0) {
                await adjustStock({
                    itemId: prodId,
                    locationId: 1, // Main Store
                    quantity: -oldQty,
                    comment: `Reverse packing production on ${input.date} due to product removal`,
                    userId: userId
                })
            }
        }

        return entry
    } catch (error) {
        console.error('Error updating packing entry:', error)
        throw error
    }
}
