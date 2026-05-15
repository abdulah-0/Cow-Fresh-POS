'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { recordWastage } from '@/lib/services/wastageService'
import { getItems } from '@/lib/services/itemsService'
import { useToast } from '@/components/ui/toast'

interface RecordWastageDialogProps {
    tenantId: string
    onSuccess: () => void
}

export function RecordWastageDialog({ tenantId, onSuccess }: RecordWastageDialogProps) {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            item_id: '',
            quantity: 1,
            reason: 'Expired',
            wastage_date: new Date().toISOString().split('T')[0],
            reason_details: ''
        }
    })

    useEffect(() => {
        if (open && tenantId) {
            loadItems()
        }
    }, [open, tenantId])

    const loadItems = async () => {
        try {
            const data = await getItems(tenantId)
            setItems(data)
        } catch (error) {
            console.error('Error loading items:', error)
        }
    }

    const onSubmit = async (data: any) => {
        if (!data.item_id) {
            showToast('Please select an item', 'error')
            return
        }

        setLoading(true)
        try {
            const reason = data.reason_details 
                ? `${data.reason}: ${data.reason_details}`
                : data.reason

            await recordWastage({
                item_id: parseInt(data.item_id),
                quantity: parseFloat(data.quantity),
                reason: reason,
                wastage_date: data.wastage_date
            }, tenantId)
            
            showToast('Wastage recorded successfully', 'success')
            setOpen(false)
            reset()
            onSuccess()
        } catch (error) {
            showToast('Failed to record wastage', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Wastage
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-500" />
                        Record Product Loss
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Item</Label>
                        <Select onValueChange={(value: string) => setValue('item_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                                {items.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                        {item.name} ({item.item_number})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                {...register('quantity', { required: true, min: 0.01 })} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input 
                                type="date" 
                                {...register('wastage_date', { required: true })} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select 
                            defaultValue="Expired"
                            onValueChange={(value: string) => setValue('reason', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Expired">Expired</SelectItem>
                                <SelectItem value="Damaged">Damaged</SelectItem>
                                <SelectItem value="Spilled">Spilled</SelectItem>
                                <SelectItem value="Contaminated">Contaminated</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Additional Details</Label>
                        <Textarea 
                            placeholder="Optional details about the loss..."
                            {...register('reason_details')}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                            {loading ? "Recording..." : "Confirm Wastage"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
