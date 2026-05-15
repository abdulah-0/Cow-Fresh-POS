import { createClient } from '@/lib/supabase/client'
import { Tenant } from '@/types'

/**
 * Get the current user's tenant information
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
    try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        // Get employee record with tenant info
        const { data: employee } = await supabase
            .from('employees')
            .select('tenant_id, tenant:tenants(*)')
            .eq('user_id', user.id)
            .eq('deleted', false)
            .single()

        if (!employee?.tenant) return null

        return employee.tenant as unknown as Tenant
    } catch (error) {
        console.error('Error getting current tenant:', error)
        return null
    }
}

/**
 * Get the employee ID for the current user in the given tenant
 */
export async function getEmployeeId(userId: string, tenantId: string): Promise<number | null> {
    try {
        const supabase = createClient()

        const { data: employee } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .eq('deleted', false)
            .single()

        return employee?.id || null
    } catch (error) {
        console.error('Error getting employee ID:', error)
        return null
    }
}

/**
 * Get tenant ID from URL slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
        const supabase = createClient()

        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single()

        return tenant
    } catch (error) {
        console.error('Error getting tenant by slug:', error)
        return null
    }
}
