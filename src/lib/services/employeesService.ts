import { createClient } from '@/lib/supabase/client'

export interface EmployeeInput {
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
    username: string
    password?: string
    role?: string
}

/**
 * Create a new employee
 */
export async function createEmployee(employee: EmployeeInput, tenantId: string): Promise<any> {
    const supabase = createClient()

    try {
        // Create person record first
        const { data: person, error: personError } = await supabase
            .from('people')
            .insert({
                tenant_id: tenantId,
                first_name: employee.person.first_name,
                last_name: employee.person.last_name,
                email: employee.person.email,
                phone_number: employee.person.phone_number,
                address_1: employee.person.address_1,
                address_2: employee.person.address_2,
                city: employee.person.city,
                state: employee.person.state,
                zip: employee.person.zip,
                country: employee.person.country,
                comments: employee.person.comments,
            })
            .select()
            .single()

        if (personError) throw personError

        // Create employee record
        const { data: employeeRecord, error: employeeError } = await supabase
            .from('employees')
            .insert({
                tenant_id: tenantId,
                person_id: person.id,
                username: employee.username,
                password: employee.password, // Should be hashed in production
                deleted: false,
            })
            .select()
            .single()

        if (employeeError) throw employeeError

        return { ...employeeRecord, person }
    } catch (error) {
        console.error('Error creating employee:', error)
        throw error
    }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(employeeId: number, employee: Partial<EmployeeInput>): Promise<any> {
    const supabase = createClient()

    try {
        // Get current employee to find person_id
        const { data: currentEmployee } = await supabase
            .from('employees')
            .select('person_id')
            .eq('id', employeeId)
            .single()

        if (!currentEmployee) throw new Error('Employee not found')

        // Update person if provided
        if (employee.person) {
            const { error: personError } = await supabase
                .from('people')
                .update({
                    first_name: employee.person.first_name,
                    last_name: employee.person.last_name,
                    email: employee.person.email,
                    phone_number: employee.person.phone_number,
                    address_1: employee.person.address_1,
                    address_2: employee.person.address_2,
                    city: employee.person.city,
                    state: employee.person.state,
                    zip: employee.person.zip,
                    country: employee.person.country,
                    comments: employee.person.comments,
                })
                .eq('id', currentEmployee.person_id)

            if (personError) throw personError
        }

        // Update employee
        const updateData: any = {}
        if (employee.username) updateData.username = employee.username
        if (employee.password) updateData.password = employee.password

        const { data, error } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', employeeId)
            .select(`
                *,
                person:people(*)
            `)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating employee:', error)
        throw error
    }
}

/**
 * Delete an employee (soft delete)
 */
export async function deleteEmployee(employeeId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('employees')
            .update({ deleted: true })
            .eq('id', employeeId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting employee:', error)
        throw error
    }
}

/**
 * Get employees with filters
 */
export async function getEmployees(
    tenantId: string,
    filters?: {
        search?: string
        deleted?: boolean
    }
): Promise<any[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('employees')
            .select(`
                *,
                person:people(*),
                role:roles(name)
            `)
            .eq('tenant_id', tenantId)
            .eq('deleted', filters?.deleted ?? false)
            .order('id', { ascending: false })

        if (filters?.search) {
            query = query.or(
                `person.first_name.ilike.%${filters.search}%,person.last_name.ilike.%${filters.search}%,person.email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`
            )
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting employees:', error)
        return []
    }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(employeeId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                *,
                person:people(*),
                role:roles(name)
            `)
            .eq('id', employeeId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error getting employee:', error)
        throw error
    }
}

/**
 * Get employee sales statistics
 */
export async function getEmployeeSalesStats(employeeId: number): Promise<any> {
    const supabase = createClient()

    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('sale_total')
            .eq('employee_id', employeeId)

        if (error) throw error

        const totalSales = sales?.length || 0
        const totalRevenue = sales?.reduce((sum, sale) => sum + parseFloat(sale.sale_total || 0), 0) || 0
        const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

        return {
            totalSales,
            totalRevenue,
            averageSale,
        }
    } catch (error) {
        console.error('Error getting employee sales stats:', error)
        return {
            totalSales: 0,
            totalRevenue: 0,
            averageSale: 0,
        }
    }
}
