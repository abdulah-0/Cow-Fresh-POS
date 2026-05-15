import { createClient } from '@/lib/supabase/client'
import { Tenant } from '@/types'

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Get the current user's tenant information (Always returns the default tenant)
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
    try {
        const supabase = createClient()
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', DEFAULT_TENANT_ID)
            .single()

        return tenant as unknown as Tenant
    } catch (error) {
        console.error('Error getting current tenant:', error)
        return null
    }
}

/**
 * Get the employee ID for the current user in the default tenant
 */
export async function getEmployeeId(userId: string, _tenantId?: string): Promise<number | null> {
    try {
        const supabase = createClient()

        const { data: employee } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', userId)
            .eq('tenant_id', DEFAULT_TENANT_ID)
            .eq('deleted', false)
            .single()

        return employee?.id || null
    } catch (error) {
        console.error('Error getting employee ID:', error)
        return null
    }
}

/**
 * Get tenant by slug (Always returns the default tenant regardless of slug)
 */
export async function getTenantBySlug(_slug: string): Promise<Tenant | null> {
    return getCurrentTenant()
}
