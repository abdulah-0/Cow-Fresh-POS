import { createClient } from '@/lib/supabase/server'
import type { RoleName } from '@/lib/roleUtils'

export interface UserRole {
    roleName: RoleName
    permissions: string[]
}

/**
 * SERVER-ONLY: Fetch the current user's role name and permissions.
 * Do NOT import this from any client component.
 */
export async function getUserRole(userId: string, tenantId: string): Promise<UserRole> {
    const supabase = await createClient()

    const { data: employee } = await supabase
        .from('employees')
        .select('role_id, roles(name, permissions)')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('deleted', false)
        .single()

    const role = employee?.roles as { name: string; permissions: string[] } | null

    return {
        roleName: role?.name ?? 'Cashier',
        permissions: role?.permissions ?? [],
    }
}
