'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileText, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { printReceipt } from '@/lib/receiptUtils'

interface SaleDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sale: any
    tenantId: string
}

export default function SaleDetailDialog({
    open,
    onOpenChange,
    sale,
    tenantId,
}: SaleDetailDialogProps) {
    if (!sale) return null

    const handlePrintReceipt = async () => {
        try {
            await printReceipt(sale.id, tenantId)
        } catch (error) {
            console.error('Error printing receipt:', error)
        }
    }

    const subtotal = sale.sale_total

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Sale Details - {sale.invoice_number}</span>
                        <Button onClick={handlePrintReceipt} variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Receipt
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-500">Invoice Number</div>
                            <div className="font-mono font-medium">{sale.invoice_number}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Date & Time</div>
                            <div className="font-medium">
                                {new Date(sale.sale_time).toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Status</div>
                            <Badge
                                variant={
                                    sale.sale_status === 'completed'
                                        ? 'default'
                                        : sale.sale_status === 'suspended'
                                            ? 'secondary'
                                            : 'destructive'
                                }
                            >
                                {sale.sale_status}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Employee</div>
                            <div className="font-medium">
                                {sale.employee?.person
                                    ? `${sale.employee.person.first_name} ${sale.employee.person.last_name}`
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Customer Info */}
                    <div>
                        <div className="text-sm font-semibold mb-2">Customer</div>
                        {sale.customer ? (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="font-medium">
                                    {sale.customer.person?.first_name} {sale.customer.person?.last_name}
                                </div>
                                {sale.customer.company_name && (
                                    <div className="text-sm text-gray-500">{sale.customer.company_name}</div>
                                )}
                                {sale.customer.person?.email && (
                                    <div className="text-sm text-gray-500">{sale.customer.person.email}</div>
                                )}
                                {sale.customer.person?.phone_number && (
                                    <div className="text-sm text-gray-500">{sale.customer.person.phone_number}</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-500">Walk-in Customer</div>
                        )}
                    </div>

                    <Separator />

                    {/* Items */}
                    <div>
                        <div className="text-sm font-semibold mb-2">Items</div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium">Item</th>
                                        <th className="text-right p-3 text-sm font-medium">Price</th>
                                        <th className="text-right p-3 text-sm font-medium">Qty</th>
                                        <th className="text-right p-3 text-sm font-medium">Discount</th>
                                        <th className="text-right p-3 text-sm font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sale.items?.map((item: any, index: number) => {
                                        const itemTotal = item.item_unit_price * item.quantity
                                        const discount = (itemTotal * item.discount_percent) / 100
                                        const finalTotal = itemTotal - discount

                                        return (
                                            <tr key={index} className="border-t">
                                                <td className="p-3">
                                                    <div className="font-medium">{item.item?.name || 'Item'}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-gray-500">{item.description}</div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">{formatCurrency(item.item_unit_price)}</td>
                                                <td className="p-3 text-right">{item.quantity}</td>
                                                <td className="p-3 text-right">
                                                    {item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                    {formatCurrency(finalTotal)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold">{formatCurrency(sale.sale_total)}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Payments */}
                    <div>
                        <div className="text-sm font-semibold mb-2">Payments</div>
                        <div className="space-y-2">
                            {sale.payments?.map((payment: any, index: number) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <span className="font-medium capitalize">{payment.payment_type}</span>
                                    <span className="font-medium">{formatCurrency(payment.payment_amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {sale.comment && (
                        <>
                            <Separator />
                            <div>
                                <div className="text-sm font-semibold mb-2">Comments</div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    {sale.comment}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
