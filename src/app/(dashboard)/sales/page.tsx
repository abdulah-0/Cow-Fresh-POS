'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, ShoppingCart, Trash2, Plus, Minus, Milk, Egg, Utensils, Coffee, Refrigerator } from 'lucide-react'
import { getItems } from '@/lib/services/itemsService'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export default function SalesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const {
        items,
        customer,
        mode,
        addItem,
        removeItem,
        updateQuantity,
        getSubtotal,
        getTax,
        getTotal,
        clearCart,
    } = useCartStore()

    const params = useParams()
    const tenantId = params.tenant as string
    const [isLoading, setIsLoading] = useState(false)
    const { showToast } = useToast()

    const DAIRY_CATEGORIES = [
        { name: 'Milk', icon: Milk },
        { name: 'Yogurt', icon: Refrigerator },
        { name: 'Butter', icon: Utensils },
        { name: 'Cream', icon: Coffee },
        { name: 'Eggs', icon: Egg },
    ]

    const handleSearch = async (query: string) => {
        if (!query.trim()) return
        setIsLoading(true)
        try {
            const results = await getItems(tenantId, { search: query })
            if (results && results.length > 0) {
                const item = results[0]
                addItem({
                    item_id: item.id,
                    name: item.name,
                    item_number: item.item_number,
                    description: item.description,
                    price: item.unit_price,
                    cost_price: item.cost_price,
                    quantity: item.unit_type === 'piece' ? 1 : 0.5, // Default weight for non-piece items
                    unit_type: item.unit_type,
                    expiry_date: item.expiry_date,
                    batch_number: item.batch_number,
                    discount: 0,
                    discount_type: 'percent',
                    serialnumber: '',
                    is_serialized: item.is_serialized,
                    allow_alt_description: item.allow_alt_description,
                    item_location: 1, // Default location
                    in_stock: item.stock_quantity,
                })
                setSearchQuery('')
                showToast(`Added ${item.name}`, 'success')
            } else {
                showToast('Item not found', 'error')
            }
        } catch (error) {
            console.error('Search error:', error)
            showToast('Failed to search items', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCategoryClick = async (category: string) => {
        setIsLoading(true)
        try {
            const results = await getItems(tenantId, { category })
            // For simplicity, just add the first item or show a selection (here we just log)
            console.log(`Items in ${category}:`, results)
            showToast(`Found ${results.length} items in ${category}`, 'info')
        } catch (error) {
            showToast('Failed to fetch category items', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full gap-6">
            {/* Left Side - Product Search & Cart */}
            <div className="flex-1 space-y-6">
                {/* Search Bar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Find or Scan Item
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search by name, barcode, or item number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(searchQuery)
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button 
                                onClick={() => handleSearch(searchQuery)}
                                disabled={isLoading}
                            >
                                {isLoading ? '...' : 'Search'}
                            </Button>
                        </div>

                        {/* Dairy Category Quick Filters */}
                        <div className="grid grid-cols-5 gap-2 mt-4">
                            {DAIRY_CATEGORIES.map((cat) => (
                                <Button
                                    key={cat.name}
                                    variant="outline"
                                    className="flex flex-col h-20 items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    onClick={() => handleCategoryClick(cat.name)}
                                >
                                    <cat.icon className="h-6 w-6 text-blue-600" />
                                    <span className="text-xs font-medium">{cat.name}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Cart Items */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Cart ({items.length} items)
                            </CardTitle>
                            <Badge variant={mode === 'sale' ? 'default' : 'secondary'}>
                                {mode.toUpperCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4">No items in cart</p>
                                <p className="text-sm">Search for products to add them</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="w-32">Quantity</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
                                        const itemTotal = item.price * item.quantity
                                        const discountAmount = item.discount_type === 'percent'
                                            ? itemTotal * (item.discount / 100)
                                            : item.discount
                                        const finalTotal = itemTotal - discountAmount

                                        return (
                                            <TableRow key={item.item_id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.item_number && (
                                                            <div className="text-sm text-gray-500">{item.item_number}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                                 <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.item_id, Math.max(0, item.quantity - (item.unit_type === 'piece' ? 1 : 0.1)))}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.item_id, parseFloat(e.target.value) || 0)}
                                                            className="w-20 text-center h-8"
                                                            step={item.unit_type === 'piece' ? 1 : 0.001}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateQuantity(item.item_id, item.quantity + (item.unit_type === 'piece' ? 1 : 0.1))}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-xs text-gray-500 lowercase">{item.unit_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${finalTotal.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeItem(item.item_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Side - Checkout Panel */}
            <div className="w-96 space-y-6">
                {/* Customer Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customer ? (
                            <div>
                                <p className="font-medium">{customer.person?.first_name} {customer.person?.last_name}</p>
                                {customer.company_name && (
                                    <p className="text-sm text-gray-500">{customer.company_name}</p>
                                )}
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full">
                                Add Customer
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax (10%)</span>
                            <span className="font-medium">${getTax().toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold">${getTotal().toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                        size="lg"
                        disabled={items.length === 0}
                    >
                        Complete Sale
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" disabled={items.length === 0}>
                            Suspend
                        </Button>
                        <Button
                            variant="outline"
                            onClick={clearCart}
                            disabled={items.length === 0}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
