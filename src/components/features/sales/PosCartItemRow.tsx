'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { CartItem } from '@/types'

interface PosCartItemRowProps {
    item: CartItem
    onUpdateQuantity: (id: number, qty: number) => void
    onRemoveItem: (id: number) => void
}

export function PosCartItemRow({
    item,
    onUpdateQuantity,
    onRemoveItem,
}: PosCartItemRowProps) {
    const itemTotal = item.price * item.quantity
    const discountAmount =
        item.discount_type === 'percent'
            ? itemTotal * (item.discount / 100)
            : item.discount
    const finalTotal = itemTotal - discountAmount

    return (
        <TableRow className="border-gray-50 hover:bg-gray-50/50 transition-colors">
            <TableCell>
                <div>
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                    {item.item_number && (
                        <div className="text-xs text-gray-400 font-mono">{item.item_number}</div>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                Rs. {item.price.toFixed(2)}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg border-gray-200"
                        onClick={() => onUpdateQuantity(item.item_id, Math.max(1, item.quantity - 1))}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg border-gray-200"
                        onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </TableCell>
            <TableCell className="text-right font-semibold text-gray-900 text-sm">
                Rs. {finalTotal.toFixed(2)}
            </TableCell>
            <TableCell>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    onClick={() => onRemoveItem(item.item_id)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </TableCell>
        </TableRow>
    )
}
