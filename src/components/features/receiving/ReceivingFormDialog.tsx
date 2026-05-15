'use client'
// Trigger Vercel update for receiving flow

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { createReceiving, getSuppliers, ReceivingInput } from '@/lib/services/receivingService'
import { getItems } from '@/lib/services/itemsService'
import { getStockLocations } from '@/lib/services/inventoryService'

interface ReceivingFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenantId: string
    employeeId: number
    onSaved: () => void
}

export default function ReceivingFormDialog({
    open,
    onOpenChange,
    tenantId,
    employeeId,
    onSaved,
}: ReceivingFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const { showToast } = useToast()

    const { register, handleSubmit, control, watch, setValue, reset } = useForm<ReceivingInput>({
        defaultValues: {
            supplier_id: undefined,
            reference: '',
            payment_type: '',
            comment: '',
            total_amount: 0,
            items: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    })

    const receivingItems = watch('items')

    useEffect(() => {
        if (open && tenantId) {
            loadData()
        }
    }, [open, tenantId])

    const loadData = async () => {
        try {
            const [suppliersData, itemsData, locationsData] = await Promise.all([
                getSuppliers(tenantId),
                getItems(tenantId),
                getStockLocations(tenantId),
            ])
            setSuppliers(suppliersData)
            setItems(itemsData)
            setLocations(locationsData)
        } catch (error) {
            console.error('Error loading data:', error)
        }
    }

    const handleAddItem = () => {
        append({
            item_id: 0,
            quantity_purchased: 1,
            item_cost_price: 0,
            item_unit_price: 0,
            discount_percent: 0,
            item_location: locations[0]?.id || 1,
        })
    }

    const calculateTotal = () => {
        if (receivingItems.length === 0) return watch('total_amount') || 0
        return receivingItems.reduce((sum, item) => {
            const itemTotal = item.item_unit_price * item.quantity_purchased
            const discount = itemTotal * (item.discount_percent / 100)
            return sum + (itemTotal - discount)
        }, 0)
    }

    // Update total_amount when items change
    useEffect(() => {
        if (receivingItems.length > 0) {
            const total = calculateTotal()
            setValue('total_amount', total)
        }
    }, [receivingItems, setValue])

    const onSubmit = async (data: ReceivingInput) => {
        if (data.items.length === 0 && (!data.total_amount || data.total_amount <= 0)) {
            showToast('error', 'Please add items or enter a total amount')
            return
        }

        setLoading(true)
        try {
            await createReceiving(data, tenantId, employeeId)
            showToast('success', 'Receiving created successfully')
            reset()
            onSaved()
        } catch (error) {
            console.error('Error creating receiving:', error)
            showToast('error', 'Failed to create receiving')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>New Receiving</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    <form id="receiving-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Supplier</Label>
                            <Select
                                value={watch('supplier_id')?.toString()}
                                onValueChange={(value) => setValue('supplier_id', parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reference (PO #, Invoice #)</Label>
                            <Input {...register('reference')} placeholder="Optional" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select
                                value={watch('payment_type')}
                                onValueChange={(value) => setValue('payment_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Comment</Label>
                            <Input {...register('comment')} placeholder="Optional notes" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Total Amount (Manual)</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-gray-500">PKR</div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-12"
                                    {...register('total_amount', { valueAsNumber: true })}
                                    disabled={receivingItems.length > 0}
                                    placeholder="0.00"
                                />
                            </div>
                            {receivingItems.length > 0 && (
                                <p className="text-xs text-blue-600 italic">
                                    Locked: Calculated from items below
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Items</Label>
                            <Button type="button" onClick={handleAddItem} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {fields.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Current</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">New Stock</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => {
                                            const item = receivingItems[index]
                                            const selectedItem = items.find(i => i.id === item.item_id)
                                            const itemTotal = item.item_unit_price * item.quantity_purchased
                                            const discount = itemTotal * (item.discount_percent / 100)
                                            const total = itemTotal - discount
                                            const currentStock = selectedItem?.stock_quantity || 0
                                            const newStock = currentStock + (item.quantity_purchased || 0)

                                            return (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <Select
                                                            value={item.item_id?.toString()}
                                                            onValueChange={(value) => {
                                                                const sItem = items.find(i => i.id === parseInt(value))
                                                                setValue(`items.${index}.item_id`, parseInt(value))
                                                                if (sItem) {
                                                                    setValue(`items.${index}.item_cost_price`, sItem.cost_price)
                                                                    setValue(`items.${index}.item_unit_price`, sItem.unit_price)
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Select item" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {items.map((i) => (
                                                                    <SelectItem key={i.id} value={i.id.toString()}>
                                                                        {i.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={item.item_location?.toString()}
                                                            onValueChange={(value) => setValue(`items.${index}.item_location`, parseInt(value))}
                                                        >
                                                            <SelectTrigger className="w-[110px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {locations.map((loc) => (
                                                                    <SelectItem key={loc.id} value={loc.id.toString()}>
                                                                        {loc.location_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-gray-500">
                                                        {currentStock}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            className="w-16 text-right"
                                                            {...register(`items.${index}.quantity_purchased`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-20 text-right"
                                                            {...register(`items.${index}.item_cost_price`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-20 text-right"
                                                            {...register(`items.${index}.item_unit_price`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {total.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-blue-600">
                                                        {newStock}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => remove(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </form>
                </div>

                <DialogFooter className="p-6 border-t bg-gray-50">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="receiving-form" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Receiving'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
