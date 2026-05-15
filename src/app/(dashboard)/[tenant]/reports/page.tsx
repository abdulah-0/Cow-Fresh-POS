'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BarChart3, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { getItems, getLowStockItems } from '@/lib/services/itemsService'

export default function ReportsPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [items, setItems] = useState<any[]>([])
    const [lowStockItems, setLowStockItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    useEffect(() => {
        async function loadTenant() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
            }
        }
        loadTenant()
    }, [tenantSlug])

    useEffect(() => {
        if (tenantId) {
            loadReports()
        }
    }, [tenantId])

    const loadReports = async () => {
        setLoading(true)
        try {
            const [allItems, lowStock] = await Promise.all([
                getItems(tenantId),
                getLowStockItems(tenantId),
            ])
            setItems(allItems)
            setLowStockItems(lowStock)
        } catch (error) {
            console.error('Error loading reports:', error)
            showToast('error', 'Failed to load reports')
        } finally {
            setLoading(false)
        }
    }

    const calculateInventoryValue = () => {
        return items.reduce((sum, item) => {
            return sum + (item.stock_quantity * item.cost_price)
        }, 0)
    }

    const calculateRetailValue = () => {
        return items.reduce((sum, item) => {
            return sum + (item.stock_quantity * item.unit_price)
        }, 0)
    }

    const calculatePotentialProfit = () => {
        return calculateRetailValue() - calculateInventoryValue()
    }

    const getTotalStock = () => {
        return items.reduce((sum, item) => sum + item.stock_quantity, 0)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Inventory Reports</h1>
                <p className="text-gray-500 mt-1">Stock levels, valuation, and analytics</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading reports...</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{items.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    {getTotalStock()} units in stock
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${calculateInventoryValue().toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">At cost price</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Retail Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${calculateRetailValue().toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">Potential revenue</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {lowStockItems.length}
                                </div>
                                <p className="text-xs text-muted-foreground">Need reordering</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Low Stock Items Report */}
                    {lowStockItems.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Low Stock Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Current Stock</TableHead>
                                            <TableHead className="text-right">Reorder Level</TableHead>
                                            <TableHead className="text-right">Suggested Order</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockItems.map((item) => {
                                            const suggestedOrder = Math.max(
                                                (item.reorder_level * 2) - item.stock_quantity,
                                                item.reorder_level
                                            )
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {item.item_number}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.category ? (
                                                            <Badge variant="outline">{item.category}</Badge>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-red-600 font-medium">
                                                            {item.stock_quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.reorder_level}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-blue-600">
                                                            {suggestedOrder} units
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Current Stock Levels Report */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Current Stock Levels
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Cost Value</TableHead>
                                        <TableHead className="text-right">Retail Value</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
                                        const costValue = item.stock_quantity * item.cost_price
                                        const retailValue = item.stock_quantity * item.unit_price
                                        const profit = retailValue - costValue

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {item.item_number}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.category ? (
                                                        <Badge variant="outline">{item.category}</Badge>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={item.is_low_stock ? 'text-red-600 font-medium' : ''}>
                                                        {item.stock_quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${costValue.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${retailValue.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 font-medium">
                                                    ${profit.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
