'use client'

import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { completeSale } from '@/lib/services/salesService'
import { printReceipt } from '@/lib/receiptUtils'
import { Cart, CartItem, Payment } from '@/types'

// Modular POS Components
import { PosItemSearchBar } from '@/components/features/sales/PosItemSearchBar'
import { PosCartTable } from '@/components/features/sales/PosCartTable'
import { PosCustomerBanner } from '@/components/features/sales/PosCustomerBanner'
import { PosTotalsSummary } from '@/components/features/sales/PosTotalsSummary'
import { PosActionBar } from '@/components/features/sales/PosActionBar'
import { usePosKeyboardShortcuts } from '@/hooks/usePosKeyboardShortcuts'

// Dialogs
import ItemSearchDialog from '@/components/features/sales/ItemSearchDialog'
import PaymentDialog from '@/components/features/sales/PaymentDialog'
import CustomerSelectDialog from '@/components/features/sales/CustomerSelectDialog'

export default function SalesPage() {
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
        setCustomer,
        discount,
        discountType,
    } = useCartStore()

    // Load active cashier employee ID
    useEffect(() => {
        async function loadEmployee() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: employee } = await supabase
                    .from('employees')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()
                if (employee) {
                    setEmployeeId(employee.id)
                }
            }
        }
        loadEmployee()
    }, [])

    // Register POS Keyboard Shortcuts (F2, F4, F12)
    usePosKeyboardShortcuts({
        onFocusSearch: () => searchInputRef.current?.focus(),
        onOpenCustomerDialog: () => setShowCustomerDialog(true),
        onOpenPaymentDialog: () => setShowPaymentDialog(true),
        canPay: items.length > 0,
        onClearCart: clearCart,
    })

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) setShowSearchDialog(true)
    }

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
            unit_type: item.unit_type || 'Piece',
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
                discount_type: discountType,
            }
            const sale = await completeSale(cart, employeeId)
            clearCart()
            setShowPaymentDialog(false)
            try {
                await printReceipt(sale.id)
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

    return (
        <div className="flex h-full gap-4">
            {/* Left Panel — Item Search & Cart Items Table */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <PosItemSearchBar
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchSubmit={handleSearchSubmit}
                    inputRef={searchInputRef}
                />

                <PosCartTable
                    items={items}
                    mode={mode}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                />
            </div>

            {/* Right Panel — Customer Info, Totals & Checkout Actions */}
            <div className="w-80 flex flex-col gap-4 shrink-0">
                <PosCustomerBanner
                    customer={customer}
                    onOpenCustomerDialog={() => setShowCustomerDialog(true)}
                    onClearCustomer={() => setCustomer(null)}
                />

                <PosTotalsSummary
                    subtotal={getSubtotal()}
                    total={getTotal()}
                    discount={discount}
                    discountType={discountType}
                />

                <PosActionBar
                    itemCount={items.length}
                    processing={processing}
                    onOpenPayment={() => setShowPaymentDialog(true)}
                    onClearCart={clearCart}
                />
            </div>

            {/* Modal Dialogs */}
            <ItemSearchDialog
                open={showSearchDialog}
                onOpenChange={(open) => {
                    setShowSearchDialog(open)
                    if (!open) setSearchQuery('')
                }}
                onSelectItem={handleSelectItem}
                initialQuery={searchQuery}
            />

            <CustomerSelectDialog
                open={showCustomerDialog}
                onOpenChange={setShowCustomerDialog}
                onSelectCustomer={(cust) => setCustomer(cust as any)}
            />

            <PaymentDialog
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                total={getTotal()}
                onComplete={handleCompletePayment}
            />
        </div>
    )
}
