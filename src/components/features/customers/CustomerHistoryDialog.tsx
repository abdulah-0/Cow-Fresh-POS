'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, DollarSign, Package, Calendar } from 'lucide-react'
import { getCustomerAnalytics } from '@/lib/services/customerAnalyticsService'

interface CustomerHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: any
}

export default function CustomerHistoryDialog({
    open,
    onOpenChange,
    customer,
}: CustomerHistoryDialogProps) {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && customer) {
            loadAnalytics()
        }
    }, [open, customer])

    const loadAnalytics = async () => {
        if (!customer) return

        setLoading(true)
        try {
            const data = await getCustomerAnalytics(customer.id)
            setAnalytics(data)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!customer) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Customer History - {customer.person.first_name} {customer.person.last_name}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading analytics...</div>
                ) : analytics ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.totalPurchases}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Items Purchased</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.itemsPurchased}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Purchase History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Purchase History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analytics.sales.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No purchases yet
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sale ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead className="text-right">Tax</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.sales.map((sale: any) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell className="font-mono">#{sale.id}</TableCell>
                                                    <TableCell>
                                                        {new Date(sale.sale_time).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {sale.sales_items?.length || 0} items
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        ${parseFloat(sale.subtotal || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        ${parseFloat(sale.tax || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ${parseFloat(sale.sale_total || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            sale.sale_status === 'completed'
                                                                ? 'bg-green-600'
                                                                : 'bg-yellow-600'
                                                        }>
                                                            {sale.sale_status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
