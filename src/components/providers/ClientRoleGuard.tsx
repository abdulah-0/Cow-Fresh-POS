'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/components/providers/RoleProvider'
import { canAccessRoute, getDefaultRoute } from '@/lib/roleUtils'

interface ClientRoleGuardProps {
    routeSegment: string
    children: React.ReactNode
}

/**
 * Wraps a page and redirects the user if their role doesn't allow access.
 * Usage: wrap the page content with <ClientRoleGuard routeSegment="items">
 */
export default function ClientRoleGuard({ routeSegment, children }: ClientRoleGuardProps) {
    const { roleName } = useRole()
    const router = useRouter()

    useEffect(() => {
        if (!canAccessRoute(roleName, routeSegment)) {
            router.replace(getDefaultRoute(roleName))
        }
    }, [roleName, routeSegment, router])

    // If not allowed, render nothing while redirecting
    if (!canAccessRoute(roleName, routeSegment)) {
        return null
    }

    return <>{children}</>
}
