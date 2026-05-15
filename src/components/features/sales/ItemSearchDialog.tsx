'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item, ItemQuantity } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Package } from 'lucide-react'

interface ItemWithStock extends Item {
    stock_quantity?: number
    location_name?: string
}

interface ItemSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectItem: (item: ItemWithStock) => void
    tenantId: string
    initialQuery?: string
}

export default function ItemSearchDialog({
    open,
    onOpenChange,
    onSelectItem,
    tenantId,
    initialQuery = '',
}: ItemSearchDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [items, setItems] = useState<ItemWithStock[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Seed dialog search with the query already typed in the POS search bar
    useEffect(() => {
        if (open) {
            setSearchQuery(initialQuery)
        } else {
            setSearchQuery('')
            setItems([])
        }
    }, [open, initialQuery])

    const searchItems = useCallback(async (query: string) => {
        if (!query.trim() || !tenantId) {
            setItems([])
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()

            // Search items by name, item_number, or description
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('deleted', false)
                .or(`name.ilike.%${query}%,item_number.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(20)

            if (error) throw error

            // Fetch inventory for each item separately
            const itemsWithStock: ItemWithStock[] = await Promise.all(
                (data || []).map(async (item: any) => {
                    // Get inventory for this item
                    const { data: inventoryData } = await supabase
                        .from('inventory')
                        .select('quantity, location_id, stock_locations(location_name)')
                        .eq('item_id', item.id)

                    const totalStock = inventoryData?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0
                    const mainLocation = inventoryData?.[0]

                    // Extract location name safely
                    let locationName = 'No Location'
                    if (mainLocation?.stock_locations) {
                        const stockLoc: any = mainLocation.stock_locations
                        locationName = Array.isArray(stockLoc)
                            ? (stockLoc[0]?.location_name || 'No Location')
                            : (stockLoc?.location_name || 'No Location')
                    }

                    return {
                        ...item,
                        stock_quantity: totalStock,
                        location_name: locationName,
                    }
                })
            )

            setItems(itemsWithStock)
            setSelectedIndex(0)
        } catch (error) {
            console.error('Error searching items:', error)
            setItems([])
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchItems(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, searchItems])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open || items.length === 0) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((prev: number) => Math.min(prev + 1, items.length - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((prev: number) => Math.max(prev - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    if (items[selectedIndex]) {
                        handleSelectItem(items[selectedIndex])
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    onOpenChange(false)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, items, selectedIndex])

    const handleSelectItem = (item: ItemWithStock) => {
        onSelectItem(item)
        onOpenChange(false)
        setSearchQuery('')
        setItems([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search Items
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <Input
                        placeholder="Search by name, item number, or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="text-lg"
                    />

                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Searching...
                        </div>
                    )}

                    {!loading && searchQuery && items.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p>No items found</p>
                            <p className="text-sm">Try a different search term</p>
                        </div>
                    )}

                    {!loading && items.length > 0 && (
                        <div className="flex-1 overflow-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Item Number</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow
                                            key={item.id}
                                            onClick={() => handleSelectItem(item)}
                                            className={`cursor-pointer transition-colors ${index === selectedIndex
                                                ? 'bg-blue-50 dark:bg-blue-950'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-gray-500">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {item.item_number || 'N/A'}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                {item.category && (
                                                    <Badge variant="outline">{item.category}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                Rs. {item.unit_price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={
                                                        (item.stock_quantity || 0) > item.reorder_level
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {item.stock_quantity || 0}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {item.location_name}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {items.length > 0 && (
                        <div className="text-sm text-gray-500 text-center">
                            Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
