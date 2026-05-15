import { createClient } from '@/lib/supabase/client'

export interface SupplierInput {
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
    company_name: string
    account_number?: string
    tax_id?: string
}

/**
 * Create a new supplier
 */
export async function createSupplier(supplier: SupplierInput, tenantId: string): Promise<any> {
    const supabase = createClient()

    try {
        // Create person record first
        const { data: person, error: personError } = await supabase
            .from('people')
            .insert({
                tenant_id: tenantId,
                first_name: supplier.person.first_name,
                last_name: supplier.person.last_name,
                email: supplier.person.email,
                phone_number: supplier.person.phone_number,
                address_1: supplier.person.address_1,
                address_2: supplier.person.address_2,
                city: supplier.person.city,
                state: supplier.person.state,
                zip: supplier.person.zip,
                country: supplier.person.country,
                comments: supplier.person.comments,
            })
            .select()
            .single()

        if (personError) throw personError

        // Create supplier record
        const { data: supplierRecord, error: supplierError } = await supabase
            .from('suppliers')
            .insert({
                tenant_id: tenantId,
                person_id: person.id,
                company_name: supplier.company_name,
                account_number: supplier.account_number,
                tax_id: supplier.tax_id,
                deleted: false,
            })
            .select()
            .single()

        if (supplierError) throw supplierError

        return { ...supplierRecord, person }
    } catch (error) {
        console.error('Error creating supplier:', error)
        throw error
    }
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(supplierId: number, supplier: Partial<SupplierInput>): Promise<any> {
    const supabase = createClient()

    try {
        // Get current supplier to find person_id
        const { data: currentSupplier } = await supabase
            .from('suppliers')
            .select('person_id')
            .eq('id', supplierId)
            .single()

        if (!currentSupplier) throw new Error('Supplier not found')

        // Update person if provided
        if (supplier.person) {
            const { error: personError } = await supabase
                .from('people')
                .update({
                    first_name: supplier.person.first_name,
                    last_name: supplier.person.last_name,
                    email: supplier.person.email,
                    phone_number: supplier.person.phone_number,
                    address_1: supplier.person.address_1,
                    address_2: supplier.person.address_2,
                    city: supplier.person.city,
                    state: supplier.person.state,
                    zip: supplier.person.zip,
                    country: supplier.person.country,
                    comments: supplier.person.comments,
                })
                .eq('id', currentSupplier.person_id)

            if (personError) throw personError
        }

        // Update supplier
        const { data, error } = await supabase
            .from('suppliers')
            .update({
                company_name: supplier.company_name,
                account_number: supplier.account_number,
                tax_id: supplier.tax_id,
            })
            .eq('id', supplierId)
            .select(`
                *,
                person:people(*)
            `)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating supplier:', error)
        throw error
    }
}

/**
 * Delete a supplier (soft delete)
 */
export async function deleteSupplier(supplierId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('suppliers')
            .update({ deleted: true })
            .eq('id', supplierId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting supplier:', error)
        throw error
    }
}

/**
 * Get suppliers with filters
 */
export async function getSuppliers(
    tenantId: string,
    filters?: {
        search?: string
    }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('suppliers')
            .select(`
                *,
                person:people(*)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .order('company_name')

        if (filters?.search) {
            query = query.or(
                `person.first_name.ilike.%${filters.search}%,person.last_name.ilike.%${filters.search}%,person.email.ilike.%${filters.search}%,person.phone_number.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
            )
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting suppliers:', error)
        return []
    }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(supplierId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select(`
                *,
                person:people(*)
            `)
            .eq('id', supplierId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error getting supplier:', error)
        throw error
    }
}
