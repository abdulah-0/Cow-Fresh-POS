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
import { getZones } from '@/lib/services/zoneService'
import type { Zone } from '@/types'

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
    const [zones, setZones] = useState<Zone[]>([])
    const [zoneSearch, setZoneSearch] = useState('')
    const [showZoneDropdown, setShowZoneDropdown] = useState(false)
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CustomerInput>({
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
        },
    })

    useEffect(() => {
        async function loadZones() {
            try {
                const data = await getZones()
                setZones(data)
            } catch (error) {
                console.error('Failed to load zones:', error)
            }
        }
        loadZones()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.zone-selector-container')) {
                setShowZoneDropdown(false)
                if (selectedZone) {
                    setZoneSearch(selectedZone.zone_name)
                } else {
                    setZoneSearch('')
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [selectedZone])

    useEffect(() => {
        if (customer) {
            const custZone = zones.find(z => z.id === customer.zone_id)
            setSelectedZone(custZone || null)
            setZoneSearch(custZone ? custZone.zone_name : '')

            reset({
                person: {
                    first_name: customer.person.first_name,
                    last_name: customer.person.last_name,
                    phone_number: customer.person.phone_number || '',
                    address_1: customer.person.address_1 || '',
                    city: customer.person.city || '',
                    comments: customer.person.comments || '',
                },
                company_name: customer.company_name || '',
                discount_percent: customer.discount_percent || 0,
                zone_id: customer.zone_id || undefined,
                delivery_address: customer.delivery_address || customer.person?.address_1 || '',
            })
        } else {
            setSelectedZone(null)
            setZoneSearch('')

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
            })
        }
    }, [customer, reset, zones])

    const onSubmit = async (data: CustomerInput) => {
        setLoading(true)
        try {
            const finalData = {
                ...data,
                delivery_address: data.delivery_address || data.person.address_1
            }
            if (customer) {
                await updateCustomer(customer.id, finalData)
                showToast('success', 'Customer updated successfully')
            } else {
                await createCustomer(finalData)
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
                        <div className="space-y-2 relative zone-selector-container">
                            <Label>Delivery Zone</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Search and select zone..."
                                    value={zoneSearch}
                                    onChange={(e) => {
                                        setZoneSearch(e.target.value)
                                        setShowZoneDropdown(true)
                                        if (!e.target.value) {
                                            setValue('zone_id', undefined)
                                            setSelectedZone(null)
                                        }
                                    }}
                                    onFocus={() => setShowZoneDropdown(true)}
                                    className="w-full text-black dark:text-white"
                                />
                                {showZoneDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto bg-white dark:bg-zinc-950 border-input">
                                        {zones.filter(z => z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase())).length > 0 ? (
                                            zones.filter(z => z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase())).map((zone) => (
                                                <div
                                                    key={zone.id}
                                                    className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm text-black dark:text-white"
                                                    onClick={() => {
                                                        setValue('zone_id', zone.id)
                                                        setSelectedZone(zone)
                                                        setZoneSearch(zone.zone_name)
                                                        setShowZoneDropdown(false)
                                                    }}
                                                >
                                                    {zone.zone_name} {zone.description ? `(${zone.description})` : ''}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No zones found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input type="hidden" {...register('zone_id')} />
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input {...register('person.city')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Discount %</Label>
                            <Input type="number" step="0.01" {...register('discount_percent', { valueAsNumber: true })} />
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
                            {loading ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
