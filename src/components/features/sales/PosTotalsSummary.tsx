'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DiscountType } from '@/types'

interface PosTotalsSummaryProps {
    subtotal: number
    total: number
    discount: number
    discountType: DiscountType
}

export function PosTotalsSummary({
    subtotal,
    total,
    discount,
    discountType,
}: PosTotalsSummaryProps) {
    const calculatedDiscountAmount =
        discountType === 'percent'
            ? (subtotal / (1 - (discount / 100 || 0))) * (discount / 100 || 0)
            : discount

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-gray-700">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">Rs. {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount {discountType === 'percent' ? `(${discount}%)` : ''}</span>
                        <span className="font-medium">
                            -Rs. {(calculatedDiscountAmount || discount).toFixed(2)}
                        </span>
                    </div>
                )}
                <Separator className="bg-gray-100" />
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">Rs. {total.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
