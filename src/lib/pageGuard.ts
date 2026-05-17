import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/serverRoleUtils'
import { canAccessRoute, getDefaultRoute } from '@/lib/roleUtils'

/**
 * Server-side page guard. Call at the top of any protected page.tsx.
 * Will redirect unauthorised users to their default route.
 */
export async function requireRole(
    routeSegment: string
): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { roleName } = await getUserRole(user.id)

    if (!canAccessRoute(roleName, routeSegment)) {
        redirect(getDefaultRoute(roleName))
    }
}
