'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
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
import { Search, ShoppingCart, Trash2, Plus, Minus, User, KeyboardIcon } from 'lucide-react'
import ItemSearchDialog from '@/components/features/sales/ItemSearchDialog'
import PaymentDialog from '@/components/features/sales/PaymentDialog'
import CustomerSelectDialog from '@/components/features/sales/CustomerSelectDialog'
import { getTenantBySlug, getEmployeeId } from '@/lib/tenantUtils'
import { completeSale } from '@/lib/services/salesService'
import { printReceipt } from '@/lib/receiptUtils'
import { Cart, CartItem, Sale, Payment, DiscountType } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export default function SalesPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [employeeId, setEmployeeId] = useState<number>(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchDialog, setShowSearchDialog] = useState(false)
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [showCustomerDialog, setShowCustomerDialog] = useState(false)
    const [processing, setProcessing] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const { showToast } = useToast()

    const {
        items,
        customer,
        mode,
        addItem,
        removeItem,
        updateQuantity,
        getSubtotal,
        getTotal,
        clearCart,
        discount,
        discountType,
    } = useCartStore()

    useEffect(() => {
        async function loadTenantAndEmployee() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const empId = await getEmployeeId(user.id, tenant.id)
                    if (empId) setEmployeeId(empId)
                }
            }
        }
        loadTenantAndEmployee()
    }, [tenantSlug])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus() }
            if (e.key === 'F4') { e.preventDefault(); setShowCustomerDialog(true) }
            if (e.key === 'F12' && items.length > 0) { e.preventDefault(); setShowPaymentDialog(true) }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [items.length])

    const handleSearch = () => {
        if (searchQuery.trim()) setShowSearchDialog(true)
    }

    // Auto-open dialog as user types
    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        if (value.trim().length >= 1) {
            setShowSearchDialog(true)
        }
    }

    const handleSelectItem = (item: any) => {
        const cartItem: CartItem = {
            item_id: item.id,
            name: item.name,
            item_number: item.item_number,
            description: item.description,
            price: item.unit_price,
            cost_price: item.cost_price,
            quantity: 1,
            discount: 0,
            discount_type: 'percent',
            serialnumber: '',
            is_serialized: item.is_serialized,
            allow_alt_description: item.allow_alt_description,
            item_location: item.item_quantities?.[0]?.location?.id || 1,
            in_stock: item.stock_quantity || 0,
            stock_name: item.location_name,
        }
        addItem(cartItem)
        setSearchQuery('')
        setShowSearchDialog(false)
    }

    const handleCompletePayment = async (payments: Payment[]) => {
        setProcessing(true)
        try {
            const cart: Cart = { 
                items, 
                customer: customer || undefined, 
                payments, 
                comment: '', 
                mode,
                discount,
                discount_type: discountType
            }
            const sale = await completeSale(cart, tenantId, employeeId)
            clearCart()
            setShowPaymentDialog(false)
            try {
                await printReceipt(sale.id, tenantId)
                showToast('success', `Sale completed! Invoice #${sale.invoice_number}. Receipt downloaded.`)
            } catch {
                showToast('success', `Sale completed! Invoice #${sale.invoice_number}`)
            }
        } catch (error) {
            console.error('Error completing sale:', error)
            showToast('error', 'Error completing sale. Please try again.')
        } finally {
            setProcessing(false)
        }
    }

    const handleSelectCustomer = (customer: any) => {
        useCartStore.getState().setCustomer(customer)
    }

    return (
        <div className="flex h-full gap-4">
            {/* Left — Search + Cart */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Search Bar */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Search by name, barcode, or item number... (F2)"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                                    className="pl-9 h-11 bg-gray-50 border-gray-200 focus:border-purple-400 transition-all"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="h-11 px-5 shrink-0 text-white font-semibold"
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Item Search Dialog */}
                <ItemSearchDialog
                    open={showSearchDialog}
                    onOpenChange={(open) => {
                        setShowSearchDialog(open)
                        if (!open) setSearchQuery('')
                    }}
                    onSelectItem={handleSelectItem}
                    tenantId={tenantId}
                    initialQuery={searchQuery}
                />

                {/* Cart Items */}
                <Card className="border-0 shadow-sm flex-1 flex flex-col">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <ShoppingCart className="h-5 w-5 text-purple-500" />
                            Cart
                            {items.length > 0 && (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    {items.length}
                                </span>
                            )}
                        </CardTitle>
                        <Badge
                            variant={mode === 'sale' ? 'default' : 'secondary'}
                            className="text-[10px] uppercase tracking-wide font-semibold"
                        >
                            {mode}
                        </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {items.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                                    <ShoppingCart className="h-7 w-7 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Cart is empty</p>
                                <p className="text-xs text-gray-400">Search for an item or scan a barcode to add it</p>
                                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
                                    <KeyboardIcon className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-500">Press <kbd className="rounded bg-white border border-gray-200 px-1 text-[10px] font-mono">F2</kbd> to focus search</span>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-100">
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">Qty</TableHead>
                                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</TableHead>
                                        <TableHead className="w-10" />
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
                                            <TableRow key={item.item_id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                                        {item.item_number && (
                                                            <div className="text-xs text-gray-400 font-mono">{item.item_number}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">Rs. {item.price.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 w-7 p-0 rounded-lg border-gray-200"
                                                            onClick={() => updateQuantity(item.item_id, Math.max(1, item.quantity - 1))}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 w-7 p-0 rounded-lg border-gray-200"
                                                            onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-gray-900 text-sm">
                                                    Rs. {finalTotal.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        onClick={() => removeItem(item.item_id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
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

            {/* Right — Checkout Panel */}
            <div className="w-80 flex flex-col gap-4 shrink-0">
                {/* Customer */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-400" />
                            Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        {customer ? (
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    {customer.person?.first_name?.[0] || 'C'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{customer.person?.first_name} {customer.person?.last_name}</p>
                                    {customer.company_name && (
                                        <p className="text-xs text-gray-400">{customer.company_name}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full h-10 border-dashed border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all text-sm"
                                onClick={() => setShowCustomerDialog(true)}
                            >
                                <User className="mr-2 h-4 w-4" />
                                Add Customer (F4)
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-semibold text-gray-700">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">Rs. {getSubtotal().toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount {discountType === 'percent' ? `(${discount}%)` : ''}</span>
                                <span className="font-medium">-Rs. {(getSubtotal() / (1 - (discountType === 'percent' ? discount / 100 : 0)) * (discountType === 'percent' ? discount / 100 : 0) || discount).toFixed(2)}</span>
                            </div>
                        )}
                        <Separator className="bg-gray-100" />
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gray-900">Rs. {getTotal().toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                    <Button
                        className="w-full h-12 text-base font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                        style={{ background: items.length > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined }}
                        disabled={items.length === 0 || processing}
                        onClick={() => setShowPaymentDialog(true)}
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Complete Sale
                                {items.length > 0 && <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-mono">F12</kbd>}
                            </span>
                        )}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="h-10 text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                            disabled={items.length === 0}
                        >
                            Suspend
                        </Button>
                        <Button
                            variant="outline"
                            className="h-10 text-sm border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                            onClick={clearCart}
                            disabled={items.length === 0}
                        >
                            Clear Cart
                        </Button>
                    </div>
                </div>

                {/* Keyboard Shortcuts hint */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <KeyboardIcon className="h-3 w-3" /> Shortcuts
                    </p>
                    {[
                        { key: 'F2', label: 'Focus search' },
                        { key: 'F4', label: 'Add customer' },
                        { key: 'F12', label: 'Complete sale' },
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{label}</span>
                            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-500">{key}</kbd>
                        </div>
                    ))}
                </div>

                {/* Dialogs */}
                <PaymentDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                    total={getTotal()}
                    onComplete={handleCompletePayment}
                />
                <CustomerSelectDialog
                    open={showCustomerDialog}
                    onOpenChange={setShowCustomerDialog}
                    onSelectCustomer={handleSelectCustomer}
                    tenantId={tenantId}
                />
            </div>
        </div>
    )
}
