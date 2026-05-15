// ============================================================================
// TENANT & SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled'
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'
export type TenantRole = 'owner' | 'admin' | 'manager' | 'cashier'

export interface Tenant {
    id: string
    name: string
    slug: string
    subscription_status: SubscriptionStatus
    subscription_plan: SubscriptionPlan
    trial_ends_at?: string
    subscription_ends_at?: string
    created_at: string
    updated_at: string
}

export interface Profile {
    id: string
    full_name?: string
    avatar_url?: string
    current_tenant_id?: string
    tenant?: Tenant
    created_at: string
    updated_at: string
}

export interface TenantUser {
    id: string
    tenant_id: string
    user_id: string
    role: TenantRole
    invited_by?: string
    invited_at?: string
    joined_at?: string
    created_at: string
    updated_at: string
    tenant?: Tenant
    profile?: Profile
}

// ============================================================================
// DATABASE TYPES (All include tenant_id)
// ============================================================================

export interface Person {
    id: number
    tenant_id: string
    first_name: string
    last_name: string
    gender?: number
    phone_number: string
    email: string
    address_1: string
    address_2?: string
    city: string
    state: string
    zip: string
    country: string
    comments?: string
    created_at: string
    updated_at: string
}

export interface Employee {
    id: number
    tenant_id: string
    person_id: number
    username: string
    deleted: boolean
    person?: Person
    created_at: string
    updated_at: string
}

export interface Customer {
    id: number
    tenant_id: string
    person_id: number
    company_name?: string
    account_number?: string
    taxable: boolean // DEPRECATED - removed from UI and logic
    discount_percent: number
    deleted: boolean
    person?: Person
    created_at: string
    updated_at: string
}

export interface Supplier {
    id: number
    tenant_id: string
    person_id: number
    company_name: string
    agency_name?: string
    account_number?: string
    deleted: boolean
    person?: Person
    created_at: string
    updated_at: string
}

export interface Item {
    id: number
    tenant_id: string
    name: string
    category: string
    supplier_id?: number
    item_number?: string
    description: string
    cost_price: number
    unit_price: number
    reorder_level: number
    receiving_quantity: number
    pic_id?: number
    allow_alt_description: boolean
    is_serialized: boolean
    custom1?: string
    custom2?: string
    custom3?: string
    custom4?: string
    custom5?: string
    custom6?: string
    custom7?: string
    custom8?: string
    custom9?: string
    custom10?: string
    deleted: boolean
    created_at: string
    updated_at: string
}

export interface StockLocation {
    id: number
    tenant_id: string
    location_name: string
    deleted: boolean
}

export interface ItemQuantity {
    item_id: number
    location_id: number
    quantity: number
}

export type SaleType = 'sale' | 'return' | 'invoice' | 'quote' | 'work_order'
export type SaleStatus = 'completed' | 'suspended' | 'cancelled'

export interface Sale {
    id: number
    tenant_id: string
    sale_time: string
    customer_id?: number
    employee_id: number
    comment?: string
    invoice_number?: string
    sale_type: SaleType
    status: SaleStatus
    items?: SaleItem[]
    payments?: SalePayment[]
    customer?: Customer
    employee?: Employee
    discount_amount?: number
    discount_type?: DiscountType
    created_at: string
    updated_at: string
}

export interface SaleItem {
    id: number
    sale_id: number
    item_id: number
    description?: string
    serialnumber?: string
    line: number
    quantity_purchased: number
    item_cost_price: number
    item_unit_price: number
    discount_percent: number
    item_location: number
    item?: Item
}

export interface SalePayment {
    id: number
    sale_id: number
    payment_type: string
    payment_amount: number
}

export interface Giftcard {
    id: number
    tenant_id: string
    giftcard_number: number
    value: number
    person_id?: number
    deleted: boolean
    created_at: string
    updated_at: string
}

export interface Receiving {
    id: number
    tenant_id: string
    receiving_time: string
    supplier_id?: number
    employee_id: number
    comment: string
    payment_type?: string
    reference?: string
    total_amount: number
    created_at: string
    updated_at: string
}

export interface InventoryTransaction {
    id: number
    tenant_id: string
    item_id: number
    user_id: string
    trans_date: string
    comment: string
    location_id: number
    quantity_change: number
    created_at: string
}

// Cart Types for POS
export type DiscountType = 'percent' | 'fixed'

export interface CartItem {
    item_id: number
    name: string
    item_number?: string
    description?: string
    price: number
    cost_price: number
    quantity: number
    discount: number
    discount_type: DiscountType
    serialnumber?: string
    is_serialized: boolean
    allow_alt_description: boolean
    item_location: number
    in_stock?: number
    stock_name?: string
}

export interface Cart {
    items: CartItem[]
    customer?: Customer
    payments: Payment[]
    comment?: string
    mode: SaleType
    discount: number
    discount_type: DiscountType
}

export interface Payment {
    payment_type: string
    payment_amount: number
}

// App Config
export interface AppConfig {
    tenant_id: string
    key: string
    value: string
}
