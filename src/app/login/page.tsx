'use client'

import { AuthBrandingPanel } from '@/components/features/auth/AuthBrandingPanel'
import { LoginForm } from '@/components/features/auth/LoginForm'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Branding */}
            <AuthBrandingPanel />

            {/* Right Panel - Login Form */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
                <LoginForm />
            </div>
        </div>
    )
}
