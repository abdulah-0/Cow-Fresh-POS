export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ShoppingCart, Package, Users, DollarSign, TrendingUp, ArrowUpRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface DashboardPageProps {
    params: Promise<{ tenant: string }>
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export default async function TenantDashboardPage({ params }: DashboardPageProps) {
    const { tenant: tenantSlug } = await params
    const supabase = await createClient()

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('slug', tenantSlug)
        .single()

    if (!tenant) {
        return <div>Tenant not found</div>
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [salesData, itemsData, customersData, lowStockData] = await Promise.all([
        supabase.from('sales').select('sale_total').eq('tenant_id', tenant.id)
            .gte('sale_time', today.toISOString()).lt('sale_time', tomorrow.toISOString()),
        supabase.from('items').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).eq('deleted', false),
        supabase.from('customers').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).eq('deleted', false),
        supabase.from('items').select('id, reorder_level, inventory(quantity)').eq('tenant_id', tenant.id).eq('deleted', false),
    ])

    const todaysSales = salesData.data?.reduce((sum, sale) => sum + parseFloat(sale.sale_total || '0'), 0) || 0
    const totalItems = itemsData.count || 0
    const totalCustomers = customersData.count || 0
    const lowStockCount = lowStockData.data?.filter(item => {
        const totalStock = (item.inventory as Array<{ quantity: number }>)?.reduce((sum, inv) => sum + inv.quantity, 0) || 0
        return totalStock <= (item.reorder_level || 0)
    }).length || 0

    const { data: recentSales } = await supabase
        .from('sales')
        .select('id, sale_total, sale_time, customer:customers(person:people(first_name, last_name))')
        .eq('tenant_id', tenant.id)
        .order('sale_time', { ascending: false })
        .limit(5)

    const stats = [
        {
            title: "Today's Sales",
            value: `Rs. ${todaysSales.toFixed(2)}`,
            description: salesData.data?.length ? `${salesData.data.length} transactions` : 'No sales yet',
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            lightBg: 'bg-emerald-50',
            textColor: 'text-emerald-600',
        },
        {
            title: 'Total Items',
            value: totalItems.toString(),
            description: 'In inventory',
            icon: Package,
            gradient: 'from-blue-500 to-indigo-600',
            lightBg: 'bg-blue-50',
            textColor: 'text-blue-600',
        },
        {
            title: 'Customers',
            value: totalCustomers.toString(),
            description: 'Registered',
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
            lightBg: 'bg-violet-50',
            textColor: 'text-violet-600',
        },
        {
            title: 'Low Stock',
            value: lowStockCount.toString(),
            description: lowStockCount > 0 ? 'Need reordering' : 'All stocked up',
            icon: lowStockCount > 0 ? TrendingUp : BarChart3,
            gradient: lowStockCount > 0 ? 'from-orange-500 to-red-500' : 'from-green-500 to-emerald-600',
            lightBg: lowStockCount > 0 ? 'bg-orange-50' : 'bg-green-50',
            textColor: lowStockCount > 0 ? 'text-orange-600' : 'text-green-600',
        },
    ]

    const quickActions = [
        {
            href: `/${tenantSlug}/sales`,
            icon: ShoppingCart,
            label: 'New Sale',
            description: 'Open POS register',
            gradient: 'from-indigo-600 to-purple-600',
        },
        {
            href: `/${tenantSlug}/items`,
            icon: Package,
            label: 'Add Item',
            description: 'Add inventory item',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            href: `/${tenantSlug}/customers`,
            icon: Users,
            label: 'New Customer',
            description: 'Register customer',
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            href: `/${tenantSlug}/reports`,
            icon: BarChart3,
            label: 'View Reports',
            description: 'Sales & analytics',
            gradient: 'from-emerald-500 to-teal-600',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {getGreeting()} 👋
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        Here&apos;s what&apos;s happening at <span className="font-medium text-gray-700">{tenant.name}</span> today.
                    </p>
                </div>
                <Link
                    href={`/${tenantSlug}/sales`}
                    className="hidden sm:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                    <ShoppingCart className="h-4 w-4" />
                    New Sale
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
                            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-5">
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <p className="mt-0.5 text-xs text-gray-500">{stat.description}</p>
                        </CardContent>
                        {/* Subtle bottom accent */}
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-50`} />
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
                {/* Recent Sales */}
                <Card className="lg:col-span-4 border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold text-gray-900">Recent Sales</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                {recentSales && recentSales.length > 0
                                    ? `Latest ${recentSales.length} transactions`
                                    : 'No sales recorded yet'}
                            </CardDescription>
                        </div>
                        <Link
                            href={`/${tenantSlug}/sales-history`}
                            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                        >
                            View all <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentSales && recentSales.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {recentSales.map((sale: any) => (
                                    <div key={sale.id} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                                <ShoppingCart className="h-3.5 w-3.5 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {sale.customer?.person
                                                        ? `${sale.customer.person.first_name} ${sale.customer.person.last_name}`
                                                        : 'Walk-in Customer'}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(sale.sale_time).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600">
                                            Rs. {parseFloat(sale.sale_total).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                                    <ShoppingCart className="h-6 w-6 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">No sales yet</p>
                                <p className="text-xs text-gray-400">Start making sales to see them here</p>
                                <Link
                                    href={`/${tenantSlug}/sales`}
                                    className="mt-2 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                >
                                    Open POS Register
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-3 border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
                        <CardDescription className="text-xs">Jump to common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {quickActions.map((action) => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 transition-all hover:border-purple-100 hover:bg-purple-50/50 hover:shadow-sm"
                            >
                                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient}`}>
                                    <action.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{action.label}</p>
                                    <p className="text-xs text-gray-400">{action.description}</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
