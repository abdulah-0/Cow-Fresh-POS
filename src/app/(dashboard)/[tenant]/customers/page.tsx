'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { getCustomers, deleteCustomer } from '@/lib/services/customersService'
import CustomerFormDialog from '@/components/features/customers/CustomerFormDialog'
import CustomerHistoryDialog from '@/components/features/customers/CustomerHistoryDialog'

export default function CustomersPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCustomerDialog, setShowCustomerDialog] = useState(false)
    const [showHistoryDialog, setShowHistoryDialog] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const { showToast } = useToast()

    useEffect(() => {
        async function loadTenant() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
            }
        }
        loadTenant()
    }, [tenantSlug])

    useEffect(() => {
        if (tenantId) {
            loadCustomers()
        }
    }, [tenantId, searchQuery])

    const loadCustomers = async () => {
        setLoading(true)
        try {
            const data = await getCustomers(tenantId, {
                search: searchQuery || undefined,
            })
            setCustomers(data)
        } catch (error) {
            console.error('Error loading customers:', error)
            showToast('error', 'Failed to load customers')
        } finally {
            setLoading(false)
        }
    }

    const handleAddCustomer = () => {
        setSelectedCustomer(null)
        setShowCustomerDialog(true)
    }

    const handleEditCustomer = (customer: any) => {
        setSelectedCustomer(customer)
        setShowCustomerDialog(true)
    }

    const handleViewHistory = (customer: any) => {
        setSelectedCustomer(customer)
        setShowHistoryDialog(true)
    }

    const handleDeleteCustomer = async (customer: any) => {
        if (!confirm(`Delete customer "${customer.person.first_name} ${customer.person.last_name}"?`)) {
            return
        }

        try {
            await deleteCustomer(customer.id)
            showToast('success', 'Customer deleted successfully')
            loadCustomers()
        } catch (error) {
            console.error('Error deleting customer:', error)
            showToast('error', 'Failed to delete customer')
        }
    }

    const handleCustomerSaved = () => {
        setShowCustomerDialog(false)
        setSelectedCustomer(null)
        loadCustomers()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customers</h1>
                    <p className="text-gray-500 mt-1">Manage your customer database</p>
                </div>
                <Button onClick={handleAddCustomer} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search customers by name, email, phone, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Customers ({customers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No customers found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try a different search term' : 'Add your first customer to get started'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {customer.person.first_name} {customer.person.last_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.company_name || '-'}</TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {customer.person.email || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {customer.person.phone_number || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {customer.discount_percent > 0 ? (
                                                <Badge variant="outline">{customer.discount_percent}%</Badge>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!customer.taxable && (
                                                <Badge className="bg-green-600">Tax Exempt</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewHistory(customer)}
                                                    title="View Purchase History"
                                                >
                                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditCustomer(customer)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteCustomer(customer)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CustomerFormDialog
                open={showCustomerDialog}
                onOpenChange={setShowCustomerDialog}
                customer={selectedCustomer}
                tenantId={tenantId}
                onSaved={handleCustomerSaved}
            />

            <CustomerHistoryDialog
                open={showHistoryDialog}
                onOpenChange={setShowHistoryDialog}
                customer={selectedCustomer}
            />
        </div>
    )
}
