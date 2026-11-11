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
import { createCustomer, updateCustomer, CustomerInput } from '@/lib/services/customersService'
import { ZoneSelector } from './ZoneSelector'
import { CustomerWhatsAppSection } from './CustomerWhatsAppSection'

interface CustomerFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: any
    onSaved: () => void
}

export default function CustomerFormDialog({
    open,
    onOpenChange,
    customer,
    onSaved,
}: CustomerFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CustomerInput>({
        defaultValues: {
            person: {
                first_name: '',
                last_name: '',
                phone_number: '',
                address_1: '',
                city: '',
                comments: '',
            },
            company_name: '',
            discount_percent: 0,
            zone_id: undefined,
            delivery_address: '',
            whatsapp_phone: '',
            whatsapp_opt_in: false,
        },
    })

    const selectedZoneId = watch('zone_id')

    useEffect(() => {
        if (customer) {
            reset({
                person: {
                    first_name: customer.person?.first_name || '',
                    last_name: customer.person?.last_name || '',
                    phone_number: customer.person?.phone_number || '',
                    address_1: customer.person?.address_1 || '',
                    city: customer.person?.city || '',
                    comments: customer.person?.comments || '',
                },
                company_name: customer.company_name || '',
                discount_percent: customer.discount_percent || 0,
                zone_id: customer.zone_id || undefined,
                delivery_address: customer.delivery_address || customer.person?.address_1 || '',
                whatsapp_phone: customer.whatsapp_phone || customer.person?.phone_number || '',
                whatsapp_opt_in: Boolean(customer.whatsapp_opt_in),
            })
        } else {
            reset({
                person: {
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    address_1: '',
                    city: '',
                    comments: '',
                },
                company_name: '',
                discount_percent: 0,
                zone_id: undefined,
                delivery_address: '',
                whatsapp_phone: '',
                whatsapp_opt_in: false,
            })
        }
    }, [customer, reset])

    const onSubmit = async (data: CustomerInput) => {
        setLoading(true)
        try {
            const finalData = {
                ...data,
                delivery_address: data.delivery_address || data.person.address_1,
            }
            if (customer) {
                await updateCustomer(customer.id, finalData)
                showToast('success', 'Customer updated successfully')
            } else {
                await createCustomer(finalData)
                showToast('success', 'Customer created successfully')
            }
            onSaved()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to save customer:', error)
            showToast('error', 'Failed to save customer. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name *</Label>
                            <Input
                                {...register('person.first_name', { required: 'First name is required' })}
                                placeholder="First name"
                            />
                            {errors.person?.first_name && (
                                <p className="text-sm text-red-500">{errors.person.first_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name *</Label>
                            <Input
                                {...register('person.last_name', { required: 'Last name is required' })}
                                placeholder="Last name"
                            />
                            {errors.person?.last_name && (
                                <p className="text-sm text-red-500">{errors.person.last_name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input {...register('company_name')} placeholder="Optional company" />
                        </div>
                        <div className="space-y-2">
                            <Label>Discount %</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                {...register('discount_percent', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ZoneSelector
                            selectedZoneId={selectedZoneId}
                            onSelectZone={(zoneId) => setValue('zone_id', zoneId)}
                        />
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                {...register('person.phone_number', {
                                    pattern: {
                                        value: /^[\d\s\-\+\(\)]+$/,
                                        message: 'Invalid phone number',
                                    },
                                })}
                                placeholder="e.g., 0300 1234567"
                            />
                            {errors.person?.phone_number && (
                                <p className="text-sm text-red-500">{errors.person.phone_number.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Modular WhatsApp Opt-in Section */}
                    <CustomerWhatsAppSection register={register} />

                    <div className="space-y-2">
                        <Label>Delivery / Street Address</Label>
                        <Input
                            {...register('person.address_1')}
                            placeholder="Plaza, street, sector, house number"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input {...register('person.city')} placeholder="Rawalpindi / Islamabad" />
                        </div>
                        <div className="space-y-2">
                            <Label>Alternate Delivery Address</Label>
                            <Input
                                {...register('delivery_address')}
                                placeholder="Optional specific landmark/gate"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comments / Notes</Label>
                        <Textarea
                            {...register('person.comments')}
                            placeholder="Delivery instructions, preferred times..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
