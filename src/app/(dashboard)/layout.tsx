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

    let roleName = 'Cashier'
    let permissions: string[] = []

    try {
        // Get employee record
        const { data: employee } = await supabase
            .from('employees')
            .select('id, role_id')
            .eq('user_id', user.id)
            .eq('deleted', false)
            .single()

        if (employee) {
            const roleData = await getUserRole(user.id)
            roleName = roleData.roleName
            permissions = roleData.permissions
        }
    } catch (e) {
        console.error('Error fetching employee role:', e)
    }

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
