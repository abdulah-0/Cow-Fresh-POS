import { createClient } from '@/lib/supabase/client'

/**
 * Get customer analytics and statistics
 */
export async function getCustomerAnalytics(customerId: number): Promise<any> {
    const supabase = createClient()

    try {
        // Get all sales for customer
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(
                    quantity,
                    item_unit_price,
                    discount_percent
                ),
                sales_payments(
                    payment_amount
                )
            `)
            .eq('customer_id', customerId)
            .order('sale_time', { ascending: false })

        if (error) throw error

        if (!sales || sales.length === 0) {
            return {
                totalPurchases: 0,
                totalSpent: 0,
                averageOrderValue: 0,
                lastPurchaseDate: null,
                itemsPurchased: 0,
                sales: [],
            }
        }

        // Calculate statistics
        const totalPurchases = sales.length
        const totalSpent = sales.reduce((sum, sale) => sum + parseFloat(sale.sale_total || 0), 0)
        const averageOrderValue = totalSpent / totalPurchases
        const lastPurchaseDate = sales[0].sale_time
        const itemsPurchased = sales.reduce((sum, sale) => {
            return sum + (sale.sales_items?.reduce((itemSum: number, item: any) => {
                return itemSum + item.quantity
            }, 0) || 0)
        }, 0)

        return {
            totalPurchases,
            totalSpent,
            averageOrderValue,
            lastPurchaseDate,
            itemsPurchased,
            sales,
        }
    } catch (error) {
        console.error('Error getting customer analytics:', error)
        throw error
    }
}

/**
 * Get top customers by total spent
 */
export async function getTopCustomers(tenantId: string, limit: number = 10): Promise<any[]> {
    const supabase = createClient()

    try {
        // Get all customers with their sales
        const { data: customers, error } = await supabase
            .from('customers')
            .select(`
                *,
                person:people(*),
                sales(sale_total)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)

        if (error) throw error

        // Calculate total spent for each customer
        const customersWithTotals = customers?.map(customer => {
            const totalSpent = customer.sales?.reduce((sum: number, sale: any) => {
                return sum + parseFloat(sale.sale_total || 0)
            }, 0) || 0

            const purchaseCount = customer.sales?.length || 0

            return {
                ...customer,
                totalSpent,
                purchaseCount,
                averageOrderValue: purchaseCount > 0 ? totalSpent / purchaseCount : 0,
            }
        }) || []

        // Sort by total spent and limit
        return customersWithTotals
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit)
    } catch (error) {
        console.error('Error getting top customers:', error)
        return []
    }
}

/**
 * Get sales by customer report
 */
export async function getSalesByCustomer(
    tenantId: string,
    dateRange?: { from: Date; to: Date }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('sales')
            .select(`
                *,
                customer:customers(
                    *,
                    person:people(*)
                ),
                sales_items(*)
            `)
            .eq('tenant_id', tenantId)
            .not('customer_id', 'is', null)
            .order('sale_time', { ascending: false })

        if (dateRange) {
            query = query
                .gte('sale_time', dateRange.from.toISOString())
                .lte('sale_time', dateRange.to.toISOString())
        }

        const { data, error } = await query

        if (error) throw error

        // Group by customer
        const salesByCustomer = new Map()

        data?.forEach(sale => {
            const customerId = sale.customer_id
            if (!salesByCustomer.has(customerId)) {
                salesByCustomer.set(customerId, {
                    customer: sale.customer,
                    sales: [],
                    totalSpent: 0,
                    itemCount: 0,
                })
            }

            const customerData = salesByCustomer.get(customerId)
            customerData.sales.push(sale)
            customerData.totalSpent += parseFloat(sale.sale_total || 0)
            customerData.itemCount += sale.sales_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        })

        return Array.from(salesByCustomer.values())
            .sort((a, b) => b.totalSpent - a.totalSpent)
    } catch (error) {
        console.error('Error getting sales by customer:', error)
        return []
    }
}
