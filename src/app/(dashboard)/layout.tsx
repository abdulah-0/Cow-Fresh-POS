import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
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
                <div className="flex h-screen overflow-hidden">
                    <Sidebar roleName={roleName} />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header user={user} />
                        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
                    </div>
                </div>
            </RoleProvider>
        </ToastProvider>
    )
}
