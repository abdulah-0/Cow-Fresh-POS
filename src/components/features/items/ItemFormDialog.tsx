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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { createItem, updateItem, getCategories, ItemInput } from '@/lib/services/itemsService'
import { getStockLocations } from '@/lib/services/inventoryService'

interface ItemFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item?: any
    tenantId: string
    onSaved: () => void
}

export default function ItemFormDialog({
    open,
    onOpenChange,
    item,
    tenantId,
    onSaved,
}: ItemFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [newCategory, setNewCategory] = useState('')
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [initialStock, setInitialStock] = useState(0)
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
    const { showToast } = useToast()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ItemInput>({
        defaultValues: {
            name: '',
            item_number: '',
            description: '',
            category: '',
            cost_price: 0,
            unit_price: 0,
            reorder_level: 0,
            allow_alt_description: false,
            is_serialized: false,
        },
    })

    const selectedCategory = watch('category')

    // Load categories and locations
    useEffect(() => {
        if (open && tenantId) {
            loadCategories()
            loadLocations()
        }
    }, [open, tenantId])

    // Populate form when editing
    useEffect(() => {
        if (item) {
            reset({
                name: item.name,
                item_number: item.item_number,
                description: item.description || '',
                category: item.category || '',
                cost_price: item.cost_price,
                unit_price: item.unit_price,
                reorder_level: item.reorder_level || 0,
                allow_alt_description: item.allow_alt_description || false,
                is_serialized: item.is_serialized || false,
            })
        } else {
            reset({
                name: '',
                item_number: '',
                description: '',
                category: '',
                cost_price: 0,
                unit_price: 0,
                reorder_level: 0,
                allow_alt_description: false,
                is_serialized: false,
            })
        }
    }, [item, reset])

    const loadCategories = async () => {
        try {
            const cats = await getCategories(tenantId)
            setCategories(cats)
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadLocations = async () => {
        try {
            const locs = await getStockLocations(tenantId)
            setLocations(locs)
            if (locs.length > 0 && !selectedLocation) {
                setSelectedLocation(locs[0].id)
            }
        } catch (error) {
            console.error('Error loading locations:', error)
        }
    }

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            setCategories([...categories, newCategory.trim()])
            setValue('category', newCategory.trim())
            setNewCategory('')
            setShowNewCategory(false)
        }
    }

    const onSubmit = async (data: ItemInput) => {
        setLoading(true)
        try {
            if (item) {
                // Update existing item
                await updateItem(item.id, data)
                showToast('success', 'Item updated successfully')
            } else {
                // Create new item with initial stock
                await createItem(data, tenantId, initialStock, selectedLocation || undefined)
                showToast('success', 'Item created successfully')
            }
            onSaved()
        } catch (error) {
            console.error('Error saving item:', error)
            showToast('error', 'Failed to save item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                {...register('name', { required: 'Item name is required' })}
                                placeholder="Enter item name"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="item_number">Item Number</Label>
                            <Input
                                id="item_number"
                                {...register('item_number')}
                                placeholder="Auto-generated if empty"
                            />
                            <p className="text-xs text-gray-500">Leave empty to auto-generate</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Enter item description"
                            rows={3}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        {!showNewCategory ? (
                            <div className="flex gap-2">
                                <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => setValue('category', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewCategory(true)}
                                >
                                    New
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Enter new category"
                                />
                                <Button type="button" onClick={handleAddCategory}>
                                    Add
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowNewCategory(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost_price">
                                Cost Price <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="cost_price"
                                type="number"
                                step="0.01"
                                {...register('cost_price', {
                                    required: 'Cost price is required',
                                    min: { value: 0, message: 'Must be positive' },
                                })}
                                placeholder="0.00"
                            />
                            {errors.cost_price && (
                                <p className="text-sm text-red-500">{errors.cost_price.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit_price">
                                Unit Price <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="unit_price"
                                type="number"
                                step="0.01"
                                {...register('unit_price', {
                                    required: 'Unit price is required',
                                    min: { value: 0, message: 'Must be positive' },
                                })}
                                placeholder="0.00"
                            />
                            {errors.unit_price && (
                                <p className="text-sm text-red-500">{errors.unit_price.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Reorder Level */}
                    <div className="space-y-2">
                        <Label htmlFor="reorder_level">Reorder Level</Label>
                        <Input
                            id="reorder_level"
                            type="number"
                            {...register('reorder_level', {
                                min: { value: 0, message: 'Must be positive' },
                            })}
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500">
                            Alert when stock falls below this level
                        </p>
                    </div>

                    {/* Initial Stock (only for new items) */}
                    {!item && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="initial_stock">Initial Stock Quantity</Label>
                                    <Input
                                        id="initial_stock"
                                        type="number"
                                        value={initialStock}
                                        onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                                        min="0"
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Starting inventory quantity
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Stock Location</Label>
                                    <Select
                                        value={selectedLocation?.toString()}
                                        onValueChange={(value) => setSelectedLocation(parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.id.toString()}>
                                                    {loc.location_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Where to store this item
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allow_alt_description"
                                {...register('allow_alt_description')}
                            />
                            <Label htmlFor="allow_alt_description" className="cursor-pointer">
                                Allow alternative description in sales
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="is_serialized" {...register('is_serialized')} />
                            <Label htmlFor="is_serialized" className="cursor-pointer">
                                Track by serial number
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
