'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown, 
    DollarSign,
    Calendar,
    ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { createClient } from '@/lib/supabase/client'
import { getSalesByDateRange } from '@/lib/services/reportsService'
import { getExpenses } from '@/lib/services/expenseService'
import Link from 'next/link'

export default function FinancialSummaryPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalReceivable: 0,
        totalPayable: 0,
        monthlySales: 0,
        monthlyExpenses: 0,
        supplierPayments: 0,
    })

    useEffect(() => {
        async function loadSummary() {
            setLoading(true)
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
                const supabase = createClient()
                
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                
                // 1. Total Receivables (Customer Ledger Balances)
                const { data: customerLedgers } = await supabase
                    .from('customer_ledger_entries')
                    .select('transaction_type, amount')
                    .eq('tenant_id', tenant.id)
                
                let receivable = 0
                customerLedgers?.forEach(e => {
                    if (e.transaction_type === 'credit') receivable += Number(e.amount)
                    else receivable -= Number(e.amount)
                })

                // 2. Total Payables (Supplier Ledger Balances)
                const { data: supplierLedgers } = await supabase
                    .from('supplier_ledger_entries')
                    .select('transaction_type, amount')
                    .eq('tenant_id', tenant.id)
                
                let payable = 0
                let paidToSuppliers = 0
                supplierLedgers?.forEach(e => {
                    if (e.transaction_type === 'credit') payable += Number(e.amount)
                    else {
                        payable -= Number(e.amount)
                        // Track payments made in the current month for cash flow
                        paidToSuppliers += Number(e.amount)
                    }
                })

                // 3. Monthly Sales
                const salesReport = await getSalesByDateRange(tenant.id, startOfMonth, now)
                
                // 4. Monthly Expenses
                const expenses = await getExpenses(tenant.id, { 
                    dateFrom: startOfMonth.toISOString()
                })
                const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

                setStats({
                    totalReceivable: receivable,
                    totalPayable: payable,
                    monthlySales: salesReport.totalRevenue,
                    monthlyExpenses: totalExp,
                    supplierPayments: paidToSuppliers
                })
            }
            setLoading(false)
        }
        loadSummary()
    }, [tenantSlug])

    const cashFlow = stats.monthlySales - stats.monthlyExpenses - stats.supplierPayments

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Summary</h1>
                <p className="text-gray-500 mt-1">Consolidated view of shop finances for the current month</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                    <CardContent className="pt-6">
                        <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Monthly Sales</p>
                        <p className="text-3xl font-bold mt-2">PKR {stats.monthlySales.toLocaleString()}</p>
                        <div className="mt-4 flex items-center text-emerald-100 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Revenue from POS Sales
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500 to-orange-600 text-white border-none shadow-lg">
                    <CardContent className="pt-6">
                        <p className="text-rose-100 text-sm font-medium uppercase tracking-wider">Monthly Expenses</p>
                        <p className="text-3xl font-bold mt-2">PKR {stats.monthlyExpenses.toLocaleString()}</p>
                        <div className="mt-4 flex items-center text-rose-100 text-xs">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Shop operational costs
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100 shadow-sm">
                    <CardContent className="pt-6">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Receivables</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">PKR {stats.totalReceivable.toLocaleString()}</p>
                        <Link href={`/${tenantSlug}/ledgers/customer`} className="mt-3 text-xs text-blue-500 flex items-center hover:underline">
                            View Customer Ledger <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white border-red-100 shadow-sm">
                    <CardContent className="pt-6">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Payables</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">PKR {stats.totalPayable.toLocaleString()}</p>
                        <Link href={`/${tenantSlug}/ledgers/supplier`} className="mt-3 text-xs text-red-500 flex items-center hover:underline">
                            View Supplier Ledger <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BarChart3 className="h-32 w-32" />
                </div>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-yellow-400" />
                        Net Cash Flow Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <span className="text-gray-400">Monthly Sales (+)</span>
                                <span className="text-xl font-mono text-emerald-400">PKR {stats.monthlySales.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <span className="text-gray-400">Shop Expenses (-)</span>
                                <span className="text-xl font-mono text-rose-400">{stats.monthlyExpenses > 0 ? '-' : ''} PKR {stats.monthlyExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <span className="text-gray-400">Supplier Payments (-)</span>
                                <span className="text-xl font-mono text-orange-400">{stats.supplierPayments > 0 ? '-' : ''} PKR {stats.supplierPayments.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="text-xl font-bold">Estimated Cash Flow</span>
                                <div className="text-right">
                                    <p className={`text-3xl font-black ${cashFlow >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                        PKR {cashFlow.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Current Month to Date</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 flex flex-col justify-center border border-white/10">
                            <h3 className="text-lg font-bold mb-4">Financial Health Check</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant={cashFlow >= 0 ? 'default' : 'destructive'} className="h-2 w-2 p-0 rounded-full" />
                                    <p className="text-sm">
                                        {cashFlow >= 0 
                                            ? 'The shop is currently generating positive cash flow.' 
                                            : 'Cash flow is negative this month. Review your expenses and supplier payments.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={stats.totalReceivable > stats.totalPayable ? 'default' : 'secondary'} className="h-2 w-2 p-0 rounded-full" />
                                    <p className="text-sm text-gray-400">
                                        Your receivables are <b>PKR {stats.totalReceivable.toLocaleString()}</b>. Collecting these will improve liquidity.
                                    </p>
                                </div>
                            </div>
                            <Button className="mt-8 bg-white text-slate-900 hover:bg-gray-200" asChild>
                                <Link href={`/${tenantSlug}/reports`}>
                                    Full Analytics Report
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
