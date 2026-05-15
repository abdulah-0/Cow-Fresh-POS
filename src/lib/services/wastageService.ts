import { createClient } from '@/lib/supabase/client'

export interface WastageInput {
    item_id: number
    quantity: number
    reason: string
    wastage_date: string
    employee_id?: number
}

/**
 * Record product wastage
 */
export async function recordWastage(
    wastage: WastageInput,
    tenantId: string
): Promise<any> {
    const supabase = createClient()

    try {
        // 1. Create wastage record
        const { data, error } = await supabase
            .from('wastage')
            .insert({
                tenant_id: tenantId,
                item_id: wastage.item_id,
                quantity: wastage.quantity,
                reason: wastage.reason,
                wastage_date: wastage.wastage_date,
                employee_id: wastage.employee_id,
            })
            .select()
            .single()

        if (error) throw error

        // 2. Update inventory (subtract)
        // We need to find a location. For now, assume default location 1 or fetch from inventory.
        const { data: invData } = await supabase
            .from('inventory')
            .select('location_id, quantity')
            .eq('item_id', wastage.item_id)
            .limit(1)
            .single()

        if (invData) {
            await supabase
                .from('inventory')
                .update({ quantity: invData.quantity - wastage.quantity })
                .eq('item_id', wastage.item_id)
                .eq('location_id', invData.location_id)

            // 3. Create inventory transaction for audit
            await supabase.from('inventory_transactions').insert({
                tenant_id: tenantId,
                item_id: wastage.item_id,
                location_id: invData.location_id,
                quantity_change: -wastage.quantity,
                comment: `Wastage: ${wastage.reason}`,
                trans_date: new Date().toISOString(),
                user_id: (await supabase.auth.getUser()).data.user?.id
            })
        }

        return data
    } catch (error) {
        console.error('Error recording wastage:', error)
        throw error
    }
}

/**
 * Get wastage records
 */
export async function getWastage(tenantId: string): Promise<any[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('wastage')
            .select(`
                *,
                item:items(name, item_number)
            `)
            .eq('tenant_id', tenantId)
            .order('wastage_date', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting wastage:', error)
        return []
    }
}
