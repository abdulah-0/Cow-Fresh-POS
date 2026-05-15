'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Users, BarChart } from 'lucide-react'
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
import { getEmployees, deleteEmployee } from '@/lib/services/employeesService'
import EmployeeFormDialog from '@/components/features/employees/EmployeeFormDialog'
import ClientRoleGuard from '@/components/providers/ClientRoleGuard'

export default function EmployeesPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
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
            loadEmployees()
        }
    }, [tenantId, searchQuery])

    const loadEmployees = async () => {
        setLoading(true)
        try {
            const data = await getEmployees(tenantId, {
                search: searchQuery || undefined,
            })
            setEmployees(data)
        } catch (error) {
            console.error('Error loading employees:', error)
            showToast('error', 'Failed to load employees')
        } finally {
            setLoading(false)
        }
    }

    const handleAddEmployee = () => {
        setSelectedEmployee(null)
        setShowEmployeeDialog(true)
    }

    const handleEditEmployee = (employee: any) => {
        setSelectedEmployee(employee)
        setShowEmployeeDialog(true)
    }

    const handleDeleteEmployee = async (employee: any) => {
        if (!confirm(`Delete employee "${employee.person.first_name} ${employee.person.last_name}"?`)) {
            return
        }

        try {
            await deleteEmployee(employee.id)
            showToast('success', 'Employee deleted successfully')
            loadEmployees()
        } catch (error) {
            console.error('Error deleting employee:', error)
            showToast('error', 'Failed to delete employee')
        }
    }

    const handleEmployeeSaved = () => {
        setShowEmployeeDialog(false)
        setSelectedEmployee(null)
        loadEmployees()
    }

    return (
        <ClientRoleGuard routeSegment="employees" tenantSlug={tenantSlug}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Employees</h1>
                        <p className="text-gray-500 mt-1">Manage your team members</p>
                    </div>
                    <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search employees by name, email, or username..."
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
                            Employees ({employees.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading employees...</div>
                        ) : employees.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">No employees found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchQuery ? 'Try a different search term' : 'Add your first employee to get started'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {employee.person.first_name} {employee.person.last_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {employee.username}
                                            </TableCell>
                                            <TableCell>
                                                {employee.role ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            employee.role.name === 'Admin' ? 'text-purple-700 bg-purple-50 border-purple-200' :
                                                                employee.role.name === 'Manager' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                                                    'text-green-700 bg-green-50 border-green-200'
                                                        }
                                                    >
                                                        {employee.role.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {employee.person.email || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {employee.person.phone_number || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-600">Active</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditEmployee(employee)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteEmployee(employee)}
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

                <EmployeeFormDialog
                    open={showEmployeeDialog}
                    onOpenChange={setShowEmployeeDialog}
                    employee={selectedEmployee}
                    tenantId={tenantId}
                    onSaved={handleEmployeeSaved}
                />
            </div>
        </ClientRoleGuard>
    )
}
