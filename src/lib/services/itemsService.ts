import { createClient } from '@/lib/supabase/client'

export interface ItemInput {
    name: string
    item_number?: string
    description?: string
    category?: string
    supplier_id?: number
    cost_price: number
    unit_price: number
    reorder_level?: number
    allow_alt_description?: boolean
    is_serialized?: boolean
    custom1?: string
    custom2?: string
    custom3?: string
    custom4?: string
    custom5?: string
    custom6?: string
    custom7?: string
    custom8?: string
    custom9?: string
    custom10?: string
}

export interface ItemFilters {
    search?: string
    category?: string
    supplier_id?: number
    low_stock?: boolean
    page?: number
    pageSize?: number
    paginated?: boolean
}

/**
 * Generate unique item number
 * Format: ITEM-XXXXXX (6 digits)
 */
export async function generateItemNumber(tenantId: string): Promise<string> {
    const supabase = createClient()

    // Get count of items for this tenant
    const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    const itemCount = (count || 0) + 1
    const itemNumber = `ITEM-${itemCount.toString().padStart(6, '0')}`

    // Verify uniqueness
    const { data: existing } = await supabase
        .from('items')
        .select('id')
        .eq('item_number', itemNumber)
        .single()

    if (existing) {
        // If exists, add random suffix
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `${itemNumber}-${randomSuffix}`
    }

    return itemNumber
}

/**
 * Create a new item
 */
export async function createItem(
    item: ItemInput,
    tenantId: string,
    initialStock?: number,
    locationId?: number
): Promise<any> {
    const supabase = createClient()

    try {
        // Generate item number if not provided
        const itemNumber = item.item_number || await generateItemNumber(tenantId)

        const { data, error } = await supabase
            .from('items')
            .insert({
                tenant_id: tenantId,
                name: item.name,
                item_number: itemNumber,
                description: item.description,
                category: item.category,
                supplier_id: item.supplier_id,
                cost_price: item.cost_price,
                unit_price: item.unit_price,
                reorder_level: item.reorder_level || 0,
                allow_alt_description: item.allow_alt_description || false,
                is_serialized: item.is_serialized || false,
                custom1: item.custom1,
                custom2: item.custom2,
                custom3: item.custom3,
                custom4: item.custom4,
                custom5: item.custom5,
                custom6: item.custom6,
                custom7: item.custom7,
                custom8: item.custom8,
                custom9: item.custom9,
                custom10: item.custom10,
            })
            .select()
            .single()

        if (error) throw error

        // Create initial inventory record if stock quantity provided
        if (data && initialStock && initialStock > 0 && locationId) {
            const { error: invError } = await supabase
                .from('inventory')
                .insert({
                    item_id: data.id,
                    location_id: locationId,
                    quantity: initialStock,
                })

            if (invError) {
                console.error('Error creating initial inventory:', invError)
                // Don't throw - item was created successfully
            }
        }

        return data
    } catch (error) {
        console.error('Error creating item:', error)
        throw error
    }
}

/**
 * Update an existing item
 */
export async function updateItem(itemId: number, item: Partial<ItemInput>): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('items')
            .update({
                name: item.name,
                item_number: item.item_number,
                description: item.description,
                category: item.category,
                supplier_id: item.supplier_id,
                cost_price: item.cost_price,
                unit_price: item.unit_price,
                reorder_level: item.reorder_level,
                allow_alt_description: item.allow_alt_description,
                is_serialized: item.is_serialized,
                custom1: item.custom1,
                custom2: item.custom2,
                custom3: item.custom3,
                custom4: item.custom4,
                custom5: item.custom5,
                custom6: item.custom6,
                custom7: item.custom7,
                custom8: item.custom8,
                custom9: item.custom9,
                custom10: item.custom10,
            })
            .eq('id', itemId)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating item:', error)
        throw error
    }
}

/**
 * Delete an item (soft delete)
 */
export async function deleteItem(itemId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('items')
            .update({ deleted: true })
            .eq('id', itemId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting item:', error)
        throw error
    }
}

/**
 * Get items with filters
 */
export async function getItems(tenantId: string, filters?: ItemFilters): Promise<any> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('items')
            .select('*', { count: filters?.paginated ? 'exact' : undefined })
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .order('name')

        // Apply filters
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,item_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
        }

        if (filters?.category) {
            query = query.eq('category', filters.category)
        }

        if (filters?.supplier_id) {
            query = query.eq('supplier_id', filters.supplier_id)
        }

        // Apply pagination
        if (filters?.paginated && filters.page !== undefined && filters.pageSize !== undefined) {
            const from = (filters.page - 1) * filters.pageSize
            const to = from + filters.pageSize - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        if (error) throw error

        // Fetch related data separately for each item
        const itemsWithStock = await Promise.all((data || []).map(async (item) => {
            // Fetch supplier if exists
            let supplier = null
            if (item.supplier_id) {
                const { data: supplierData } = await supabase
                    .from('suppliers')
                    .select('*, person:people(*)')
                    .eq('id', item.supplier_id)
                    .single()
                supplier = supplierData
            }

            // Fetch inventory data
            const { data: inventoryData } = await supabase
                .from('inventory')
                .select('quantity, location_id, stock_locations(location_name)')
                .eq('item_id', item.id)

            const totalStock = inventoryData?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0
            const isLowStock = totalStock <= (item.reorder_level || 0)

            return {
                ...item,
                supplier,
                inventory: inventoryData || [],
                stock_quantity: totalStock,
                is_low_stock: isLowStock,
            }
        }))

        let finalItems = itemsWithStock

        // Filter by low stock if requested
        if (filters?.low_stock) {
            finalItems = itemsWithStock.filter(item => item.is_low_stock)
        }

        if (filters?.paginated) {
            return {
                data: finalItems,
                count: count || 0
            }
        }

        return finalItems
    } catch (error) {
        console.error('Error getting items:', error)
        throw error
    }
}

/**
 * Get item by ID
 */
export async function getItemById(itemId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single()

        if (error) throw error

        // Fetch supplier if exists
        let supplier = null
        if (data.supplier_id) {
            const { data: supplierData } = await supabase
                .from('suppliers')
                .select('*, person:people(*)')
                .eq('id', data.supplier_id)
                .single()
            supplier = supplierData
        }

        // Fetch inventory data separately
        const { data: inventoryData } = await supabase
            .from('inventory')
            .select('quantity, location_id, stock_locations(location_name)')
            .eq('item_id', itemId)

        // Calculate total stock
        const totalStock = inventoryData?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0

        return {
            ...data,
            supplier,
            inventory: inventoryData || [],
            stock_quantity: totalStock,
            is_low_stock: totalStock <= (data.reorder_level || 0),
        }
    } catch (error) {
        console.error('Error getting item:', error)
        throw error
    }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(tenantId: string): Promise<any[]> {
    return getItems(tenantId, { low_stock: true })
}

/**
 * Get unique categories
 */
export async function getCategories(tenantId: string): Promise<string[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('items')
            .select('category')
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .not('category', 'is', null)

        if (error) throw error

        // Get unique categories
        const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))]
        return categories.sort()
    } catch (error) {
        console.error('Error getting categories:', error)
        return []
    }
}
