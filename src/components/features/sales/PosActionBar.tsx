'use client'

import { Button } from '@/components/ui/button'
import { KeyboardIcon } from 'lucide-react'

interface PosActionBarProps {
    itemCount: number
    processing: boolean
    onOpenPayment: () => void
    onSuspend?: () => void
    onClearCart: () => void
}

const SHORTCUTS = [
    { key: 'F2', label: 'Focus search' },
    { key: 'F4', label: 'Add customer' },
    { key: 'F12', label: 'Complete sale' },
]

export function PosActionBar({
    itemCount,
    processing,
    onOpenPayment,
    onSuspend,
    onClearCart,
}: PosActionBarProps) {
    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="space-y-2">
                <Button
                    className="w-full h-12 text-base font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg"
                    style={{
                        background:
                            itemCount > 0
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : undefined,
                    }}
                    disabled={itemCount === 0 || processing}
                    onClick={onOpenPayment}
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Processing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            Complete Sale
                            {itemCount > 0 && (
                                <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-mono">
                                    F12
                                </kbd>
                            )}
                        </span>
                    )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="h-10 text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
                        disabled={itemCount === 0}
                        onClick={onSuspend}
                    >
                        Suspend
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 text-sm border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                        onClick={onClearCart}
                        disabled={itemCount === 0}
                    >
                        Clear Cart
                    </Button>
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <KeyboardIcon className="h-3 w-3" /> Shortcuts
                </p>
                {SHORTCUTS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{label}</span>
                        <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                            {key}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    )
}
