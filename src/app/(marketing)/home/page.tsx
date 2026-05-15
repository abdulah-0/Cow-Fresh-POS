import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    CreditCard,
    Zap,
    Shield,
    Smartphone,
    Check,
} from 'lucide-react'

export default function LandingPage() {
    const features = [
        {
            icon: ShoppingCart,
            title: 'Point of Sale',
            description: 'Fast and intuitive POS interface with barcode scanning and multi-payment support',
        },
        {
            icon: Package,
            title: 'Inventory Management',
            description: 'Track stock levels, manage suppliers, and get low stock alerts in real-time',
        },
        {
            icon: Users,
            title: 'Customer Management',
            description: 'Build customer database with purchase history, discounts, and loyalty programs',
        },
        {
            icon: BarChart3,
            title: 'Analytics & Reports',
            description: 'Comprehensive sales reports, inventory analytics, and business insights',
        },
        {
            icon: CreditCard,
            title: 'Multiple Payments',
            description: 'Accept cash, cards, gift cards, and split payments with ease',
        },
        {
            icon: Zap,
            title: 'Real-time Updates',
            description: 'Instant sync across all devices and locations for up-to-date information',
        },
        {
            icon: Shield,
            title: 'Secure & Reliable',
            description: 'Enterprise-grade security with automatic backups and 99.9% uptime',
        },
        {
            icon: Smartphone,
            title: 'Multi-Device',
            description: 'Works on desktop, tablet, and mobile devices for maximum flexibility',
        },
    ]

    const testimonials = [
        {
            quote: "POS Cloud transformed our retail operations. The real-time inventory tracking alone saved us thousands.",
            author: "Sarah Johnson",
            role: "Owner, Fashion Boutique",
        },
        {
            quote: "Switching to POS Cloud was the best decision. The interface is intuitive and our staff learned it in minutes.",
            author: "Michael Chen",
            role: "Manager, Electronics Store",
        },
        {
            quote: "The reporting features give us insights we never had before. We can make data-driven decisions now.",
            author: "Emily Rodriguez",
            role: "CEO, Retail Chain",
        },
    ]

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="container flex flex-col items-center justify-center space-y-8 py-24 md:py-32">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Modern Point of Sale for Growing Businesses
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Cloud-based POS system with inventory management, customer tracking, and powerful analytics.
                        Everything you need to run your retail business efficiently.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/signup">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button size="lg" variant="outline">
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        14-day free trial • No credit card required • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-gray-50 py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Everything you need to run your business
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Powerful features designed for modern retail businesses
                        </p>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <Card key={feature.title} className="border-none shadow-sm">
                                <CardHeader>
                                    <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                                        <feature.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Get started in minutes
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Simple setup process to get your business running
                        </p>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
                        {[
                            { step: '1', title: 'Sign Up', description: 'Create your account and start your free trial' },
                            { step: '2', title: 'Set Up', description: 'Add your products, team members, and locations' },
                            { step: '3', title: 'Start Selling', description: 'Begin processing sales and managing your business' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold text-white">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold">{item.title}</h3>
                                <p className="mt-2 text-gray-600">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-gray-50 py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Trusted by businesses worldwide
                        </h2>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.author} className="border-none shadow-sm">
                                <CardContent className="pt-6">
                                    <p className="text-gray-600 italic">&quot;{testimonial.quote}&quot;</p>
                                    <div className="mt-4">
                                        <p className="font-semibold">{testimonial.author}</p>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Simple, transparent pricing
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Plans starting at $29/month
                        </p>
                        <div className="mt-8">
                            <Link href="/pricing">
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90">
                                    View All Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center text-white">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Ready to get started?
                        </h2>
                        <p className="mt-4 text-lg text-blue-100">
                            Join thousands of businesses using POS Cloud to manage their operations
                        </p>
                        <div className="mt-8">
                            <Link href="/signup">
                                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                                    Start Your Free Trial
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-blue-100">
                            No credit card required • 14-day free trial
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
