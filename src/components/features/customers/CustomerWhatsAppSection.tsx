'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UseFormRegister } from 'react-hook-form'
import { CustomerInput } from '@/lib/services/customersService'

interface CustomerWhatsAppSectionProps {
    register: UseFormRegister<CustomerInput>
    isOptedIn?: boolean
}

export function CustomerWhatsAppSection({ register, isOptedIn }: CustomerWhatsAppSectionProps) {
    return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-3.5 space-y-3">
            <div className="flex items-center gap-2.5">
                <input
                    type="checkbox"
                    id="whatsapp_opt_in"
                    {...register('whatsapp_opt_in')}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <Label
                    htmlFor="whatsapp_opt_in"
                    className="text-sm font-medium cursor-pointer text-emerald-900 dark:text-emerald-100"
                >
                    Opt-in for WhatsApp Digital Receipts & Notifications
                </Label>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                    Dedicated WhatsApp Number (leave blank to use primary phone)
                </Label>
                <Input
                    {...register('whatsapp_phone')}
                    placeholder="e.g., 0300 1234567 or 923001234567"
                    className="h-8 text-sm bg-white dark:bg-zinc-900"
                />
            </div>
        </div>
    )
}
