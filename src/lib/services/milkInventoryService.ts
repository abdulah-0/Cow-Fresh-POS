import { createClient } from '@/lib/supabase/client'
import type { MilkInventory } from '@/types'

export interface MilkInventoryInput {
    inventory_date: string // ISO date YYYY-MM-DD
    total_received: number
    total_pos_sold?: number
    total_rider_deliveries?: number
}

/**
 * Upsert a milk inventory record for a given date.
 * If a record for the date exists, it updates the quantities.
 */
export async function upsertMilkInventory(input: MilkInventoryInput): Promise<MilkInventory> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('milk_inventory')
            .upsert(
                {
                    inventory_date: input.inventory_date,
                    total_received: input.total_received,
                    total_pos_sold: input.total_pos_sold ?? 0,
                    total_rider_deliveries: input.total_rider_deliveries ?? 0,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'inventory_date', ignoreDuplicates: false }
            )
            .select()
            .single()

        if (error) throw error
        return data as MilkInventory
    } catch (error) {
        console.error('Error upserting milk inventory:', error)
        throw error
    }
}

/**
 * Get the milk inventory record for a specific date.
 * Returns null if no record exists for that date.
 */
export async function getMilkInventoryByDate(date: string): Promise<MilkInventory | null> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('milk_inventory')
            .select('*')
            .eq('inventory_date', date)
            .maybeSingle()

        if (error) throw error
        return data as MilkInventory | null
    } catch (error) {
        console.error('Error fetching milk inventory:', error)
        return null
    }
}

/**
 * Get milk inventory history for the last N days.
 */
export async function getMilkInventoryHistory(days: number = 30): Promise<MilkInventory[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('milk_inventory')
            .select('*')
            .order('inventory_date', { ascending: false })
            .limit(days)

        if (error) throw error
        return (data || []) as MilkInventory[]
    } catch (error) {
        console.error('Error fetching milk history:', error)
        return []
    }
}

/**
 * Update the POS sold quantity for a given date.
 * Called automatically when a sale is completed.
 */
export async function updatePosSold(date: string, quantityLiters: number): Promise<void> {
    const supabase = createClient()
    try {
        // Upsert to create if not exists, or increment pos sold
        const existing = await getMilkInventoryByDate(date)
        const currentSold = existing?.total_pos_sold ?? 0
        const currentReceived = existing?.total_received ?? 0
        const currentRider = existing?.total_rider_deliveries ?? 0

        await upsertMilkInventory({
            inventory_date: date,
            total_received: currentReceived,
            total_pos_sold: currentSold + quantityLiters,
            total_rider_deliveries: currentRider,
        })
    } catch (error) {
        console.error('Error updating POS sold milk:', error)
    }
}

/**
 * Update rider deliveries total for a given date.
 * Called when dispatch records are reconciled.
 */
export async function updateRiderDeliveries(date: string, quantityLiters: number): Promise<void> {
    const supabase = createClient()
    try {
        const existing = await getMilkInventoryByDate(date)
        const currentReceived = existing?.total_received ?? 0
        const currentSold = existing?.total_pos_sold ?? 0

        await upsertMilkInventory({
            inventory_date: date,
            total_received: currentReceived,
            total_pos_sold: currentSold,
            total_rider_deliveries: quantityLiters,
        })
    } catch (error) {
        console.error('Error updating rider deliveries milk:', error)
    }
}

/**
 * Get today's milk summary (or null if not entered yet).
 */
export async function getTodaysMilkSummary(): Promise<MilkInventory | null> {
    const today = new Date().toISOString().split('T')[0]
    return getMilkInventoryByDate(today)
}
