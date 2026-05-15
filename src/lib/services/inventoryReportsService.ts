import { createClient } from '@/lib/supabase/client'

/**
 * Get inventory valuation report
 */
export async function getInventoryValuation(tenantId: string): Promise<{
    totalValue: number
    itemCount: number
    items: Array<{ itemName: string; quantity: number; value: number }>
}> {
    const supabase = createClient()

    try {
        const { data: inventory, error } = await supabase
            .from('inventory')
            .select(`
                quantity,
                item:items(name, cost_price)
            `)
            .eq('item.tenant_id', tenantId)

        if (error) throw error

        let totalValue = 0
        const items = (inventory || []).map((inv: any) => {
            const value = inv.quantity * (inv.item?.cost_price || 0)
            totalValue += value
            return {
                itemName: inv.item?.name || 'Unknown',
                quantity: inv.quantity,
                value,
            }
        })

        return {
            totalValue,
            itemCount: items.length,
            items: items.sort((a, b) => b.value - a.value),
        }
    } catch (error) {
        console.error('Error getting inventory valuation:', error)
        return { totalValue: 0, itemCount: 0, items: [] }
    }
}

/**
 * Get stock movement report
 */
export async function getStockMovementReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{
    date: string
    itemName: string
    type: string
    quantity: number
    location: string
}>> {
    const supabase = createClient()

    try {
        const { data: transactions, error } = await supabase
            .from('inventory_transactions')
            .select(`
                *,
                item:items(name),
                location:stock_locations(location_name)
            `)
            .eq('item.tenant_id', tenantId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false })

        if (error) throw error

        return (transactions || []).map((t: any) => ({
            date: new Date(t.created_at).toLocaleDateString(),
            itemName: t.item?.name || 'Unknown',
            type: t.transaction_type,
            quantity: t.quantity,
            location: t.location?.location_name || 'Unknown',
        }))
    } catch (error) {
        console.error('Error getting stock movement report:', error)
        return []
    }
}

/**
 * Get inventory turnover
 */
export async function getInventoryTurnover(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{
    itemName: string
    sold: number
    avgStock: number
    turnoverRate: number
}>> {
    const supabase = createClient()

    try {
        // Get sales items
        const { data: salesItems, error: salesError } = await supabase
            .from('sales_items')
            .select(`
                item_id,
                quantity,
                item:items(name),
                sale:sales!inner(tenant_id, sale_time)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        if (salesError) throw salesError

        // Get current inventory
        const { data: inventory, error: invError } = await supabase
            .from('inventory')
            .select(`
                item_id,
                quantity,
                item:items(name)
            `)
            .eq('item.tenant_id', tenantId)

        if (invError) throw invError

        // Calculate turnover
        const itemMap = new Map()

        salesItems?.forEach((si: any) => {
            if (!itemMap.has(si.item_id)) {
                itemMap.set(si.item_id, {
                    itemName: si.item?.name || 'Unknown',
                    sold: 0,
                    avgStock: 0,
                })
            }
            itemMap.get(si.item_id).sold += si.quantity
        })

        inventory?.forEach((inv: any) => {
            if (itemMap.has(inv.item_id)) {
                itemMap.get(inv.item_id).avgStock = inv.quantity
            }
        })

        return Array.from(itemMap.values()).map(item => ({
            ...item,
            turnoverRate: item.avgStock > 0 ? item.sold / item.avgStock : 0,
        })).sort((a, b) => b.turnoverRate - a.turnoverRate)
    } catch (error) {
        console.error('Error getting inventory turnover:', error)
        return []
    }
}

/**
 * Get dead stock analysis
 */
export async function getDeadStockAnalysis(
    tenantId: string,
    daysSinceLastSale: number = 90
): Promise<Array<{
    itemName: string
    quantity: number
    lastSaleDate: string | null
    daysIdle: number
}>> {
    const supabase = createClient()

    try {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastSale)

        const { data: inventory, error } = await supabase
            .from('inventory')
            .select(`
                item_id,
                quantity,
                item:items(name)
            `)
            .eq('item.tenant_id', tenantId)
            .gt('quantity', 0)

        if (error) throw error

        const deadStock = []

        for (const inv of inventory || []) {
            const { data: lastSale } = await supabase
                .from('sales_items')
                .select(`
                    sale:sales(sale_time)
                `)
                .eq('item_id', inv.item_id)
                .order('sale.sale_time', { ascending: false })
                .limit(1)
                .single()

            const lastSaleDate = (lastSale?.sale as any)?.sale_time
            const daysIdle = lastSaleDate
                ? Math.floor((Date.now() - new Date(lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
                : 999

            if (daysIdle >= daysSinceLastSale) {
                deadStock.push({
                    itemName: (inv.item as any)?.name || 'Unknown',
                    quantity: inv.quantity,
                    lastSaleDate: lastSaleDate || null,
                    daysIdle,
                })
            }
        }

        return deadStock.sort((a, b) => b.daysIdle - a.daysIdle)
    } catch (error) {
        console.error('Error getting dead stock analysis:', error)
        return []
    }
}

/**
 * Get reorder suggestions
 */
export async function getReorderSuggestions(
    tenantId: string
): Promise<Array<{
    itemName: string
    currentStock: number
    reorderLevel: number
    suggestedOrder: number
}>> {
    const supabase = createClient()

    try {
        const { data: items, error } = await supabase
            .from('items')
            .select(`
                *,
                inventory(quantity)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)

        if (error) throw error

        return (items || [])
            .map((item: any) => {
                const currentStock = item.inventory?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0
                const reorderLevel = item.reorder_level || 10
                const suggestedOrder = reorderLevel * 2 - currentStock

                return {
                    itemName: item.name,
                    currentStock,
                    reorderLevel,
                    suggestedOrder: Math.max(suggestedOrder, 0),
                }
            })
            .filter(item => item.currentStock <= item.reorderLevel)
            .sort((a, b) => (a.currentStock / a.reorderLevel) - (b.currentStock / b.reorderLevel))
    } catch (error) {
        console.error('Error getting reorder suggestions:', error)
        return []
    }
}
