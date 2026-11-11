'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, X } from 'lucide-react'

interface PosCustomerBannerProps {
    customer?: any
    onOpenCustomerDialog: () => void
    onClearCustomer?: () => void
}

export function PosCustomerBanner({
    customer,
    onOpenCustomerDialog,
    onClearCustomer,
}: PosCustomerBannerProps) {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-400" />
                        Customer
                    </span>
                    {customer && (
                        <button
                            onClick={onOpenCustomerDialog}
                            className="text-xs text-purple-600 hover:text-purple-700 font-normal hover:underline"
                        >
                            Change
                        </button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                {customer ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                                {customer.person?.first_name?.[0] || 'C'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {customer.person?.first_name} {customer.person?.last_name}
                                </p>
                                {customer.company_name && (
                                    <p className="text-xs text-gray-400 truncate">{customer.company_name}</p>
                                )}
                                {customer.zone?.zone_name && (
                                    <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] bg-purple-50 text-purple-700 rounded font-medium">
                                        {customer.zone.zone_name}
                                    </span>
                                )}
                            </div>
                        </div>
                        {onClearCustomer && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                onClick={onClearCustomer}
                                title="Remove customer from sale"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full h-10 border-dashed border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all text-sm"
                        onClick={onOpenCustomerDialog}
                    >
                        <User className="mr-2 h-4 w-4" />
                        Add Customer (F4)
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
