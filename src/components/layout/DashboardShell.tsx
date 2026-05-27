'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import type { RoleName } from '@/lib/roleUtils'

interface DashboardShellProps {
    children: React.ReactNode
    user: any
    roleName: RoleName
}

export function DashboardShell({ children, user, roleName }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()

    // Automatically close mobile sidebar when path changes
    useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50">
            {/* 1. Desktop Sidebar (Permanent left column) */}
            <div className="hidden lg:flex lg:h-full lg:w-64 lg:flex-col lg:flex-shrink-0">
                <Sidebar roleName={roleName} />
            </div>

            {/* 2. Mobile Sliding Drawer Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 h-full transform transition-transform duration-300 ease-in-out lg:hidden",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <Sidebar roleName={roleName} />
            </div>

            {/* 3. Mobile Sidebar Backdrop Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
                />
            )}

            {/* 4. Right Main Area */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                {/* Header (with mobile menu toggler) */}
                <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
                
                {/* Main Content Viewport */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
