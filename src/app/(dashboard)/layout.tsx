import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ToastProvider } from '@/components/ui/toast'
import { RoleProvider } from '@/components/providers/RoleProvider'
import { getUserRole } from '@/lib/serverRoleUtils'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get employee record
    const { data: employee } = await supabase
        .from('employees')
        .select('id, role_id')
        .eq('user_id', user.id)
        .eq('deleted', false)
        .single()

    // Fetch role and permissions (fallback to Cashier if not set)
    const { roleName, permissions } = employee 
        ? await getUserRole(user.id)
        : { roleName: 'Cashier' as any, permissions: [] }

    return (
        <ToastProvider>
            <RoleProvider roleName={roleName} permissions={permissions}>
                <DashboardShell user={user} roleName={roleName}>
                    {children}
                </DashboardShell>
            </RoleProvider>
        </ToastProvider>
    )
}
