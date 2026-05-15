'use client'

import { useState } from 'react'
import { Payment, DiscountType } from '@/types'
import { useCartStore } from '@/store/cartStore'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, DollarSign, Gift, Trash2, Plus, Percent, Banknote } from 'lucide-react'

interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    total: number
    onComplete: (payments: Payment[]) => void
}

const PAYMENT_TYPES = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'gift_card', label: 'Gift Card', icon: Gift },
]

const TENDER_AMOUNTS = [5, 10, 20, 50, 100]

export default function PaymentDialog({
    open,
    onOpenChange,
    total,
    onComplete,
}: PaymentDialogProps) {
    const { discount, discountType, setDiscount } = useCartStore()
    const [payments, setPayments] = useState<Payment[]>([])
    const [paymentType, setPaymentType] = useState('cash')
    const [paymentAmount, setPaymentAmount] = useState('')

    const totalPaid = payments.reduce((sum, p) => sum + p.payment_amount, 0)
    const currentInputAmount = parseFloat(paymentAmount) || 0
    const effectiveTotalPaid = totalPaid + currentInputAmount
    const effectiveRemaining = total - effectiveTotalPaid
    const effectiveChangeDue = effectiveTotalPaid > total ? effectiveTotalPaid - total : 0

    const handleAddPayment = () => {
        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) return

        const newPayment: Payment = {
            payment_type: paymentType,
            payment_amount: amount,
        }

        setPayments([...payments, newPayment])
        setPaymentAmount('')
    }

    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments]
        newPayments.splice(index, 1)
        setPayments(newPayments)
    }

    const handleTenderAmount = (amount: number) => {
        setPaymentAmount(amount.toString())
    }

    const handleCompleteSale = () => {
        let finalPayments = [...payments]
        
        // If there's an amount in the input, add it as a final payment if it covers or contributes to the total
        if (currentInputAmount > 0) {
            finalPayments.push({
                payment_type: paymentType,
                payment_amount: currentInputAmount
            })
        }

        const finalTotalPaid = finalPayments.reduce((sum, p) => sum + p.payment_amount, 0)
        if (total - finalTotalPaid > 0.01) {
            alert('Insufficient payment. Please add more payments.')
            return
        }

        onComplete(finalPayments)
        // Reset state
        setPayments([])
        setPaymentAmount('')
        setPaymentType('cash')
    }

    const handleCancel = () => {
        setPayments([])
        setPaymentAmount('')
        setPaymentType('cash')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Process Payment</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4 -mr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    {/* Discount Section */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <Label className="text-sm font-semibold mb-3 block">Apply Discount</Label>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="discount-type" className="text-xs text-gray-500">Type</Label>
                                <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border">
                                    <Button
                                        variant={discountType === 'percent' ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex-1 h-8 text-xs"
                                        onClick={() => setDiscount(discount, 'percent' as DiscountType)}
                                    >
                                        <Percent className="h-3 w-3 mr-1" />
                                        Percentage
                                    </Button>
                                    <Button
                                        variant={discountType === 'fixed' ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex-1 h-8 text-xs"
                                        onClick={() => setDiscount(discount, 'fixed' as DiscountType)}
                                    >
                                        <Banknote className="h-3 w-3 mr-1" />
                                        Cash
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="discount-value" className="text-xs text-gray-500">
                                    Amount {discountType === 'percent' ? '(%)' : '(Rs.)'}
                                </Label>
                                <Input
                                    id="discount-value"
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    value={discount || ''}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0, discountType as DiscountType)}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Total Display */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg text-gray-600 dark:text-gray-400">Total Due</span>
                            <span className="text-3xl font-bold">Rs. {total.toFixed(2)}</span>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Paid</span>
                                <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                                    Rs. {effectiveTotalPaid.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {effectiveRemaining > 0 ? 'Remaining' : 'Change Due'}
                                </span>
                                <div className={`text-xl font-semibold ${effectiveRemaining > 0
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    Rs. {effectiveRemaining > 0 ? effectiveRemaining.toFixed(2) : effectiveChangeDue.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Payment Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Type</Label>
                                <Select value={paymentType} onValueChange={setPaymentType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_TYPES.map((type) => {
                                            const Icon = type.icon
                                            return (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {type.label}
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCompleteSale()
                                            }
                                        }}
                                        className="text-lg font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Tender Buttons (Cash only) */}
                        {paymentType === 'cash' && (
                            <div className="flex gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                                    Quick:
                                </span>
                                {TENDER_AMOUNTS.map((amount) => (
                                    <Button
                                        key={amount}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTenderAmount(amount)}
                                    >
                                        Rs. {amount}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTenderAmount(Math.ceil(total - totalPaid))}
                                >
                                    Exact Balance
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Payments List (Only show recorded partial payments) */}
                    {payments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Recorded Payments</Label>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {PAYMENT_TYPES.find(t => t.value === payment.payment_type)?.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    Rs. {payment.payment_amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemovePayment(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCompleteSale}
                        disabled={effectiveRemaining > 0.01}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90"
                        size="lg"
                    >
                        Complete Sale {effectiveChangeDue > 0 && `(Change: Rs. ${effectiveChangeDue.toFixed(2)})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
