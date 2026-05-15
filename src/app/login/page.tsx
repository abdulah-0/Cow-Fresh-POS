'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, BarChart3, Users, Shield, Zap } from 'lucide-react'

const features = [
    { icon: ShoppingCart, text: 'Lightning-fast checkout' },
    { icon: BarChart3, text: 'Real-time analytics & reports' },
    { icon: Users, text: 'Customer loyalty programs' },
    { icon: Shield, text: 'Enterprise-grade security' },
]

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left Panel - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
            >
                {/* Background shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #667eea, transparent)' }} />
                    <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #764ba2, transparent)' }} />
                </div>

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold text-white">POS Cloud</span>
                </div>

                {/* Main text */}
                <div className="relative space-y-6">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Your business,<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            supercharged.
                        </span>
                    </h2>
                    <div className="space-y-4">
                        {features.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                                    style={{ background: 'rgba(102,126,234,0.2)' }}>
                                    <Icon className="h-4 w-4 text-purple-300" />
                                </div>
                                <span className="text-purple-100 text-sm font-medium">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-purple-400 text-xs">© 2025 POS Cloud. All rights reserved.</p>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 justify-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-bold text-gray-900">POS Cloud</span>
                    </div>

                    {/* Heading */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                        <p className="mt-2 text-sm text-gray-500">Sign in to access your POS dashboard</p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 bg-gray-50 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 bg-gray-50 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                                />
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>

                        <div className="text-center text-xs text-gray-400">
                            Contact your administrator to get access.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
