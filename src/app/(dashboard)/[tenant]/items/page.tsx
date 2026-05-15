'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Package, Upload } from 'lucide-react'
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
import { getItems, deleteItem } from '@/lib/services/itemsService'
import ItemFormDialog from '@/components/features/items/ItemFormDialog'
import BulkUploadDialog from '@/components/features/items/BulkUploadDialog'
import ClientRoleGuard from '@/components/providers/ClientRoleGuard'

export default function ItemsPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(25)
    const [totalItems, setTotalItems] = useState(0)
    const [showItemDialog, setShowItemDialog] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
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

    // Load items
    useEffect(() => {
        if (tenantId) {
            loadItems()
        }
    }, [tenantId, searchQuery, currentPage])

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const loadItems = async () => {
        setLoading(true)
        try {
            const { data, count } = await getItems(tenantId, {
                search: searchQuery || undefined,
                paginated: true,
                page: currentPage,
                pageSize: pageSize
            })
            setItems(data)
            setTotalItems(count)
        } catch (error) {
            console.error('Error loading items:', error)
            showToast('error', 'Failed to load items')
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = () => {
        setSelectedItem(null)
        setShowItemDialog(true)
    }

    const handleEditItem = (item: any) => {
        setSelectedItem(item)
        setShowItemDialog(true)
    }

    const handleDeleteItem = async (item: any) => {
        if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
            return
        }

        try {
            await deleteItem(item.id)
            showToast('success', 'Item deleted successfully')
            loadItems()
        } catch (error) {
            console.error('Error deleting item:', error)
            showToast('error', 'Failed to delete item')
        }
    }

    const handleItemSaved = () => {
        setShowItemDialog(false)
        setSelectedItem(null)
        loadItems()
    }

    const totalPages = Math.ceil(totalItems / pageSize)

    return (
        <ClientRoleGuard routeSegment="items" tenantSlug={tenantSlug}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Items</h1>
                        <p className="text-gray-500 mt-1">Manage your product catalog</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowBulkUpload(true)}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Bulk Upload
                        </Button>
                        <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search items by name, item number, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Items ({totalItems})
                            </div>
                            {totalItems > 0 && (
                                <div className="text-sm font-normal text-gray-500">
                                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">
                                Loading items...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">No items found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchQuery ? 'Try a different search term' : 'Add your first item to get started'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item #</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Cost Price</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.item_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.name}</div>
                                                            {item.description && (
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.category ? (
                                                            <Badge variant="outline">{item.category}</Badge>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        PKR {item.cost_price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        PKR {item.unit_price.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className={item.is_low_stock ? 'text-red-600 font-medium' : ''}>
                                                                {item.stock_quantity}
                                                            </span>
                                                            {item.is_low_stock && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    Low
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditItem(item)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteItem(item)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                        <div className="text-sm text-gray-500">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Item Form Dialog */}
                <ItemFormDialog
                    open={showItemDialog}
                    onOpenChange={setShowItemDialog}
                    item={selectedItem}
                    tenantId={tenantId}
                    onSaved={handleItemSaved}
                />

                {/* Bulk Upload Dialog */}
                <BulkUploadDialog
                    open={showBulkUpload}
                    onOpenChange={setShowBulkUpload}
                    tenantId={tenantId}
                    onUploaded={loadItems}
                />
            </div>
        </ClientRoleGuard>
    )
}
