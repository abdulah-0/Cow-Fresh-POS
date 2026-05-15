'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, FileText, Search, Eye, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { getSales } from '@/lib/services/salesService'
import { exportSalesToCSV, exportSalesToPDF } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/currency'
import SaleDetailDialog from '@/components/features/sales/SaleDetailDialog'

export default function SalesHistoryPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [sales, setSales] = useState<any[]>([])
    const [filteredSales, setFilteredSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const { showToast } = useToast()

    // Load tenant ID
    useEffect(() => {
        async function loadTenant() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
            }
        }
        loadTenant()
    }, [tenantSlug])

    // Load sales
    useEffect(() => {
        if (tenantId) {
            loadSales()
        }
    }, [tenantId])

    // Filter sales
    useEffect(() => {
        let filtered = sales

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(sale =>
                sale.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.customer?.person?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.customer?.person?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(sale => new Date(sale.sale_time) >= new Date(dateFrom))
        }
        if (dateTo) {
            filtered = filtered.filter(sale => new Date(sale.sale_time) <= new Date(dateTo))
        }

        setFilteredSales(filtered)
    }, [sales, searchQuery, dateFrom, dateTo])

    const loadSales = async () => {
        setLoading(true)
        try {
            const data = await getSales(tenantId)
            setSales(data)
            setFilteredSales(data)
        } catch (error) {
            console.error('Error loading sales:', error)
            showToast('error', 'Failed to load sales')
        } finally {
            setLoading(false)
        }
    }

    const handleViewSale = (sale: any) => {
        setSelectedSale(sale)
        setShowDetailDialog(true)
    }

    const handleExportCSV = () => {
        try {
            exportSalesToCSV(filteredSales, `sales-${new Date().toISOString().split('T')[0]}`)
            showToast('success', 'Sales exported to CSV')
        } catch (error) {
            console.error('Error exporting CSV:', error)
            showToast('error', 'Failed to export CSV')
        }
    }

    const handleExportPDF = () => {
        try {
            exportSalesToPDF(filteredSales, `sales-report-${new Date().toISOString().split('T')[0]}`)
            showToast('success', 'Sales exported to PDF')
        } catch (error) {
            console.error('Error exporting PDF:', error)
            showToast('error', 'Failed to export PDF')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Sales History</h1>
                    <p className="text-gray-500 mt-1">View and export all sales records</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExportCSV} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={handleExportPDF} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by invoice, customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="From Date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                placeholder="To Date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Sales Records ({filteredSales.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            Loading sales...
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No sales found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-mono">
                                                {sale.invoice_number}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(sale.sale_time).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {sale.customer ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {sale.customer.person?.first_name} {sale.customer.person?.last_name}
                                                        </div>
                                                        {sale.customer.company_name && (
                                                            <div className="text-sm text-gray-500">
                                                                {sale.customer.company_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Walk-in</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {sale.items?.length || 0} items
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(sale.sale_total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        sale.sale_status === 'completed'
                                                            ? 'default'
                                                            : sale.sale_status === 'suspended'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {sale.sale_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewSale(sale)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sale Detail Dialog */}
            <SaleDetailDialog
                open={showDetailDialog}
                onOpenChange={setShowDetailDialog}
                sale={selectedSale}
                tenantId={tenantId}
            />
        </div>
    )
}
