'use client'

import { ShoppingCart, BarChart3, Users, Shield, Zap } from 'lucide-react'

const features = [
    { icon: ShoppingCart, text: 'Lightning-fast checkout' },
    { icon: BarChart3, text: 'Real-time analytics & reports' },
    { icon: Users, text: 'Customer loyalty programs' },
    { icon: Shield, text: 'Enterprise-grade security' },
]

export function AuthBrandingPanel() {
    return (
        <div
            className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
        >
            {/* Background shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
                />
                <div
                    className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }}
                />
            </div>

            {/* Logo */}
            <div className="relative flex items-center gap-3">
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}
                >
                    <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Cow Fresh POS</span>
            </div>

            {/* Main text */}
            <div className="relative space-y-6">
                <h2 className="text-4xl font-bold text-white leading-tight">
                    Your dairy shop,
                    <br />
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        fresh & streamlined.
                    </span>
                </h2>
                <div className="space-y-4">
                    {features.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                            <div
                                className="flex h-8 w-8 items-center justify-center rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.2)' }}
                            >
                                <Icon className="h-4 w-4 text-indigo-300" />
                            </div>
                            <span className="text-indigo-100 text-sm font-medium">{text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <p className="relative text-indigo-400 text-xs">© 2026 Cow Fresh Dairy. All rights reserved.</p>
        </div>
    )
}
