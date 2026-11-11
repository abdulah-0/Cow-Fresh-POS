import { useEffect } from 'react'

interface UsePosKeyboardShortcutsOptions {
    onFocusSearch: () => void
    onOpenCustomerDialog: () => void
    onOpenPaymentDialog: () => void
    canPay: boolean
    onClearCart?: () => void
}

/**
 * Custom hook to manage POS terminal global hotkeys (F2, F4, F12, Escape).
 */
export function usePosKeyboardShortcuts({
    onFocusSearch,
    onOpenCustomerDialog,
    onOpenPaymentDialog,
    canPay,
    onClearCart,
}: UsePosKeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F2: Focus item search input
            if (e.key === 'F2') {
                e.preventDefault()
                onFocusSearch()
            }
            // F4: Open customer selector dialog
            else if (e.key === 'F4') {
                e.preventDefault()
                onOpenCustomerDialog()
            }
            // F12: Open payment checkout dialog
            else if (e.key === 'F12' && canPay) {
                e.preventDefault()
                onOpenPaymentDialog()
            }
            // Escape: Optionally clear search or prompt
            else if (e.key === 'Escape' && onClearCart) {
                // Keep escape behavior non-destructive unless explicitly handled
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onFocusSearch, onOpenCustomerDialog, onOpenPaymentDialog, canPay, onClearCart])
}
