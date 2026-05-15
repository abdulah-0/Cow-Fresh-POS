'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, User, Plus } from 'lucide-react'
import CustomerFormDialog from '@/components/features/customers/CustomerFormDialog'

interface CustomerWithPerson {
    id: number
    tenant_id: string
    person_id: number
    company_name?: string
    account_number?: string
    taxable: boolean
    discount_percent: number
    deleted: boolean
    created_at: string
    updated_at: string
    person?: {
        first_name: string
        last_name: string
        phone_number: string
        email: string
    }
}

interface CustomerSelectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectCustomer: (customer: CustomerWithPerson) => void
    tenantId: string
}

export default function CustomerSelectDialog({
    open,
    onOpenChange,
    onSelectCustomer,
    tenantId,
}: CustomerSelectDialogProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [customers, setCustomers] = useState<CustomerWithPerson[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [showCustomerForm, setShowCustomerForm] = useState(false)

    const searchCustomers = useCallback(async (query: string) => {
        if (!query.trim() || !tenantId) {
            setCustomers([])
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()

            // Search customers by name, phone, or email
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    person:people (
                        first_name,
                        last_name,
                        phone_number,
                        email
                    )
                `)
                .eq('tenant_id', tenantId)
                .eq('deleted', false)
                .or(`company_name.ilike.%${query}%,person.first_name.ilike.%${query}%,person.last_name.ilike.%${query}%,person.phone_number.ilike.%${query}%`)
                .limit(20)

            if (error) throw error

            setCustomers((data || []) as CustomerWithPerson[])
            setSelectedIndex(0)
        } catch (error) {
            console.error('Error searching customers:', error)
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchCustomers(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, searchCustomers])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open || customers.length === 0) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((prev) => Math.min(prev + 1, customers.length - 1))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((prev) => Math.max(prev - 1, 0))
                    break
                case 'Enter':
                    e.preventDefault()
                    if (customers[selectedIndex]) {
                        handleSelectCustomer(customers[selectedIndex])
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    onOpenChange(false)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, customers, selectedIndex])

    const handleSelectCustomer = (customer: CustomerWithPerson) => {
        onSelectCustomer(customer)
        onOpenChange(false)
        setSearchQuery('')
        setCustomers([])
    }

    const handleNewCustomer = () => {
        setShowCustomerForm(true)
    }

    const handleCustomerSaved = () => {
        setShowCustomerForm(false)
        // Refresh search to show new customer
        if (searchQuery) {
            searchCustomers(searchQuery)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Select Customer
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search by name, phone, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                className="flex-1"
                            />
                            <Button variant="outline" onClick={handleNewCustomer}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Customer
                            </Button>
                        </div>

                        {loading && (
                            <div className="text-center py-8 text-gray-500">
                                Searching...
                            </div>
                        )}

                        {!loading && searchQuery && customers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <User className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                <p>No customers found</p>
                                <p className="text-sm">Try a different search term or create a new customer</p>
                            </div>
                        )}

                        {!loading && customers.length > 0 && (
                            <div className="flex-1 overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Discount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customers.map((customer, index) => (
                                            <TableRow
                                                key={customer.id}
                                                onClick={() => handleSelectCustomer(customer)}
                                                className={`cursor-pointer transition-colors ${index === selectedIndex
                                                    ? 'bg-blue-50 dark:bg-blue-950'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {customer.person?.first_name} {customer.person?.last_name}
                                                        </div>
                                                        {!customer.taxable && (
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                Tax Exempt
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.company_name || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {customer.person?.phone_number || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {customer.person?.email || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {customer.discount_percent > 0 && (
                                                        <Badge variant="secondary">
                                                            {customer.discount_percent}%
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {customers.length > 0 && (
                            <div className="text-sm text-gray-500 text-center">
                                Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <CustomerFormDialog
                open={showCustomerForm}
                onOpenChange={setShowCustomerForm}
                tenantId={tenantId}
                onSaved={handleCustomerSaved}
            />
        </>
    )
}
