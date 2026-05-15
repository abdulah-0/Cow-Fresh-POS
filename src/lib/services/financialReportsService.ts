import { createClient } from '@/lib/supabase/client'

/**
 * Get profit & loss statement
 */
export async function getProfitAndLoss(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    revenue: number
    costOfGoodsSold: number
    grossProfit: number
    expenses: number
    netProfit: number
    profitMargin: number
}> {
    const supabase = createClient()

    try {
        // Get sales revenue
        const { data: sales } = await supabase
            .from('sales')
            .select('sale_total')
            .eq('tenant_id', tenantId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        const revenue = sales?.reduce((sum, s) => sum + parseFloat(s.sale_total || 0), 0) || 0

        // Get cost of goods sold
        const { data: salesItems } = await supabase
            .from('sales_items')
            .select(`
                quantity,
                item:items(cost_price),
                sale:sales!inner(tenant_id, sale_time)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        const costOfGoodsSold = salesItems?.reduce((sum, si: any) => {
            return sum + (si.quantity * (si.item?.cost_price || 0))
        }, 0) || 0

        const grossProfit = revenue - costOfGoodsSold
        const expenses = 0 // Would need expense tracking
        const netProfit = grossProfit - expenses
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

        return {
            revenue,
            costOfGoodsSold,
            grossProfit,
            expenses,
            netProfit,
            profitMargin,
        }
    } catch (error) {
        console.error('Error getting P&L:', error)
        return {
            revenue: 0,
            costOfGoodsSold: 0,
            grossProfit: 0,
            expenses: 0,
            netProfit: 0,
            profitMargin: 0,
        }
    }
}

/**
 * Get revenue by period
 */
export async function getRevenueByPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<Array<{ period: string; revenue: number; sales: number }>> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('sale_time, sale_total')
            .eq('tenant_id', tenantId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())
            .order('sale_time', { ascending: true })

        if (error) throw error

        const periodMap = new Map()

        sales?.forEach((sale: any) => {
            const date = new Date(sale.sale_time)
            let period: string

            if (groupBy === 'day') {
                period = date.toISOString().split('T')[0]
            } else if (groupBy === 'week') {
                const week = Math.ceil(date.getDate() / 7)
                period = `${date.getFullYear()}-W${week}`
            } else {
                period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            }

            if (!periodMap.has(period)) {
                periodMap.set(period, { period, revenue: 0, sales: 0 })
            }

            const data = periodMap.get(period)
            data.revenue += parseFloat(sale.sale_total || 0)
            data.sales += 1
        })

        return Array.from(periodMap.values())
    } catch (error) {
        console.error('Error getting revenue by period:', error)
        return []
    }
}

/**
 * Get tax summary report
 */
export async function getTaxSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalTaxCollected: number
    taxableSales: number
    nonTaxableSales: number
    averageTaxRate: number
}> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('sale_total, tax')
            .eq('tenant_id', tenantId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        if (error) throw error

        const totalTaxCollected = 0
        const totalSales = sales?.reduce((sum, s) => sum + parseFloat(s.sale_total || 0), 0) || 0
        const taxableSales = 0
        const nonTaxableSales = totalSales
        const averageTaxRate = 0

        return {
            totalTaxCollected,
            taxableSales,
            nonTaxableSales,
            averageTaxRate,
        }
    } catch (error) {
        console.error('Error getting tax summary:', error)
        return {
            totalTaxCollected: 0,
            taxableSales: 0,
            nonTaxableSales: 0,
            averageTaxRate: 0,
        }
    }
}

/**
 * Get discount analysis
 */
export async function getDiscountAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<{
    totalDiscounts: number
    discountedSales: number
    averageDiscountPercent: number
    discountImpact: number
}> {
    const supabase = createClient()

    try {
        const { data: salesItems, error } = await supabase
            .from('sales_items')
            .select(`
                quantity,
                item_unit_price,
                discount_percent,
                sale:sales!inner(tenant_id, sale_time)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        if (error) throw error

        let totalDiscounts = 0
        let discountedSales = 0
        let totalDiscountPercent = 0
        let discountCount = 0

        salesItems?.forEach((si: any) => {
            const itemTotal = si.quantity * si.item_unit_price
            const discount = itemTotal * (si.discount_percent / 100)

            if (discount > 0) {
                totalDiscounts += discount
                discountedSales += 1
                totalDiscountPercent += si.discount_percent
                discountCount += 1
            }
        })

        const averageDiscountPercent = discountCount > 0 ? totalDiscountPercent / discountCount : 0
        const discountImpact = totalDiscounts

        return {
            totalDiscounts,
            discountedSales,
            averageDiscountPercent,
            discountImpact,
        }
    } catch (error) {
        console.error('Error getting discount analysis:', error)
        return {
            totalDiscounts: 0,
            discountedSales: 0,
            averageDiscountPercent: 0,
            discountImpact: 0,
        }
    }
}

/**
 * Get payment reconciliation
 */
export async function getPaymentReconciliation(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{
    paymentType: string
    expectedAmount: number
    recordedAmount: number
    variance: number
}>> {
    const supabase = createClient()

    try {
        const { data: payments, error } = await supabase
            .from('sales_payments')
            .select(`
                payment_type,
                payment_amount,
                sale:sales!inner(tenant_id, sale_time, sale_total)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        if (error) throw error

        const reconciliation = new Map()

        payments?.forEach((p: any) => {
            const type = p.payment_type
            if (!reconciliation.has(type)) {
                reconciliation.set(type, {
                    paymentType: type,
                    expectedAmount: 0,
                    recordedAmount: 0,
                    variance: 0,
                })
            }

            const rec = reconciliation.get(type)
            rec.recordedAmount += parseFloat(p.payment_amount || 0)
        })

        return Array.from(reconciliation.values()).map(rec => ({
            ...rec,
            expectedAmount: rec.recordedAmount, // Would need cash drawer tracking
            variance: 0,
        }))
    } catch (error) {
        console.error('Error getting payment reconciliation:', error)
        return []
    }
}
