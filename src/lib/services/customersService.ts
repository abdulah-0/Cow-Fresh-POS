import { createClient } from '@/lib/supabase/client'

export interface CustomerInput {
    person: {
        first_name: string
        last_name: string
        email?: string
        phone_number?: string
        address_1?: string
        address_2?: string
        city?: string
        state?: string
        zip?: string
        country?: string
        comments?: string
    }
    company_name?: string
    account_number?: string
    taxable?: boolean
    tax_id?: string
    discount_percent?: number
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: CustomerInput, tenantId: string): Promise<any> {
    const supabase = createClient()

    try {
        // Create person record first
        const { data: person, error: personError } = await supabase
            .from('people')
            .insert({
                tenant_id: tenantId,
                first_name: customer.person.first_name,
                last_name: customer.person.last_name,
                email: customer.person.email,
                phone_number: customer.person.phone_number,
                address_1: customer.person.address_1,
                address_2: customer.person.address_2,
                city: customer.person.city,
                state: customer.person.state,
                zip: customer.person.zip,
                country: customer.person.country,
                comments: customer.person.comments,
            })
            .select()
            .single()

        if (personError) throw personError

        // Create customer record
        const { data: customerRecord, error: customerError } = await supabase
            .from('customers')
            .insert({
                tenant_id: tenantId,
                person_id: person.id,
                company_name: customer.company_name,
                account_number: customer.account_number,
                taxable: customer.taxable !== false,
                tax_id: customer.tax_id,
                discount_percent: customer.discount_percent || 0,
                deleted: false,
            })
            .select()
            .single()

        if (customerError) throw customerError

        return { ...customerRecord, person }
    } catch (error) {
        console.error('Error creating customer:', error)
        throw error
    }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(customerId: number, customer: Partial<CustomerInput>): Promise<any> {
    const supabase = createClient()

    try {
        // Get current customer to find person_id
        const { data: currentCustomer } = await supabase
            .from('customers')
            .select('person_id')
            .eq('id', customerId)
            .single()

        if (!currentCustomer) throw new Error('Customer not found')

        // Update person if provided
        if (customer.person) {
            const { error: personError } = await supabase
                .from('people')
                .update({
                    first_name: customer.person.first_name,
                    last_name: customer.person.last_name,
                    email: customer.person.email,
                    phone_number: customer.person.phone_number,
                    address_1: customer.person.address_1,
                    address_2: customer.person.address_2,
                    city: customer.person.city,
                    state: customer.person.state,
                    zip: customer.person.zip,
                    country: customer.person.country,
                    comments: customer.person.comments,
                })
                .eq('id', currentCustomer.person_id)

            if (personError) throw personError
        }

        // Update customer
        const { data, error } = await supabase
            .from('customers')
            .update({
                company_name: customer.company_name,
                account_number: customer.account_number,
                taxable: customer.taxable,
                tax_id: customer.tax_id,
                discount_percent: customer.discount_percent,
            })
            .eq('id', customerId)
            .select(`
                *,
                person:people(*)
            `)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating customer:', error)
        throw error
    }
}

/**
 * Delete a customer (soft delete)
 */
export async function deleteCustomer(customerId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('customers')
            .update({ deleted: true })
            .eq('id', customerId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting customer:', error)
        throw error
    }
}

/**
 * Get customers with filters
 */
export async function getCustomers(
    tenantId: string,
    filters?: {
        search?: string
        taxable?: boolean
    }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('customers')
            .select(`
                *,
                person:people(*)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .order('id', { ascending: false })

        if (filters?.search) {
            // Search in person fields
            query = query.or(
                `person.first_name.ilike.%${filters.search}%,person.last_name.ilike.%${filters.search}%,person.email.ilike.%${filters.search}%,person.phone_number.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
            )
        }

        if (filters?.taxable !== undefined) {
            query = query.eq('taxable', filters.taxable)
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting customers:', error)
        return []
    }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                person:people(*)
            `)
            .eq('id', customerId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error getting customer:', error)
        throw error
    }
}

/**
 * Get customer purchase history
 */
export async function getCustomerPurchaseHistory(customerId: number): Promise<any[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('sales')
            .select(`
                *,
                sales_items(*),
                sales_payments(*)
            `)
            .eq('customer_id', customerId)
            .order('sale_time', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting purchase history:', error)
        return []
    }
}
