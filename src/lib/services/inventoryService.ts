import { createClient } from '@/lib/supabase/client'

export interface StockAdjustment {
    itemId: number
    locationId: number
    quantity: number
    comment: string
    userId: string
}

export interface StockTransfer {
    itemId: number
    fromLocationId: number
    toLocationId: number
    quantity: number
    comment: string
    userId: string
}

/**
 * Adjust stock quantity (add or remove)
 */
export async function adjustStock(
    adjustment: StockAdjustment,
    tenantId: string
): Promise<void> {
    const supabase = createClient()

    try {
        // Update inventory
        const { data: currentQty } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('item_id', adjustment.itemId)
            .eq('location_id', adjustment.locationId)
            .single()

        const newQuantity = (currentQty?.quantity || 0) + adjustment.quantity

        const { error: qtyError } = await supabase
            .from('inventory')
            .upsert({
                item_id: adjustment.itemId,
                location_id: adjustment.locationId,
                quantity: newQuantity,
            })

        if (qtyError) throw qtyError

        // Create inventory transaction
        const { error: transError } = await supabase
            .from('inventory_transactions')
            .insert({
                tenant_id: tenantId,
                item_id: adjustment.itemId,
                user_id: adjustment.userId,
                location_id: adjustment.locationId,
                quantity_change: adjustment.quantity,
                comment: adjustment.comment,
                trans_date: new Date().toISOString(),
            })

        if (transError) throw transError
    } catch (error) {
        console.error('Error adjusting stock:', error)
        throw error
    }
}

/**
 * Transfer stock between locations
 */
export async function transferStock(
    transfer: StockTransfer,
    tenantId: string
): Promise<void> {
    const supabase = createClient()

    try {
        // Check source has enough stock
        const { data: sourceQty } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('item_id', transfer.itemId)
            .eq('location_id', transfer.fromLocationId)
            .single()

        if (!sourceQty || sourceQty.quantity < transfer.quantity) {
            throw new Error('Insufficient stock at source location')
        }

        // Decrease from source
        const { error: sourceError } = await supabase
            .from('inventory')
            .update({
                quantity: sourceQty.quantity - transfer.quantity,
            })
            .eq('item_id', transfer.itemId)
            .eq('location_id', transfer.fromLocationId)

        if (sourceError) throw sourceError

        // Increase at destination
        const { data: destQty } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('item_id', transfer.itemId)
            .eq('location_id', transfer.toLocationId)
            .single()

        const newDestQty = (destQty?.quantity || 0) + transfer.quantity

        const { error: destError } = await supabase
            .from('inventory')
            .upsert({
                item_id: transfer.itemId,
                location_id: transfer.toLocationId,
                quantity: newDestQty,
            })

        if (destError) throw destError

        // Create inventory transactions
        const transactions = [
            {
                tenant_id: tenantId,
                item_id: transfer.itemId,
                user_id: transfer.userId,
                location_id: transfer.fromLocationId,
                quantity_change: -transfer.quantity,
                comment: `Transfer to location ${transfer.toLocationId}: ${transfer.comment}`,
                trans_date: new Date().toISOString(),
            },
            {
                tenant_id: tenantId,
                item_id: transfer.itemId,
                user_id: transfer.userId,
                location_id: transfer.toLocationId,
                quantity_change: transfer.quantity,
                comment: `Transfer from location ${transfer.fromLocationId}: ${transfer.comment}`,
                trans_date: new Date().toISOString(),
            },
        ]

        const { error: transError } = await supabase
            .from('inventory_transactions')
            .insert(transactions)

        if (transError) throw transError
    } catch (error) {
        console.error('Error transferring stock:', error)
        throw error
    }
}

/**
 * Get stock level for item at location
 */
export async function getStockLevel(itemId: number, locationId: number): Promise<number> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('item_id', itemId)
            .eq('location_id', locationId)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data?.quantity || 0
    } catch (error) {
        console.error('Error getting stock level:', error)
        return 0
    }
}

/**
 * Get all inventory transactions for a tenant
 */
export async function getAllInventoryTransactions(
    tenantId: string,
    filters?: {
        itemId?: number
        locationId?: number
        dateRange?: { from: Date; to: Date }
    }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('inventory_transactions')
            .select(`
                *,
                item:items(name, item_number),
                user:employees(
                    person:people(first_name, last_name)
                ),
                location:stock_locations(location_name)
            `)
            .eq('tenant_id', tenantId)
            .order('trans_date', { ascending: false })

        if (filters?.itemId) {
            query = query.eq('item_id', filters.itemId)
        }
        if (filters?.locationId) {
            query = query.eq('location_id', filters.locationId)
        }
        if (filters?.dateRange) {
            query = query
                .gte('trans_date', filters.dateRange.from.toISOString())
                .lte('trans_date', filters.dateRange.to.toISOString())
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting all inventory transactions:', error)
        return []
    }
}

/**
 * Get all stock locations
 */
export async function getStockLocations(tenantId: string): Promise<any[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('stock_locations')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .order('location_name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting stock locations:', error)
        return []
    }
}

/**
 * Create stock location
 */
export async function createStockLocation(
    tenantId: string,
    locationName: string
): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('stock_locations')
            .insert({
                tenant_id: tenantId,
                location_name: locationName,
                deleted: false,
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating stock location:', error)
        throw error
    }
}

/**
 * Delete stock location
 */
export async function deleteStockLocation(locationId: number): Promise<void> {
    const supabase = createClient()

    try {
        // Check if location has stock
        const { data: hasStock } = await supabase
            .from('inventory')
            .select('id')
            .eq('location_id', locationId)
            .gt('quantity', 0)
            .limit(1)

        if (hasStock && hasStock.length > 0) {
            throw new Error('Cannot delete location with stock. Transfer stock first.')
        }

        const { error } = await supabase
            .from('stock_locations')
            .update({ deleted: true })
            .eq('id', locationId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting stock location:', error)
        throw error
    }
}
