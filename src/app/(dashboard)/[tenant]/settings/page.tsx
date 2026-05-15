'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import {
    Building2,
    Store,
    Receipt,
    Percent,
    Globe,
    Save,
} from 'lucide-react'
import ClientRoleGuard from '@/components/providers/ClientRoleGuard'

export default function SettingsPage() {
    const params = useParams()
    const tenantSlug = params?.tenant as string
    const { showToast } = useToast()

    const [loading, setLoading] = useState(false)
    const [tenantId, setTenantId] = useState('')

    const [storeName, setStoreName] = useState('')
    const [storeEmail, setStoreEmail] = useState('')
    const [storePhone, setStorePhone] = useState('')
    const [storeAddress, setStoreAddress] = useState('')
    const [currency, setCurrency] = useState('PKR')
    const [taxRate, setTaxRate] = useState('0')
    const [receiptFooter, setReceiptFooter] = useState('')
    const [timezone, setTimezone] = useState('Asia/Karachi')

    useEffect(() => {
        async function loadTenant() {
            const supabase = createClient()
            const { data: tenant } = await supabase
                .from('tenants')
                .select('*')
                .eq('slug', tenantSlug)
                .single()

            if (tenant) {
                setTenantId(tenant.id)
                setStoreName(tenant.name || '')
                const s = (tenant.settings as Record<string, unknown>) || {}
                setStoreEmail((s.email as string) || '')
                setStorePhone((s.phone as string) || '')
                setStoreAddress((s.address as string) || '')
                setCurrency((s.currency as string) || 'PKR')
                setTaxRate(String(s.tax_rate ?? '0'))
                setReceiptFooter((s.receipt_footer as string) || '')
                setTimezone((s.timezone as string) || 'Asia/Karachi')
            }
        }
        if (tenantSlug) loadTenant()
    }, [tenantSlug])

    const handleSave = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('tenants')
                .update({
                    name: storeName,
                    settings: {
                        email: storeEmail,
                        phone: storePhone,
                        address: storeAddress,
                        currency,
                        tax_rate: parseFloat(taxRate) || 0,
                        receipt_footer: receiptFooter,
                        timezone,
                    },
                })
                .eq('id', tenantId)

            if (error) throw error
            showToast('success', 'Settings saved successfully.')
        } catch (err) {
            console.error(err)
            showToast('error', 'Failed to save settings.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ClientRoleGuard routeSegment="settings" tenantSlug={tenantSlug}>
            <div className="space-y-6 max-w-3xl">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your store configuration and preferences.</p>
                </div>

                {/* Store Information */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <Store className="h-5 w-5 text-purple-500" />
                            Store Information
                        </CardTitle>
                        <CardDescription>Basic details about your business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="storeName">Store Name</Label>
                                <Input
                                    id="storeName"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="My Store"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="storeEmail">Email</Label>
                                <Input
                                    id="storeEmail"
                                    type="email"
                                    value={storeEmail}
                                    onChange={(e) => setStoreEmail(e.target.value)}
                                    placeholder="store@example.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="storePhone">Phone</Label>
                                <Input
                                    id="storePhone"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    placeholder="+92 300 0000000"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="timezone">
                                    <span className="flex items-center gap-1">
                                        <Globe className="h-3.5 w-3.5" /> Timezone
                                    </span>
                                </Label>
                                <Input
                                    id="timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    placeholder="Asia/Karachi"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="storeAddress">
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" /> Address
                                </span>
                            </Label>
                            <Input
                                id="storeAddress"
                                value={storeAddress}
                                onChange={(e) => setStoreAddress(e.target.value)}
                                placeholder="123 Main Street, City"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* POS & Tax */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <Percent className="h-5 w-5 text-purple-500" />
                            POS & Tax
                        </CardTitle>
                        <CardDescription>Currency and tax defaults for your point of sale.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="currency">Currency Code</Label>
                                <Input
                                    id="currency"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                    placeholder="PKR"
                                    maxLength={3}
                                />
                                <p className="text-xs text-gray-400">3-letter code, e.g. PKR, USD, EUR</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                                <Input
                                    id="taxRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400">0 = no tax applied by default</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Receipt */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            <Receipt className="h-5 w-5 text-purple-500" />
                            Receipt
                        </CardTitle>
                        <CardDescription>Customize what appears on customer receipts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1.5">
                            <Label htmlFor="receiptFooter">Receipt Footer Message</Label>
                            <Input
                                id="receiptFooter"
                                value={receiptFooter}
                                onChange={(e) => setReceiptFooter(e.target.value)}
                                placeholder="Thank you for your purchase!"
                            />
                            <p className="text-xs text-gray-400">Printed at the bottom of every receipt</p>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="text-white font-semibold px-6"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </div>
        </ClientRoleGuard>
    )
}
