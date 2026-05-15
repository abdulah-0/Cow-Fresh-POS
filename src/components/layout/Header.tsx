'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Settings, Building2, ShoppingCart, ChevronRight } from 'lucide-react'
import { Tenant } from '@/types'

interface HeaderProps {
    user?: {
        email?: string
        user_metadata?: {
            full_name?: string
        }
    }
    tenant?: Tenant
}

const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    sales: 'POS Register',
    'sales-history': 'Sales History',
    items: 'Items',
    receiving: 'Receiving',
    locations: 'Locations',
    customers: 'Customers',
    loyalty: 'Loyalty',
    suppliers: 'Suppliers',
    employees: 'Employees',
    reports: 'Reports',
}

export function Header({ user, tenant }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const initials = user?.user_metadata?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase() || user?.email?.[0].toUpperCase() || 'U'

    const displayName = user?.user_metadata?.full_name || user?.email || 'User'

    // Build breadcrumb from pathname
    const segments = pathname?.split('/').filter(Boolean) || []
    const currentPage = segments[segments.length - 1]
    const pageLabel = routeLabels[currentPage] || currentPage

    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                {tenant && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{tenant.name}</span>
                        </div>
                        {pageLabel && (
                            <>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                                <span className="text-gray-500 font-medium">{pageLabel}</span>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Right: Actions + User */}
            <div className="flex items-center gap-3">
                {/* Quick New Sale button */}
                {tenant && currentPage !== 'sales' && (
                    <Button
                        size="sm"
                        onClick={() => router.push(`/${tenant.slug}/sales`)}
                        className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        New Sale
                    </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-purple-200 transition-all">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-0.5 py-1">
                                <p className="text-sm font-semibold leading-none text-gray-900">
                                    {displayName}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground mt-1">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/${tenant?.slug}/settings`)} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4 text-gray-500" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
