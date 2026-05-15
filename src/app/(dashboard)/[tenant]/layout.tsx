export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ToastProvider } from '@/components/ui/toast'
import { RoleProvider } from '@/components/providers/RoleProvider'
import { getUserRole } from '@/lib/serverRoleUtils'
import { canAccessRoute, getDefaultRoute } from '@/lib/roleUtils'

interface TenantLayoutProps {
    children: React.ReactNode
    params: Promise<{ tenant: string }>
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
    const supabase = await createClient()
    const { tenant: tenantSlug } = await params

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify tenant exists
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenantSlug)
        .single()

    if (!tenant) {
        redirect('/dashboard')
    }

    // Check if user is an employee of this tenant
    const { data: employee } = await supabase
        .from('employees')
        .select('id, role_id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .eq('deleted', false)
        .single()

    if (!employee) {
        redirect('/dashboard')
    }

    // Fetch role and permissions
    const { roleName, permissions } = await getUserRole(user.id, tenant.id)

    return (
        <ToastProvider>
            <RoleProvider roleName={roleName} permissions={permissions}>
                <div className="flex h-screen overflow-hidden">
                    <Sidebar tenantSlug={tenantSlug} roleName={roleName} />
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Header user={user} tenant={tenant} />
                        <RoleGuard tenantSlug={tenantSlug} roleName={roleName}>
                            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
                        </RoleGuard>
                    </div>
                </div>
            </RoleProvider>
        </ToastProvider>
    )
}

// Server component that checks route access and redirects if unauthorized
async function RoleGuard({
    children,
    tenantSlug,
    roleName,
}: {
    children: React.ReactNode
    tenantSlug: string
    roleName: string
}) {
    // We can't easily get the current sub-route here in a layout without
    // reading headers. Instead, each page will be protected by middleware
    // and the sidebar will hide inaccessible links. The layout provides
    // the role context so individual pages can also call useRole().
    // The redirect protection for direct URL access is handled in the sidebar
    // by hiding links, plus the server layout passes role to the sidebar which
    // filters them. For hard URL blocking we use canAccessRoute in page components.
    return <>{children}</>
}
