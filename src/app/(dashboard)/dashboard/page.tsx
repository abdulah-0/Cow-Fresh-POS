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

    // If no employee record, show a clear message instead of looping
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">No Tenant Associated</h1>
            <p className="mt-2 max-w-md text-gray-600">
                Your account is authenticated but not currently associated with any dairy shop tenant. 
                Please contact your administrator to be added to a shop.
            </p>
            <div className="mt-6">
                <a href="/login" className="text-sm font-medium text-purple-600 hover:text-purple-500">
                    Back to Login
                </a>
            </div>
        </div>
    )
}
