import { createClient } from '@/lib/supabase/client'
import type { Zone } from '@/types'

export interface ZoneInput {
    zone_name: string
    description?: string
    assigned_rider_id?: number | null
}

/**
 * Get all active delivery zones, including their assigned rider and customers
 */
export async function getZones(): Promise<Zone[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('zones')
            .select(`
                *,
                rider:employees(
                    id, username,
                    person:people(first_name, last_name)
                ),
                customers(
                    id,
                    person:people(first_name, last_name, phone_number),
                    delivery_address, latitude, longitude
                )
            `)
            .eq('deleted', false)
            .order('zone_name', { ascending: true })

        if (error) throw error
        return (data || []) as Zone[]
    } catch (error) {
        console.error('Error fetching zones:', error)
        return []
    }
}

/**
 * Get a single zone by ID
 */
export async function getZoneById(zoneId: number): Promise<Zone | null> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('zones')
            .select(`
                *,
                rider:employees(
                    id, username,
                    person:people(first_name, last_name)
                ),
                customers(
                    id,
                    person:people(first_name, last_name, phone_number),
                    delivery_address, latitude, longitude
                )
            `)
            .eq('id', zoneId)
            .single()

        if (error) throw error
        return data as Zone
    } catch (error) {
        console.error('Error fetching zone:', error)
        return null
    }
}

/**
 * Create a new delivery zone
 */
export async function createZone(zone: ZoneInput): Promise<Zone> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('zones')
            .insert({
                zone_name: zone.zone_name,
                description: zone.description || null,
                assigned_rider_id: zone.assigned_rider_id || null,
                deleted: false,
            })
            .select()
            .single()

        if (error) throw error
        return data as Zone
    } catch (error) {
        console.error('Error creating zone:', error)
        throw error
    }
}

/**
 * Update an existing zone
 */
export async function updateZone(zoneId: number, zone: Partial<ZoneInput>): Promise<Zone> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('zones')
            .update({
                zone_name: zone.zone_name,
                description: zone.description,
                assigned_rider_id: zone.assigned_rider_id,
            })
            .eq('id', zoneId)
            .select()
            .single()

        if (error) throw error
        return data as Zone
    } catch (error) {
        console.error('Error updating zone:', error)
        throw error
    }
}

/**
 * Soft-delete a zone
 */
export async function deleteZone(zoneId: number): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('zones')
            .update({ deleted: true })
            .eq('id', zoneId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting zone:', error)
        throw error
    }
}

/**
 * Assign a customer to a zone (and optionally set their delivery address + coordinates)
 */
export async function assignCustomerToZone(
    customerId: number,
    zoneId: number | null,
    deliveryDetails?: {
        delivery_address?: string
        latitude?: number
        longitude?: number
    }
): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('customers')
            .update({
                zone_id: zoneId,
                delivery_address: deliveryDetails?.delivery_address,
                latitude: deliveryDetails?.latitude,
                longitude: deliveryDetails?.longitude,
            })
            .eq('id', customerId)

        if (error) throw error
    } catch (error) {
        console.error('Error assigning customer to zone:', error)
        throw error
    }
}

/**
 * Assign a rider (employee) to a zone
 */
export async function assignRiderToZone(zoneId: number, riderId: number | null): Promise<void> {
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('zones')
            .update({ assigned_rider_id: riderId })
            .eq('id', zoneId)

        if (error) throw error
    } catch (error) {
        console.error('Error assigning rider to zone:', error)
        throw error
    }
}

/**
 * Get customers not yet assigned to any zone (for assignment picker)
 */
export async function getUnzonedCustomers(): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('id, person:people(first_name, last_name, phone_number), delivery_address')
            .eq('deleted', false)
            .is('zone_id', null)
            .order('id', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching unzoned customers:', error)
        return []
    }
}

/**
 * Get employees with Rider role (for zone assignment)
 */
export async function getRiders(): Promise<any[]> {
    const supabase = createClient()
    try {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                id, username,
                person:people(first_name, last_name, phone_number),
                role:roles(name)
            `)
            .eq('deleted', false)
            .order('id', { ascending: false })

        if (error) throw error
        // Filter to Rider role (or allow all for flexibility)
        return (data || []).filter((e: any) => e.role?.name === 'Rider' || e.role?.name === 'Admin')
    } catch (error) {
        console.error('Error fetching riders:', error)
        return []
    }
}
