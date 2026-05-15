'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Truck } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { getSuppliers, deleteSupplier } from '@/lib/services/suppliersService'
import SupplierFormDialog from '@/components/features/suppliers/SupplierFormDialog'

export default function SuppliersPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSupplierDialog, setShowSupplierDialog] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
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
            loadSuppliers()
        }
    }, [tenantId, searchQuery])

    const loadSuppliers = async () => {
        setLoading(true)
        try {
            const data = await getSuppliers(tenantId, {
                search: searchQuery || undefined,
            })
            setSuppliers(data)
        } catch (error) {
            console.error('Error loading suppliers:', error)
            showToast('error', 'Failed to load suppliers')
        } finally {
            setLoading(false)
        }
    }

    const handleAddSupplier = () => {
        setSelectedSupplier(null)
        setShowSupplierDialog(true)
    }

    const handleEditSupplier = (supplier: any) => {
        setSelectedSupplier(supplier)
        setShowSupplierDialog(true)
    }

    const handleDeleteSupplier = async (supplier: any) => {
        if (!confirm(`Delete supplier "${supplier.company_name}"?`)) {
            return
        }

        try {
            await deleteSupplier(supplier.id)
            showToast('success', 'Supplier deleted successfully')
            loadSuppliers()
        } catch (error) {
            console.error('Error deleting supplier:', error)
            showToast('error', 'Failed to delete supplier')
        }
    }

    const handleSupplierSaved = () => {
        setShowSupplierDialog(false)
        setSelectedSupplier(null)
        loadSuppliers()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Suppliers</h1>
                    <p className="text-gray-500 mt-1">Manage your supplier database</p>
                </div>
                <Button onClick={handleAddSupplier} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search suppliers by company, name, email, or phone..."
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
                        <Truck className="h-5 w-5" />
                        Suppliers ({suppliers.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading suppliers...</div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-12">
                            <Truck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No suppliers found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try a different search term' : 'Add your first supplier to get started'}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Tax ID</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">
                                            {supplier.company_name}
                                        </TableCell>
                                        <TableCell>
                                            {supplier.person.first_name} {supplier.person.last_name}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {supplier.person.email || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {supplier.person.phone_number || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">
                                            {supplier.tax_id || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditSupplier(supplier)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSupplier(supplier)}
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

            <SupplierFormDialog
                open={showSupplierDialog}
                onOpenChange={setShowSupplierDialog}
                supplier={selectedSupplier}
                tenantId={tenantId}
                onSaved={handleSupplierSaved}
            />
        </div>
    )
}
