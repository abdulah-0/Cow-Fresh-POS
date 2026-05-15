'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    showToast: (type: ToastType, message: string, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7)
        const toast: Toast = { id, type, message, duration }

        setToasts((prev) => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        px-4 py-3 rounded-lg shadow-lg flex items-center gap-3
                        animate-in slide-in-from-right duration-300
                        ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
                        ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
                        ${toast.type === 'warning' ? 'bg-orange-600 text-white' : ''}
                    `}
                >
                    <div className="flex-1">{toast.message}</div>
                    <button
                        onClick={() => onRemove(toast.id)}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
