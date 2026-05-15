import Link from 'next/link'

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            POS Cloud
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        <Link href="/#features" className="transition-colors hover:text-foreground/80">
                            Features
                        </Link>
                        <Link href="/pricing" className="transition-colors hover:text-foreground/80">
                            Pricing
                        </Link>
                        <Link href="/#contact" className="transition-colors hover:text-foreground/80">
                            Contact
                        </Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/login"
                            className="text-sm font-medium transition-colors hover:text-foreground/80"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:opacity-90"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t bg-gray-50">
                <div className="container py-12">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        <div>
                            <h3 className="mb-4 text-sm font-semibold">Product</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link href="/#features" className="hover:text-gray-900">Features</Link></li>
                                <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
                                <li><Link href="/#" className="hover:text-gray-900">Security</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-sm font-semibold">Company</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link href="/#" className="hover:text-gray-900">About</Link></li>
                                <li><Link href="/#contact" className="hover:text-gray-900">Contact</Link></li>
                                <li><Link href="/#" className="hover:text-gray-900">Blog</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link href="/#" className="hover:text-gray-900">Documentation</Link></li>
                                <li><Link href="/#" className="hover:text-gray-900">Help Center</Link></li>
                                <li><Link href="/#" className="hover:text-gray-900">API</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-900">
                                <li><Link href="/terms" className="hover:text-gray-900">Terms</Link></li>
                                <li><Link href="/privacy" className="hover:text-gray-900">Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
                        <p>&copy; {new Date().getFullYear()} POS Cloud. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
