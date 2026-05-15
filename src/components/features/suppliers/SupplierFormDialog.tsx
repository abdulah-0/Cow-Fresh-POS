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
import { createSupplier, updateSupplier, SupplierInput } from '@/lib/services/suppliersService'

interface SupplierFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier?: any
    tenantId: string
    onSaved: () => void
}

export default function SupplierFormDialog({
    open,
    onOpenChange,
    supplier,
    tenantId,
    onSaved,
}: SupplierFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierInput>({
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
            company_name: '',
            tax_id: '',
        },
    })

    useEffect(() => {
        if (supplier) {
            reset({
                person: {
                    first_name: supplier.person.first_name,
                    last_name: supplier.person.last_name,
                    email: supplier.person.email || '',
                    phone_number: supplier.person.phone_number || '',
                    address_1: supplier.person.address_1 || '',
                    city: supplier.person.city || '',
                    state: supplier.person.state || '',
                    zip: supplier.person.zip || '',
                    comments: supplier.person.comments || '',
                },
                company_name: supplier.company_name,
                tax_id: supplier.tax_id || '',
            })
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
                company_name: '',
                tax_id: '',
            })
        }
    }, [supplier, reset])

    const onSubmit = async (data: SupplierInput) => {
        setLoading(true)
        try {
            if (supplier) {
                await updateSupplier(supplier.id, data)
                showToast('success', 'Supplier updated successfully')
            } else {
                await createSupplier(data, tenantId)
                showToast('success', 'Supplier created successfully')
            }
            onSaved()
        } catch (error) {
            console.error('Error saving supplier:', error)
            showToast('error', 'Failed to save supplier')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Company Name <span className="text-red-500">*</span></Label>
                        <Input {...register('company_name', { required: true })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact First Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.first_name', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Last Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.last_name', { required: true })} />
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
                                placeholder="e.g., +1 (555) 123-4567"
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
                        <Label>Tax ID</Label>
                        <Input {...register('tax_id')} placeholder="Optional" />
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
                            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
