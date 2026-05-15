'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createEmployee, updateEmployee, EmployeeInput } from '@/lib/services/employeesService'
import { getRoles, assignRoleToEmployee, type Role } from '@/lib/services/rolesService'
import { Shield } from 'lucide-react'

interface EmployeeFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee?: any
    tenantId: string
    onSaved: () => void
}

export default function EmployeeFormDialog({
    open,
    onOpenChange,
    employee,
    tenantId,
    onSaved,
}: EmployeeFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('')
    const { showToast } = useToast()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeInput>({
        defaultValues: {
            person: {
                first_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                address_1: '',
                city: '',
                state: '',
                zip: '',
                comments: '',
            },
            username: '',
            password: '',
        },
    })

    // Fetch roles when dialog opens
    useEffect(() => {
        if (open && tenantId) {
            getRoles(tenantId).then(setRoles)
        }
    }, [open, tenantId])

    useEffect(() => {
        if (employee) {
            reset({
                person: {
                    first_name: employee.person.first_name,
                    last_name: employee.person.last_name,
                    email: employee.person.email || '',
                    phone_number: employee.person.phone_number || '',
                    address_1: employee.person.address_1 || '',
                    city: employee.person.city || '',
                    state: employee.person.state || '',
                    zip: employee.person.zip || '',
                    comments: employee.person.comments || '',
                },
                username: employee.username,
                password: '',
            })
            setSelectedRoleId(employee.role_id ?? '')
        } else {
            reset({
                person: {
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone_number: '',
                    address_1: '',
                    city: '',
                    state: '',
                    zip: '',
                    comments: '',
                },
                username: '',
                password: '',
            })
            setSelectedRoleId('')
        }
    }, [employee, reset])

    const onSubmit = async (data: EmployeeInput) => {
        setLoading(true)
        try {
            let savedEmployee: any
            if (employee) {
                savedEmployee = await updateEmployee(employee.id, data)
                showToast('success', 'Employee updated successfully')
            } else {
                savedEmployee = await createEmployee(data, tenantId)
                showToast('success', 'Employee created successfully')
            }

            // Assign role if one was selected
            const empId = savedEmployee?.id ?? employee?.id
            if (empId && selectedRoleId !== '') {
                await assignRoleToEmployee(empId, Number(selectedRoleId))
            }

            onSaved()
        } catch (error) {
            console.error('Error saving employee:', error)
            showToast('error', 'Failed to save employee')
        } finally {
            setLoading(false)
        }
    }

    const roleColors: Record<string, string> = {
        Admin: 'text-purple-700 bg-purple-50 border-purple-200',
        Manager: 'text-blue-700 bg-blue-50 border-blue-200',
        Cashier: 'text-green-700 bg-green-50 border-green-200',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{employee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Role selector — first and most important */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-purple-500" />
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {roles.length === 0 ? (
                                <p className="text-sm text-gray-400">Loading roles...</p>
                            ) : (
                                roles.map((role) => {
                                    const isSelected = selectedRoleId === role.id
                                    const colorClass = roleColors[role.name] ?? 'text-gray-700 bg-gray-50 border-gray-200'
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setSelectedRoleId(role.id)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${isSelected
                                                    ? colorClass + ' ring-2 ring-offset-1 ring-current shadow-sm'
                                                    : 'text-gray-500 bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {role.name}
                                            {role.description && (
                                                <span className="ml-1.5 font-normal text-xs opacity-70">
                                                    — {role.description}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                        {selectedRoleId === '' && (
                            <p className="text-xs text-amber-500">Please select a role for this employee</p>
                        )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.first_name', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.last_name', { required: true })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input
                                {...register('username', { required: true })}
                                placeholder="employee.username"
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Password {!employee && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                                type="password"
                                {...register('password', { required: !employee })}
                                placeholder={employee ? 'Leave blank to keep current' : 'Enter password'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                {...register('person.email', {
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                            />
                            {errors.person?.email && (
                                <p className="text-sm text-red-500">{errors.person.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                {...register('person.phone_number', {
                                    pattern: {
                                        value: /^[\d\s\-\+\(\)]+$/,
                                        message: 'Invalid phone number'
                                    }
                                })}
                                placeholder="e.g., +92 300 0000000"
                            />
                            {errors.person?.phone_number && (
                                <p className="text-sm text-red-500">{errors.person.phone_number.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input {...register('person.address_1')} placeholder="Street address" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input {...register('person.city')} />
                        </div>
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Input {...register('person.state')} />
                        </div>
                        <div className="space-y-2">
                            <Label>ZIP</Label>
                            <Input {...register('person.zip')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comments</Label>
                        <Textarea {...register('person.comments')} rows={3} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
