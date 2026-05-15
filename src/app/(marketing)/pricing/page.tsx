import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

export default function PricingPage() {
    const plans = [
        {
            name: 'Starter',
            price: 29,
            description: 'Perfect for small businesses just getting started',
            features: [
                '1 Location',
                '2 Team Members',
                '100 Products',
                'Basic Reports',
                'Email Support',
                'Mobile App Access',
                'Receipt Printing',
            ],
            cta: 'Start Free Trial',
            popular: false,
        },
        {
            name: 'Professional',
            price: 79,
            description: 'Best for growing businesses with multiple locations',
            features: [
                '3 Locations',
                '10 Team Members',
                'Unlimited Products',
                'Advanced Reports',
                'Priority Support',
                'Multi-currency',
                'Custom Receipts',
                'Barcode Scanning',
                'Gift Cards',
                'Customer Loyalty',
            ],
            cta: 'Start Free Trial',
            popular: true,
        },
        {
            name: 'Enterprise',
            price: 199,
            description: 'For large businesses with advanced needs',
            features: [
                'Unlimited Locations',
                'Unlimited Team Members',
                'Unlimited Products',
                'Advanced Analytics',
                '24/7 Phone Support',
                'API Access',
                'Custom Integration',
                'Dedicated Account Manager',
                'White Label Options',
                'Custom Training',
                'SLA Guarantee',
            ],
            cta: 'Contact Sales',
            popular: false,
        },
    ]

    const faqs = [
        {
            question: 'Can I change plans later?',
            answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.',
        },
        {
            question: 'Is there a setup fee?',
            answer: 'No, there are no setup fees or hidden costs. You only pay the monthly subscription price.',
        },
        {
            question: 'Can I cancel anytime?',
            answer: 'Yes, you can cancel your subscription at any time. No questions asked, no cancellation fees.',
        },
        {
            question: 'Do you offer annual billing?',
            answer: 'Yes! Annual billing is available with a 20% discount. Contact us for more details.',
        },
        {
            question: 'What happens after the free trial?',
            answer: 'After your 14-day free trial, you\'ll be automatically enrolled in the plan you selected. You can cancel anytime during the trial with no charges.',
        },
    ]

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="container py-24">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Simple, transparent pricing
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Choose the perfect plan for your business. All plans include a 14-day free trial.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="container pb-24">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative flex flex-col ${plan.popular ? 'border-2 border-blue-600 shadow-lg' : 'border shadow-sm'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-gray-600">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-600" />
                                            <span className="text-sm text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    <Link href="/signup" className="block">
                                        <Button
                                            className={`w-full ${plan.popular
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                                                    : ''
                                                }`}
                                            variant={plan.popular ? 'default' : 'outline'}
                                        >
                                            {plan.cta}
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="bg-gray-50 py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            All plans include
                        </h2>
                    </div>
                    <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
                        {[
                            'Cloud-based access from anywhere',
                            'Automatic backups and updates',
                            'Secure data encryption',
                            '99.9% uptime guarantee',
                            'Mobile app for iOS and Android',
                            'Receipt and invoice printing',
                            'Inventory tracking',
                            'Customer management',
                            'Sales reporting',
                            'Multi-payment support',
                            'Barcode scanning (Pro+)',
                            'Real-time sync across devices',
                        ].map((feature) => (
                            <div key={feature} className="flex items-start">
                                <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-600" />
                                <span className="text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Frequently asked questions
                        </h2>
                    </div>
                    <div className="mx-auto mt-16 max-w-3xl space-y-8">
                        {faqs.map((faq) => (
                            <div key={faq.question}>
                                <h3 className="text-lg font-semibold">{faq.question}</h3>
                                <p className="mt-2 text-gray-600">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
                <div className="container">
                    <div className="mx-auto max-w-2xl text-center text-white">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Ready to get started?
                        </h2>
                        <p className="mt-4 text-lg text-blue-100">
                            Start your 14-day free trial today. No credit card required.
                        </p>
                        <div className="mt-8">
                            <Link href="/signup">
                                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                                    Start Free Trial
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
