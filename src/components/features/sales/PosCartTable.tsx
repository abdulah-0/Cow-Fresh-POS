'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ShoppingCart, KeyboardIcon } from 'lucide-react'
import { CartItem } from '@/types'
import { PosCartItemRow } from './PosCartItemRow'

interface PosCartTableProps {
    items: CartItem[]
    mode: string
    onUpdateQuantity: (id: number, qty: number) => void
    onRemoveItem: (id: number) => void
}

export function PosCartTable({
    items,
    mode,
    onUpdateQuantity,
    onRemoveItem,
}: PosCartTableProps) {
    return (
        <Card className="border-0 shadow-sm flex-1 flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <ShoppingCart className="h-5 w-5 text-purple-500" />
                    Cart
                    {items.length > 0 && (
                        <span
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                            {items.length}
                        </span>
                    )}
                </CardTitle>
                <Badge
                    variant={mode === 'sale' ? 'default' : 'secondary'}
                    className="text-[10px] uppercase tracking-wide font-semibold"
                >
                    {mode}
                </Badge>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                {items.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                            <ShoppingCart className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Cart is empty</p>
                        <p className="text-xs text-gray-400">Search for an item or scan a barcode to add it</p>
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
                            <KeyboardIcon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500">
                                Press <kbd className="rounded bg-white border border-gray-200 px-1 text-[10px] font-mono">F2</kbd> to focus search
                            </span>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-100">
                                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Item
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Price
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                                    Qty
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                                    Total
                                </TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <PosCartItemRow
                                    key={item.item_id}
                                    item={item}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onRemoveItem={onRemoveItem}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
