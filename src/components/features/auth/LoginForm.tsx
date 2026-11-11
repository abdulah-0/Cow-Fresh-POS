'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, AlertCircle } from 'lucide-react'

export function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (signInError) {
            setError(signInError.message)
            setLoading(false)
        } else {
            // Full refresh to ensure auth session cookies are picked up by middleware
            window.location.href = '/dashboard'
        }
    }

    return (
        <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 justify-center">
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}
                >
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Cow Fresh POS</span>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-sm text-gray-500 mt-1">Sign in to access your dairy register</p>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@cowfresh.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                            Password
                        </Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-white font-medium shadow-md hover:shadow-lg transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing in...</span>
                        </div>
                    ) : (
                        'Sign in to POS'
                    )}
                </Button>
            </form>
        </div>
    )
}
