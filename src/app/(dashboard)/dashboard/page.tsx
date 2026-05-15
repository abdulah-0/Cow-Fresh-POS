import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRedirect() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user's employee record to find their tenant
    const { data: employee } = await supabase
        .from('employees')
        .select(`
            tenant_id,
            tenant:tenants(id, name, slug)
        `)
        .eq('user_id', user.id)
        .eq('deleted', false)
        .single()

    if (employee?.tenant) {
        const tenant = employee.tenant as any
        // Redirect to their tenant dashboard
        redirect(`/${tenant.slug}/dashboard`)
    }

    // If no employee record, redirect to signup
    redirect('/signup')
}
