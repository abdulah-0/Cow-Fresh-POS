import { createClient } from '@/lib/supabase/client'
import type { RiderDispatch } from '@/types'

export interface DispatchInput {
    rider_id: number
    item_id: number
    dispatch_date: string // ISO date YYYY-MM-DD
    supplied_quantity: number
    returned_quantity: number
    picked_milk_packets?: number
    dropped_milk_packets?: number
    picked_yogurt_packets?: number
    dropped_yogurt_packets?: number
}

/**
 * Create or update a dispatch record for a rider + item + date.
 * Uses upsert so re-submitting the same day/rider/item just updates quantities.
 */
export async function upsertDispatch(input: DispatchInput): Promise<RiderDispatch> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('rider_dispatch')
            .upsert(
                {
                    rider_id: input.rider_id,
                    item_id: input.item_id,
                    dispatch_date: input.dispatch_date,
                    supplied_quantity: input.supplied_quantity,
                    returned_quantity: input.returned_quantity,
                    picked_milk_packets: input.picked_milk_packets || 0,
                    dropped_milk_packets: input.dropped_milk_packets || 0,
                    picked_yogurt_packets: input.picked_yogurt_packets || 0,
                    dropped_yogurt_packets: input.dropped_yogurt_packets || 0,
                },
                { onConflict: 'rider_id,item_id,dispatch_date', ignoreDuplicates: false }
            )
            .select()
            .single()

        if (error) throw error
        return data as RiderDispatch
    } catch (error) {
        console.error('Error upserting dispatch:', error)
        throw error
    }
}

/**
 * Get all dispatch records for a given date, joined with rider and item info.
 */
export async function getDispatchByDate(date: string): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('rider_dispatch')
            .select(`
                *,
                rider:employees(
                    id, username,
                    person:people(first_name, last_name)
                ),
                item:items(id, name, unit_type, unit_price)
            `)
            .eq('dispatch_date', date)
            .order('rider_id')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching dispatch by date:', error)
        return []
    }
}

/**
 * Get dispatch records for a specific rider on a given date.
 */
export async function getDispatchByRiderAndDate(riderId: number, date: string): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('rider_dispatch')
            .select(`
                *,
                item:items(id, name, unit_type, unit_price)
            `)
            .eq('rider_id', riderId)
            .eq('dispatch_date', date)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching rider dispatch:', error)
        return []
    }
}

/**
 * Update returned quantity for a dispatch record.
 */
export async function updateReturnedQuantity(
    dispatchId: number,
    returnedQuantity: number
): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('rider_dispatch')
            .update({
                returned_quantity: returnedQuantity,
                updated_at: new Date().toISOString(),
            })
            .eq('id', dispatchId)

        if (error) throw error
    } catch (error) {
        console.error('Error updating returned quantity:', error)
        throw error
    }
}

/**
 * Find a dispatch record by rider + item + date, then update only the returned/dropped fields.
 */
export async function recordReturns(
    riderId: number,
    itemId: number,
    dispatchDate: string,
    returnedQuantity: number,
    droppedMilkPackets: number = 0,
    droppedYogurtPackets: number = 0
): Promise<void> {
    const supabase = createClient()
    const { data: existing, error: findError } = await supabase
        .from('rider_dispatch')
        .select('id, supplied_quantity')
        .eq('rider_id', riderId)
        .eq('item_id', itemId)
        .eq('dispatch_date', dispatchDate)
        .maybeSingle()

    if (findError) throw findError

    if (existing) {
        const { error } = await supabase
            .from('rider_dispatch')
            .update({
                returned_quantity: returnedQuantity,
                dropped_milk_packets: droppedMilkPackets,
                dropped_yogurt_packets: droppedYogurtPackets,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

        if (error) throw error
    } else {
        const { error } = await supabase
            .from('rider_dispatch')
            .insert({
                rider_id: riderId,
                item_id: itemId,
                dispatch_date: dispatchDate,
                supplied_quantity: 0,
                returned_quantity: returnedQuantity,
                dropped_milk_packets: droppedMilkPackets,
                dropped_yogurt_packets: droppedYogurtPackets,
            })

        if (error) throw error
    }
}

/**
 * Update returned quantity and packets for a dispatch record.
 */
export async function updateReturnedQuantityAndPackets(
    dispatchId: number,
    returnedQuantity: number,
    droppedMilkPackets: number = 0,
    droppedYogurtPackets: number = 0
): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('rider_dispatch')
            .update({
                returned_quantity: returnedQuantity,
                dropped_milk_packets: droppedMilkPackets,
                dropped_yogurt_packets: droppedYogurtPackets,
                updated_at: new Date().toISOString(),
            })
            .eq('id', dispatchId)

        if (error) throw error
    } catch (error) {
        console.error('Error updating returned quantity and packets:', error)
        throw error
    }
}

/**
 * Get dispatch history for a rider across multiple dates.
 */
export async function getRiderDispatchHistory(
    riderId: number,
    limit: number = 30
): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('rider_dispatch')
            .select(`
                *,
                item:items(id, name, unit_type)
            `)
            .eq('rider_id', riderId)
            .order('dispatch_date', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching rider history:', error)
        return []
    }
}

/**
 * Get all available riders (employees with Rider role).
 */
export async function getRidersForDispatch(): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                id, username,
                person:people(first_name, last_name),
                role:roles(name)
            `)
            .eq('deleted', false)

        if (error) throw error
        // Include riders and admins/managers who might do dispatch
        return (data || []).filter((e: any) =>
            ['Rider', 'Admin', 'Manager', 'Cashier'].includes(e.role?.name)
        )
    } catch (error) {
        console.error('Error fetching riders:', error)
        return []
    }
}

/**
 * Get all active items for dispatch (dairy products).
 */
export async function getItemsForDispatch(): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('items')
            .select('id, name, unit_type, unit_price, category')
            .eq('deleted', false)
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching items for dispatch:', error)
        return []
    }
}
