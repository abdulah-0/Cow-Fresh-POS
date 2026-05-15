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
import { useToast } from '@/components/ui/toast'
import { createCustomerTier, updateCustomerTier } from '@/lib/services/loyaltyService'

interface CustomerTierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tier?: any
    tenantId: string
    onSaved: () => void
}

interface TierFormData {
    name: string
    min_points: number
    discount_percent: number
    color: string
}

export default function CustomerTierDialog({
    open,
    onOpenChange,
    tier,
    tenantId,
    onSaved,
}: CustomerTierDialogProps) {
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<TierFormData>({
        defaultValues: {
            name: '',
            min_points: 0,
            discount_percent: 0,
            color: '#3B82F6',
        },
    })

    useEffect(() => {
        if (tier) {
            reset({
                name: tier.name,
                min_points: tier.min_points,
                discount_percent: tier.discount_percent,
                color: tier.color,
            })
        } else {
            reset({
                name: '',
                min_points: 0,
                discount_percent: 0,
                color: '#3B82F6',
            })
        }
    }, [tier, reset])

    const onSubmit = async (data: TierFormData) => {
        setLoading(true)
        try {
            if (tier) {
                await updateCustomerTier(tier.id, data)
                showToast('success', 'Tier updated successfully')
            } else {
                await createCustomerTier(
                    tenantId,
                    data.name,
                    data.min_points,
                    data.discount_percent,
                    data.color
                )
                showToast('success', 'Tier created successfully')
            }
            onSaved()
        } catch (error) {
            console.error('Error saving tier:', error)
            showToast('error', 'Failed to save tier')
        } finally {
            setLoading(false)
        }
    }

    const presetColors = [
        { name: 'Bronze', color: '#CD7F32' },
        { name: 'Silver', color: '#C0C0C0' },
        { name: 'Gold', color: '#FFD700' },
        { name: 'Platinum', color: '#E5E4E2' },
        { name: 'Diamond', color: '#B9F2FF' },
        { name: 'Blue', color: '#3B82F6' },
        { name: 'Purple', color: '#9333EA' },
        { name: 'Green', color: '#22C55E' },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{tier ? 'Edit Tier' : 'Add New Tier'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tier Name <span className="text-red-500">*</span></Label>
                        <Input
                            {...register('name', { required: true })}
                            placeholder="e.g., Gold, VIP, Premium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Minimum Points <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            {...register('min_points', { required: true, valueAsNumber: true })}
                            placeholder="e.g., 1000"
                        />
                        <p className="text-xs text-gray-500">
                            Customers need this many points to reach this tier
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Discount Percentage <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            step="0.1"
                            {...register('discount_percent', { required: true, valueAsNumber: true })}
                            placeholder="e.g., 5"
                        />
                        <p className="text-xs text-gray-500">
                            Automatic discount for customers in this tier
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Tier Color <span className="text-red-500">*</span></Label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                {...register('color', { required: true })}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                {...register('color', { required: true })}
                                placeholder="#3B82F6"
                                className="flex-1 font-mono"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {presetColors.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => reset({ ...tier, color: preset.color })}
                                    className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                    title={preset.name}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: preset.color }}
                                    />
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
