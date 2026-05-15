'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Truck,
    UserCog,
    BarChart3,
    MapPin,
    Package2,
    Award,
    FileText,
    Zap,
    Settings2,
    BookOpen,
    Wallet,
} from 'lucide-react'
import type { RoleName } from '@/lib/roleUtils'

interface SidebarProps {
    tenantSlug?: string
    roleName?: RoleName
}

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    group: string
    roles: RoleName[]
}

export function Sidebar({ tenantSlug, roleName = 'Cashier' }: SidebarProps) {
    const pathname = usePathname()
    const baseUrl = tenantSlug ? `/${tenantSlug}` : ''

    const navigation: NavItem[] = [
        { name: 'Dashboard', href: `${baseUrl}/dashboard`, icon: LayoutDashboard, group: 'main', roles: ['Admin', 'Manager'] },
        { name: 'POS Register', href: `${baseUrl}/sales`, icon: ShoppingCart, group: 'main', roles: ['Admin', 'Manager', 'Cashier'] },
        { name: 'Sales History', href: `${baseUrl}/sales-history`, icon: FileText, group: 'main', roles: ['Admin', 'Manager', 'Cashier'] },
        { name: 'Items', href: `${baseUrl}/items`, icon: Package, group: 'inventory', roles: ['Admin', 'Manager'] },
        { name: 'Receiving', href: `${baseUrl}/receiving`, icon: Package2, group: 'inventory', roles: ['Admin', 'Manager'] },
        { name: 'Locations', href: `${baseUrl}/locations`, icon: MapPin, group: 'inventory', roles: ['Admin', 'Manager'] },
        { name: 'Customers', href: `${baseUrl}/customers`, icon: Users, group: 'people', roles: ['Admin', 'Manager', 'Cashier'] },
        { name: 'Loyalty', href: `${baseUrl}/loyalty`, icon: Award, group: 'people', roles: ['Admin', 'Manager'] },
        { name: 'Suppliers', href: `${baseUrl}/suppliers`, icon: Truck, group: 'people', roles: ['Admin'] },
        { name: 'Employees', href: `${baseUrl}/employees`, icon: UserCog, group: 'people', roles: ['Admin'] },
        { name: 'Reports', href: `${baseUrl}/reports`, icon: BarChart3, group: 'reports', roles: ['Admin', 'Manager'] },
        { name: 'Supplier Ledger', href: `${baseUrl}/ledgers/supplier`, icon: BookOpen, group: 'finance', roles: ['Admin', 'Manager'] },
        { name: 'Customer Ledger', href: `${baseUrl}/ledgers/customer`, icon: BookOpen, group: 'finance', roles: ['Admin', 'Manager', 'Cashier'] },
        { name: 'Expenses', href: `${baseUrl}/expenses`, icon: Wallet, group: 'finance', roles: ['Admin', 'Manager'] },
        { name: 'Financial Summary', href: `${baseUrl}/ledgers/summary`, icon: BarChart3, group: 'finance', roles: ['Admin'] },
        { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings2, group: 'reports', roles: ['Admin'] },
    ]

    const groups = [
        { key: 'main', label: 'Sales' },
        { key: 'inventory', label: 'Inventory' },
        { key: 'people', label: 'People' },
        { key: 'finance', label: 'Finance' },
        { key: 'reports', label: 'Analytics' },
    ]

    // Filter nav by the current user's role
    const allowedNav = navigation.filter(item => item.roles.includes(roleName))

    return (
        <div className="flex h-full w-64 flex-col" style={{
            background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}>
            {/* Logo */}
            <div className="flex h-16 items-center px-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">POS Cloud</h1>
                        <p className="text-[10px] text-purple-300 font-medium tracking-wider uppercase">Point of Sale</p>
                    </div>
                </div>
            </div>

            {/* Role badge */}
            <div className="px-5 py-2 border-b border-white/5">
                <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                    roleName === 'Admin' && 'bg-purple-500/20 text-purple-300',
                    roleName === 'Manager' && 'bg-blue-500/20 text-blue-300',
                    roleName === 'Cashier' && 'bg-green-500/20 text-green-300',
                    !['Admin', 'Manager', 'Cashier'].includes(roleName) && 'bg-gray-500/20 text-gray-300',
                )}>
                    {roleName}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {groups.map((group) => {
                    const groupItems = allowedNav.filter(item => item.group === group.key)
                    if (groupItems.length === 0) return null
                    return (
                        <div key={group.key} className="mb-5">
                            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-widest uppercase text-purple-400/70">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {groupItems.map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                                            )}
                                        >
                                            {isActive && (
                                                <div
                                                    className="absolute inset-0 rounded-lg"
                                                    style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.3) 0%, rgba(118,75,162,0.3) 100%)' }}
                                                />
                                            )}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full"
                                                    style={{ background: 'linear-gradient(180deg, #667eea, #764ba2)' }} />
                                            )}
                                            <item.icon
                                                className={cn(
                                                    'relative h-4 w-4 flex-shrink-0 transition-all duration-150',
                                                    isActive
                                                        ? 'text-purple-300'
                                                        : 'text-purple-400/50 group-hover:text-purple-300'
                                                )}
                                            />
                                            <span className="relative">{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </nav>

            {/* Bottom version badge */}
            <div className="px-4 py-3 border-t border-white/10">
                <p className="text-center text-[10px] text-purple-400/50">v1.0 · Cloud POS</p>
            </div>
        </div>
    )
}
