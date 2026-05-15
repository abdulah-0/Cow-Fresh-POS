export type RoleName = 'Admin' | 'Manager' | 'Cashier' | string

/**
 * Map of which roles can access which route segments.
 * Key is the last segment of the pathname (e.g. "items", "settings").
 */
export const ROUTE_ROLES: Record<string, RoleName[]> = {
    dashboard: ['Admin', 'Manager'],
    sales: ['Admin', 'Manager', 'Cashier'],
    'sales-history': ['Admin', 'Manager', 'Cashier'],
    items: ['Admin', 'Manager'],
    receiving: ['Admin', 'Manager'],
    locations: ['Admin', 'Manager'],
    customers: ['Admin', 'Manager', 'Cashier'],
    loyalty: ['Admin', 'Manager'],
    suppliers: ['Admin'],
    employees: ['Admin'],
    reports: ['Admin', 'Manager'],
    settings: ['Admin'],
}

/**
 * Returns the default/home route for a given role.
 */
export function getDefaultRoute(tenantSlug: string, roleName: RoleName): string {
    if (roleName === 'Cashier') return `/${tenantSlug}/sales`
    return `/${tenantSlug}/dashboard`
}

/**
 * Check if a role can access a given route segment.
 */
export function canAccessRoute(roleName: RoleName, routeSegment: string): boolean {
    const allowed = ROUTE_ROLES[routeSegment]
    if (!allowed) return true // unknown routes are open (404 will handle)
    return allowed.includes(roleName)
}
