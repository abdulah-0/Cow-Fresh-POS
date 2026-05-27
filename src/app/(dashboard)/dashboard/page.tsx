export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, ShoppingCart, Package, Users, DollarSign, TrendingUp, ArrowUpRight, Clock, AlertTriangle, Droplets, Milk, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'


function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [salesData, itemsData, customersData, lowStockData, expiringData, todayMilkInvResult, todayPackingResult] = await Promise.all([
        supabase.from('sales').select('sale_total')
            .gte('sale_time', today.toISOString()).lt('sale_time', tomorrow.toISOString()),
        supabase.from('items').select('id', { count: 'exact' }).eq('deleted', false),
        supabase.from('customers').select('id', { count: 'exact' }).eq('deleted', false),
        supabase.from('items').select('id, reorder_level, inventory(quantity)').eq('deleted', false),
        supabase.from('items')
            .select('id, name, expiry_date, batch_number')
            .eq('deleted', false)
            .lte('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
            .gte('expiry_date', new Date().toISOString())
            .order('expiry_date')
            .limit(5),
        supabase.from('milk_inventory').select('*').eq('inventory_date', todayStr).maybeSingle(),
        supabase.from('packing_entries').select('*').eq('date', todayStr).maybeSingle()
    ])

    const todaysSales = salesData.data?.reduce((sum: number, sale: any) => sum + parseFloat(sale.sale_total || '0'), 0) || 0
    const totalItems = itemsData.count || 0
    const totalCustomers = customersData.count || 0
    const lowStockCount = lowStockData.data?.filter((item: any) => {
        const totalStock = (item.inventory as Array<{ quantity: number }>)?.reduce((sum: number, inv: any) => sum + inv.quantity, 0) || 0
        return totalStock <= (item.reorder_level || 0)
    }).length || 0
    const expiringItems = expiringData.data || []

    const milkReceived = parseFloat(todayMilkInvResult.data?.total_received || '0')
    const milkUsedPacking = parseFloat(todayPackingResult.data?.total_milk_used || '0')
    const milkSoldPos = parseFloat(todayMilkInvResult.data?.total_pos_sold || '0')
    const milkDeliveredRiders = parseFloat(todayMilkInvResult.data?.total_rider_deliveries || '0')
    const milkRemaining = milkReceived - milkUsedPacking - milkSoldPos - milkDeliveredRiders

    const { data: recentSales } = await supabase
        .from('sales')
        .select('id, sale_total, sale_time, customer:customers(person:people(first_name, last_name))')
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
            href: `/sales`,
            icon: ShoppingCart,
            label: 'New Sale',
            description: 'Open POS register',
            gradient: 'from-indigo-600 to-purple-600',
        },
        {
            href: `/items`,
            icon: Package,
            label: 'Add Item',
            description: 'Add inventory item',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            href: `/customers`,
            icon: Users,
            label: 'New Customer',
            description: 'Register customer',
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            href: `/reports`,
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
                        Here&apos;s what&apos;s happening at <span className="font-medium text-gray-700">Cow Fresh Dairy</span> today.
                    </p>
                </div>
                <Link
                    href={`/sales`}
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

            {/* Live Raw Milk Lifecycle Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    <h2 className="text-base font-bold text-gray-800 tracking-tight">Today&apos;s Live Raw Milk Lifecycle</h2>
                    <Badge variant="outline" className="ml-2 bg-indigo-50/50 text-indigo-700 border-indigo-150 text-[10px] py-0.5 px-2 rounded-full font-bold">Real-time Analytics</Badge>
                </div>
                
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                    {/* Card 1: Total Received */}
                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-gray-500">Total Received</CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-600 shadow-sm">
                                <Droplets className="h-3.5 w-3.5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <div className="text-xl font-extrabold text-gray-900">{milkReceived.toFixed(1)} <span className="text-[10px] font-semibold text-gray-400">L</span></div>
                            <p className="mt-0.5 text-[10px] text-gray-400">Farm supply intake</p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-sky-600 opacity-50" />
                    </Card>

                    {/* Card 2: Used in Packing */}
                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-gray-500">Used in Packing</CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                <Milk className="h-3.5 w-3.5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <div className="text-xl font-extrabold text-gray-900">{milkUsedPacking.toFixed(1)} <span className="text-[10px] font-semibold text-gray-400">L</span></div>
                            <p className="mt-0.5 text-[10px] text-gray-400">Converted to retail</p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50" />
                    </Card>

                    {/* Card 3: POS Sold */}
                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-gray-500">POS Raw Sold</CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                                <ShoppingCart className="h-3.5 w-3.5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <div className="text-xl font-extrabold text-gray-900">{milkSoldPos.toFixed(1)} <span className="text-[10px] font-semibold text-gray-400">L</span></div>
                            <p className="mt-0.5 text-[10px] text-gray-400">Sold from counter</p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-50" />
                    </Card>

                    {/* Card 4: Rider Dispatched */}
                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-gray-500">Rider Delivered</CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                                <Activity className="h-3.5 w-3.5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <div className="text-xl font-extrabold text-gray-900">{milkDeliveredRiders.toFixed(1)} <span className="text-[10px] font-semibold text-gray-400">L</span></div>
                            <p className="mt-0.5 text-[10px] text-gray-400">Delivered via riders</p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 opacity-50" />
                    </Card>

                    {/* Card 5: Remaining Milk */}
                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-bold text-gray-600">Remaining Raw</CardTitle>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm">
                                <Droplets className="h-3.5 w-3.5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 px-4">
                            <div className="text-xl font-extrabold text-gray-900">
                                <span className={milkRemaining >= 0 ? 'text-indigo-600' : 'text-red-600'}>
                                    {milkRemaining.toFixed(1)} L
                                </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-gray-400">Unpackaged stock</p>
                        </CardContent>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-600 opacity-50" />
                    </Card>
                </div>
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
                            href={`/sales-history`}
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
                                    href={`/sales`}
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

            {/* Expiry Alerts Row */}
            <Card className="border-0 shadow-sm border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                            <CardTitle className="text-base font-semibold text-gray-900">Expiry Alerts</CardTitle>
                            <CardDescription className="text-xs mt-0.5">Items expiring in the next 7 days</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {expiringItems.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {expiringItems.map((item: any) => {
                                const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                return (
                                    <div key={item.id} className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">Batch: {item.batch_number || 'N/A'}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                                {daysLeft} days left
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(item.expiry_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                            No items expiring soon. All fresh! 🥛
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
