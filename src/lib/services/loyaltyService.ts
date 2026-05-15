import { createClient } from '@/lib/supabase/client'

export interface CustomerTier {
    id: number
    tenant_id: string
    name: string
    min_points: number
    discount_percent: number
    color: string
    created_at: string
}

export interface LoyaltyTransaction {
    customer_id: number
    points: number
    transaction_type: 'earn' | 'redeem' | 'adjust'
    reference_id?: number
    reference_type?: 'sale' | 'manual'
    comment?: string
}

/**
 * Get customer's current loyalty points
 */
export async function getCustomerPoints(customerId: number): Promise<number> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('loyalty_points')
            .select('points')
            .eq('customer_id', customerId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        return data?.points || 0
    } catch (error) {
        console.error('Error getting customer points:', error)
        return 0
    }
}

/**
 * Add loyalty points to customer
 */
export async function addLoyaltyPoints(
    customerId: number,
    points: number,
    referenceId?: number,
    referenceType?: 'sale' | 'manual',
    comment?: string
): Promise<void> {
    const supabase = createClient()

    try {
        // Get current points
        const currentPoints = await getCustomerPoints(customerId)

        // Update or insert points
        const { error: pointsError } = await supabase
            .from('loyalty_points')
            .upsert({
                customer_id: customerId,
                points: currentPoints + points,
            })

        if (pointsError) throw pointsError

        // Record transaction
        const { error: txError } = await supabase
            .from('loyalty_transactions')
            .insert({
                customer_id: customerId,
                points: points,
                transaction_type: 'earn',
                reference_id: referenceId,
                reference_type: referenceType,
                comment: comment,
            })

        if (txError) throw txError
    } catch (error) {
        console.error('Error adding loyalty points:', error)
        throw error
    }
}

/**
 * Redeem loyalty points
 */
export async function redeemLoyaltyPoints(
    customerId: number,
    points: number,
    referenceId?: number,
    comment?: string
): Promise<boolean> {
    const supabase = createClient()

    try {
        // Get current points
        const currentPoints = await getCustomerPoints(customerId)

        if (currentPoints < points) {
            throw new Error('Insufficient points')
        }

        // Update points
        const { error: pointsError } = await supabase
            .from('loyalty_points')
            .update({
                points: currentPoints - points,
            })
            .eq('customer_id', customerId)

        if (pointsError) throw pointsError

        // Record transaction
        const { error: txError } = await supabase
            .from('loyalty_transactions')
            .insert({
                customer_id: customerId,
                points: -points,
                transaction_type: 'redeem',
                reference_id: referenceId,
                reference_type: 'sale',
                comment: comment,
            })

        if (txError) throw txError

        return true
    } catch (error) {
        console.error('Error redeeming loyalty points:', error)
        throw error
    }
}

/**
 * Get customer tier based on points
 */
export async function getCustomerTier(customerId: number, tenantId: string): Promise<CustomerTier | null> {
    const supabase = createClient()

    try {
        const points = await getCustomerPoints(customerId)

        // Get all tiers for tenant
        const { data: tiers, error } = await supabase
            .from('customer_tiers')
            .select('*')
            .eq('tenant_id', tenantId)
            .lte('min_points', points)
            .order('min_points', { ascending: false })
            .limit(1)

        if (error) throw error

        return tiers && tiers.length > 0 ? tiers[0] : null
    } catch (error) {
        console.error('Error getting customer tier:', error)
        return null
    }
}

/**
 * Get all customer tiers for tenant
 */
export async function getCustomerTiers(tenantId: string): Promise<CustomerTier[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('customer_tiers')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('min_points', { ascending: true })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Error getting customer tiers:', error)
        return []
    }
}

/**
 * Create customer tier
 */
export async function createCustomerTier(
    tenantId: string,
    name: string,
    minPoints: number,
    discountPercent: number,
    color: string
): Promise<CustomerTier> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('customer_tiers')
            .insert({
                tenant_id: tenantId,
                name: name,
                min_points: minPoints,
                discount_percent: discountPercent,
                color: color,
            })
            .select()
            .single()

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error creating customer tier:', error)
        throw error
    }
}

/**
 * Update customer tier
 */
export async function updateCustomerTier(
    tierId: number,
    updates: Partial<CustomerTier>
): Promise<CustomerTier> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('customer_tiers')
            .update(updates)
            .eq('id', tierId)
            .select()
            .single()

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error updating customer tier:', error)
        throw error
    }
}

/**
 * Delete customer tier
 */
export async function deleteCustomerTier(tierId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('customer_tiers')
            .delete()
            .eq('id', tierId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting customer tier:', error)
        throw error
    }
}

/**
 * Get loyalty transaction history
 */
export async function getLoyaltyTransactions(customerId: number): Promise<any[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Error getting loyalty transactions:', error)
        return []
    }
}

/**
 * Calculate points earned from sale amount
 */
export function calculatePointsFromSale(saleAmount: number, pointsPerDollar: number = 1): number {
    return Math.floor(saleAmount * pointsPerDollar)
}

/**
 * Calculate discount from points
 */
export function calculateDiscountFromPoints(points: number, pointValue: number = 0.01): number {
    return points * pointValue
}
