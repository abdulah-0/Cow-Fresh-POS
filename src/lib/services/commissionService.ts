import { createClient } from '@/lib/supabase/client'

export interface CommissionConfig {
    employee_id: number
    commission_rate: number // Percentage (e.g., 5 for 5%)
    commission_type: 'percentage' | 'fixed'
    minimum_sale?: number
}

export interface CommissionRecord {
    id: number
    employee_id: number
    sale_id: number
    sale_amount: number
    commission_amount: number
    commission_rate: number
    paid: boolean
    paid_date?: string
    created_at: string
}

/**
 * Set employee commission rate
 */
export async function setCommissionRate(
    employeeId: number,
    rate: number,
    type: 'percentage' | 'fixed' = 'percentage'
): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('employees')
            .update({
                commission_rate: rate,
                commission_type: type,
            })
            .eq('id', employeeId)

        if (error) throw error
    } catch (error) {
        console.error('Error setting commission rate:', error)
        throw error
    }
}

/**
 * Calculate commission for a sale
 */
export function calculateCommission(
    saleAmount: number,
    commissionRate: number,
    commissionType: 'percentage' | 'fixed' = 'percentage'
): number {
    if (commissionType === 'percentage') {
        return (saleAmount * commissionRate) / 100
    }
    return commissionRate
}

/**
 * Record commission for a sale
 */
export async function recordCommission(
    employeeId: number,
    saleId: number,
    saleAmount: number,
    commissionRate: number,
    commissionType: 'percentage' | 'fixed' = 'percentage'
): Promise<CommissionRecord> {
    const supabase = createClient()

    try {
        const commissionAmount = calculateCommission(saleAmount, commissionRate, commissionType)

        const { data, error } = await supabase
            .from('commissions')
            .insert({
                employee_id: employeeId,
                sale_id: saleId,
                sale_amount: saleAmount,
                commission_amount: commissionAmount,
                commission_rate: commissionRate,
                paid: false,
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error recording commission:', error)
        throw error
    }
}

/**
 * Get employee commissions
 */
export async function getEmployeeCommissions(
    employeeId: number,
    filters?: {
        paid?: boolean
        dateRange?: { from: Date; to: Date }
    }
): Promise<CommissionRecord[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('commissions')
            .select('*')
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false })

        if (filters?.paid !== undefined) {
            query = query.eq('paid', filters.paid)
        }

        if (filters?.dateRange) {
            query = query
                .gte('created_at', filters.dateRange.from.toISOString())
                .lte('created_at', filters.dateRange.to.toISOString())
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting commissions:', error)
        return []
    }
}

/**
 * Mark commissions as paid
 */
export async function markCommissionsPaid(commissionIds: number[]): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('commissions')
            .update({
                paid: true,
                paid_date: new Date().toISOString(),
            })
            .in('id', commissionIds)

        if (error) throw error
    } catch (error) {
        console.error('Error marking commissions paid:', error)
        throw error
    }
}

/**
 * Get commission summary
 */
export async function getCommissionSummary(
    employeeId: number,
    startDate: Date,
    endDate: Date
): Promise<{
    totalCommissions: number
    paidCommissions: number
    unpaidCommissions: number
    salesCount: number
}> {
    const commissions = await getEmployeeCommissions(employeeId, {
        dateRange: { from: startDate, to: endDate },
    })

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commission_amount, 0)
    const paidCommissions = commissions
        .filter(c => c.paid)
        .reduce((sum, c) => sum + c.commission_amount, 0)
    const unpaidCommissions = totalCommissions - paidCommissions

    return {
        totalCommissions,
        paidCommissions,
        unpaidCommissions,
        salesCount: commissions.length,
    }
}

/**
 * Get employee performance metrics
 */
export async function getEmployeePerformanceMetrics(
    employeeId: number,
    startDate: Date,
    endDate: Date
): Promise<{
    totalSales: number
    totalRevenue: number
    averageSale: number
    totalCommissions: number
    conversionRate: number
}> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('sale_total')
            .eq('employee_id', employeeId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        if (error) throw error

        const totalSales = sales?.length || 0
        const totalRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.sale_total || 0), 0) || 0
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

        const commissionSummary = await getCommissionSummary(employeeId, startDate, endDate)

        return {
            totalSales,
            totalRevenue,
            averageSale,
            totalCommissions: commissionSummary.totalCommissions,
            conversionRate: 100, // Placeholder - would need customer interaction data
        }
    } catch (error) {
        console.error('Error getting performance metrics:', error)
        return {
            totalSales: 0,
            totalRevenue: 0,
            averageSale: 0,
            totalCommissions: 0,
            conversionRate: 0,
        }
    }
}
