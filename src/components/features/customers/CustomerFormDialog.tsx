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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { createCustomer, updateCustomer, CustomerInput } from '@/lib/services/customersService'

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: any
    tenantId: string
    onSaved: () => void
}

export default function CustomerFormDialog({
    open,
    onOpenChange,
    customer,
    tenantId,
    onSaved,
}: CustomerFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomerInput>({
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
            discount_percent: 0,
        },
    })

    useEffect(() => {
        if (customer) {
            reset({
                person: {
                    first_name: customer.person.first_name,
                    last_name: customer.person.last_name,
                    email: customer.person.email || '',
                    phone_number: customer.person.phone_number || '',
                    address_1: customer.person.address_1 || '',
                    city: customer.person.city || '',
                    state: customer.person.state || '',
                    zip: customer.person.zip || '',
                    comments: customer.person.comments || '',
                },
                company_name: customer.company_name || '',
                discount_percent: customer.discount_percent || 0,
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
                discount_percent: 0,
            })
        }
    }, [customer, reset])

    const onSubmit = async (data: CustomerInput) => {
        setLoading(true)
        try {
            if (customer) {
                await updateCustomer(customer.id, data)
                showToast('success', 'Customer updated successfully')
            } else {
                await createCustomer(data, tenantId)
                showToast('success', 'Customer created successfully')
            }
            onSaved()
        } catch (error) {
            console.error('Error saving customer:', error)
            showToast('error', 'Failed to save customer')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.first_name', { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name <span className="text-red-500">*</span></Label>
                            <Input {...register('person.last_name', { required: true })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input {...register('company_name')} placeholder="Optional" />
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
                            <Label>Discount %</Label>
                            <Input type="number" step="0.01" {...register('discount_percent', { valueAsNumber: true })} />
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
                            {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
