import { create } from 'zustand'
import { CartItem, Customer, Payment, SaleType, DiscountType } from '@/types'

interface CartStore {
    items: CartItem[]
    customer: Customer | null
    payments: Payment[]
    comment: string
    mode: SaleType
    discount: number
    discountType: DiscountType

    // Actions
    addItem: (item: CartItem) => void
    removeItem: (itemId: number) => void
    updateQuantity: (itemId: number, quantity: number) => void
    updateDiscount: (itemId: number, discount: number) => void
    setCustomer: (customer: Customer | null) => void
    addPayment: (payment: Payment) => void
    removePayment: (index: number) => void
    setComment: (comment: string) => void
    setDiscount: (discount: number, type: DiscountType) => void
    setMode: (mode: SaleType) => void
    clearCart: () => void

    // Computed
    getSubtotal: () => number
    getTotal: () => number
    getTotalPaid: () => number
    getBalance: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    customer: null,
    payments: [],
    comment: '',
    mode: 'sale',
    discount: 0,
    discountType: 'percent',

    addItem: (item) => {
        const items = get().items
        const existingIndex = items.findIndex(i => i.item_id === item.item_id && !i.is_serialized)

        if (existingIndex >= 0 && !item.is_serialized) {
            // Update quantity if item already exists and not serialized
            const newItems = [...items]
            newItems[existingIndex].quantity += item.quantity
            set({ items: newItems })
        } else {
            // Add new item
            set({ items: [...items, item] })
        }
    },

    removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.item_id !== itemId) })
    },

    updateQuantity: (itemId, quantity) => {
        const items = get().items.map(item =>
            item.item_id === itemId ? { ...item, quantity } : item
        )
        set({ items })
    },

    updateDiscount: (itemId, discount) => {
        const items = get().items.map(item =>
            item.item_id === itemId ? { ...item, discount } : item
        )
        set({ items })
    },

    setCustomer: (customer) => set({ customer }),

    addPayment: (payment) => {
        set({ payments: [...get().payments, payment] })
    },

    removePayment: (index) => {
        const payments = [...get().payments]
        payments.splice(index, 1)
        set({ payments })
    },

    setComment: (comment) => set({ comment }),

    setDiscount: (discount, type) => set({ discount, discountType: type }),

    setMode: (mode) => set({ mode }),

    clearCart: () => set({
        items: [],
        customer: null,
        payments: [],
        comment: '',
        mode: 'sale',
        discount: 0,
        discountType: 'percent',
    }),

    getSubtotal: () => {
        const itemsSubtotal = get().items.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity
            const discountAmount = item.discount_type === 'percent'
                ? itemTotal * (item.discount / 100)
                : item.discount
            return sum + (itemTotal - discountAmount)
        }, 0)

        const globalDiscount = get().discountType === 'percent'
            ? itemsSubtotal * (get().discount / 100)
            : get().discount

        return Math.max(0, itemsSubtotal - globalDiscount)
    },

    getTotal: () => {
        return get().getSubtotal()
    },

    getTotalPaid: () => {
        return get().payments.reduce((sum, payment) => sum + payment.payment_amount, 0)
    },

    getBalance: () => {
        return get().getTotal() - get().getTotalPaid()
    },
}))
