'use client'

import { createContext, useContext } from 'react'
import type { RoleName } from '@/lib/roleUtils'

interface RoleContextValue {
    roleName: RoleName
    permissions: string[]
    can: (permission: string) => boolean
}

const RoleContext = createContext<RoleContextValue>({
    roleName: 'Cashier',
    permissions: [],
    can: () => false,
})

export function RoleProvider({
    roleName,
    permissions,
    children,
}: {
    roleName: RoleName
    permissions: string[]
    children: React.ReactNode
}) {
    const can = (permission: string) => permissions.includes(permission)

    return (
        <RoleContext.Provider value={{ roleName, permissions, can }}>
            {children}
        </RoleContext.Provider>
    )
}

export function useRole(): RoleContextValue {
    return useContext(RoleContext)
}
