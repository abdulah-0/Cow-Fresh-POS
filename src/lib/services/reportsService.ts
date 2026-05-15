import { createClient } from '@/lib/supabase/client'

export interface SalesReport {
    totalSales: number
    totalRevenue: number
    totalTax: number
    totalDiscount: number
    averageSale: number
    itemsSold: number
}

export interface SalesByPeriod {
    date: string
    sales: number
    revenue: number
}

/**
 * Get daily sales summary
 */
export async function getDailySalesSummary(
    tenantId: string,
    date: Date = new Date()
): Promise<SalesReport> {
    const supabase = createClient()

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(quantity, item_unit_price, discount_percent)
            `)
            .eq('tenant_id', tenantId)
            .gte('sale_time', startOfDay.toISOString())
            .lte('sale_time', endOfDay.toISOString())

        if (error) throw error

        return calculateSalesReport(sales || [])
    } catch (error) {
        console.error('Error getting daily sales summary:', error)
        return getEmptyReport()
    }
}

/**
 * Get sales by date range
 */
export async function getSalesByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<SalesReport> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(quantity, item_unit_price, discount_percent)
            `)
            .eq('tenant_id', tenantId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        if (error) throw error

        return calculateSalesReport(sales || [])
    } catch (error) {
        console.error('Error getting sales by date range:', error)
        return getEmptyReport()
    }
}

/**
 * Get sales by employee
 */
export async function getSalesByEmployee(
    tenantId: string,
    employeeId: number,
    startDate: Date,
    endDate: Date
): Promise<SalesReport> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(quantity, item_unit_price, discount_percent)
            `)
            .eq('tenant_id', tenantId)
            .eq('employee_id', employeeId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        if (error) throw error

        return calculateSalesReport(sales || [])
    } catch (error) {
        console.error('Error getting sales by employee:', error)
        return getEmptyReport()
    }
}

/**
 * Get sales by customer
 */
export async function getSalesByCustomer(
    tenantId: string,
    customerId: number,
    startDate: Date,
    endDate: Date
): Promise<SalesReport> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(quantity, item_unit_price, discount_percent)
            `)
            .eq('tenant_id', tenantId)
            .eq('customer_id', customerId)
            .gte('sale_time', startDate.toISOString())
            .lte('sale_time', endDate.toISOString())

        if (error) throw error

        return calculateSalesReport(sales || [])
    } catch (error) {
        console.error('Error getting sales by customer:', error)
        return getEmptyReport()
    }
}

/**
 * Get sales by item
 */
export async function getSalesByItem(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ itemId: number; itemName: string; quantity: number; revenue: number }>> {
    const supabase = createClient()

    try {
        const { data: salesItems, error } = await supabase
            .from('sales_items')
            .select(`
                *,
                item:items(name),
                sale:sales!inner(tenant_id, sale_time)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        if (error) throw error

        // Group by item
        const itemMap = new Map()
        salesItems?.forEach((si: any) => {
            const itemId = si.item_id
            if (!itemMap.has(itemId)) {
                itemMap.set(itemId, {
                    itemId,
                    itemName: si.item?.name || 'Unknown',
                    quantity: 0,
                    revenue: 0,
                })
            }
            const item = itemMap.get(itemId)
            item.quantity += si.quantity
            item.revenue += si.quantity * si.item_unit_price * (1 - si.discount_percent / 100)
        })

        return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
        console.error('Error getting sales by item:', error)
        return []
    }
}

/**
 * Get payment method breakdown
 */
export async function getPaymentMethodBreakdown(
    tenantId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ paymentType: string; count: number; total: number }>> {
    const supabase = createClient()

    try {
        const { data: payments, error } = await supabase
            .from('sales_payments')
            .select(`
                *,
                sale:sales!inner(tenant_id, sale_time)
            `)
            .eq('sale.tenant_id', tenantId)
            .gte('sale.sale_time', startDate.toISOString())
            .lte('sale.sale_time', endDate.toISOString())

        if (error) throw error

        // Group by payment type
        const paymentMap = new Map()
        payments?.forEach((p: any) => {
            const type = p.payment_type
            if (!paymentMap.has(type)) {
                paymentMap.set(type, { paymentType: type, count: 0, total: 0 })
            }
            const payment = paymentMap.get(type)
            payment.count += 1
            payment.total += parseFloat(p.payment_amount || 0)
        })

        return Array.from(paymentMap.values()).sort((a, b) => b.total - a.total)
    } catch (error) {
        console.error('Error getting payment method breakdown:', error)
        return []
    }
}

/**
 * Get hourly sales analysis
 */
export async function getHourlySalesAnalysis(
    tenantId: string,
    date: Date
): Promise<Array<{ hour: number; sales: number; revenue: number }>> {
    const supabase = createClient()

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('sale_time, sale_total')
            .eq('tenant_id', tenantId)
            .gte('sale_time', startOfDay.toISOString())
            .lte('sale_time', endOfDay.toISOString())

        if (error) throw error

        // Group by hour
        const hourlyData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            sales: 0,
            revenue: 0,
        }))

        sales?.forEach((sale: any) => {
            const hour = new Date(sale.sale_time).getHours()
            hourlyData[hour].sales += 1
            hourlyData[hour].revenue += parseFloat(sale.sale_total || 0)
        })

        return hourlyData
    } catch (error) {
        console.error('Error getting hourly sales analysis:', error)
        return []
    }
}

/**
 * Calculate sales report from sales data
 */
function calculateSalesReport(sales: any[]): SalesReport {
    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.sale_total || 0), 0)
    const totalTax = 0
    const totalDiscount = sales.reduce((sum, s) => {
        const saleDiscount = s.sales_items?.reduce((itemSum: number, item: any) => {
            const itemTotal = item.quantity * item.item_unit_price
            return itemSum + (itemTotal * item.discount_percent / 100)
        }, 0) || 0
        return sum + saleDiscount
    }, 0)
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0
    const itemsSold = sales.reduce((sum, s) => {
        return sum + (s.sales_items?.reduce((itemSum: number, item: any) => {
            return itemSum + item.quantity
        }, 0) || 0)
    }, 0)

    return {
        totalSales,
        totalRevenue,
        totalTax,
        totalDiscount,
        averageSale,
        itemsSold,
    }
}

/**
 * Get empty report
 */
function getEmptyReport(): SalesReport {
    return {
        totalSales: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalDiscount: 0,
        averageSale: 0,
        itemsSold: 0,
    }
}
