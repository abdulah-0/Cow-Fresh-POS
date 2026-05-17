'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Receipt, Plus, Search, RefreshCw, Printer, MessageCircle,
    CheckCircle, Clock, AlertCircle, ChevronDown, Loader2,
    Users, DollarSign, FileText, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
    getInvoices, generateInvoice, generateBulkInvoices,
    updateInvoicePaymentStatus, markInvoiceWhatsappSent,
    formatBillingMonth, getCurrentBillingMonth, getPreviousBillingMonth,
    buildInvoiceHTML
} from '@/lib/services/invoiceService'
import { getCustomers } from '@/lib/services/customersService'
import type { InvoicePaymentStatus } from '@/types'

const STATUS_CONFIG = {
    unpaid:  { label: 'Unpaid',  color: 'bg-red-100 text-red-700 border-red-200',    icon: AlertCircle },
    paid:    { label: 'Paid',    color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMonth, setSelectedMonth] = useState(getPreviousBillingMonth())
    const [statusFilter, setStatusFilter] = useState<InvoicePaymentStatus | ''>('')

    // Generate single invoice dialog
    const [showGenDialog, setShowGenDialog] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [genMonth, setGenMonth] = useState(getPreviousBillingMonth())
    const [generating, setGenerating] = useState(false)

    // Bulk generate dialog
    const [showBulkDialog, setShowBulkDialog] = useState(false)
    const [bulkMonth, setBulkMonth] = useState(getPreviousBillingMonth())
    const [bulkGenerating, setBulkGenerating] = useState(false)

    const { showToast } = useToast()

    const loadInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getInvoices({
                billing_month: selectedMonth || undefined,
                payment_status: statusFilter || undefined,
            })
            setInvoices(data)
        } catch {
            showToast('error', 'Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }, [selectedMonth, statusFilter, showToast])

    useEffect(() => { loadInvoices() }, [loadInvoices])

    const openGenDialog = async () => {
        const data = await getCustomers()
        setCustomers(data)
        setSelectedCustomerId('')
        setGenMonth(getPreviousBillingMonth())
        setShowGenDialog(true)
    }

    const handleGenerateSingle = async () => {
        if (!selectedCustomerId) return showToast('error', 'Select a customer')
        setGenerating(true)
        try {
            await generateInvoice(+selectedCustomerId, genMonth)
            showToast('success', `Invoice generated for ${formatBillingMonth(genMonth)}`)
            setShowGenDialog(false)
            loadInvoices()
        } catch {
            showToast('error', 'Failed to generate invoice')
        } finally {
            setGenerating(false)
        }
    }

    const handleBulkGenerate = async () => {
        setBulkGenerating(true)
        try {
            const { created, errors } = await generateBulkInvoices(bulkMonth)
            showToast('success', `Generated ${created} invoice(s) for ${formatBillingMonth(bulkMonth)}${errors > 0 ? ` (${errors} errors)` : ''}`)
            setShowBulkDialog(false)
            loadInvoices()
        } catch {
            showToast('error', 'Bulk generation failed')
        } finally {
            setBulkGenerating(false)
        }
    }

    const handleStatusChange = async (invoice: any, status: InvoicePaymentStatus) => {
        try {
            await updateInvoicePaymentStatus(invoice.id, status)
            showToast('success', `Invoice marked as ${status}`)
            loadInvoices()
        } catch {
            showToast('error', 'Failed to update status')
        }
    }

    const handlePrint = (invoice: any) => {
        const html = buildInvoiceHTML(invoice)
        const win = window.open('', '_blank', 'width=720,height=900')
        if (!win) return showToast('error', 'Popup blocked — allow popups and retry')
        win.document.write(html)
        win.document.close()
        win.focus()
        setTimeout(() => win.print(), 500)
    }

    const handleWhatsApp = async (invoice: any) => {
        const customer = invoice.customer
        const phone = customer?.person?.phone_number?.replace(/\D/g, '')
        if (!phone) return showToast('error', 'No phone number for this customer')

        const name = `${customer.person.first_name} ${customer.person.last_name}`
        const month = formatBillingMonth(invoice.billing_month)
        const amount = Number(invoice.total_amount || 0).toLocaleString('en-PK')
        const msg = encodeURIComponent(
            `Assalamu Alaikum ${name},\n\nYour Cow Fresh Dairy invoice for *${month}* is ready.\n` +
            `Deliveries: ${invoice.total_deliveries}\nTotal Amount: *Rs. ${amount}*\n\n` +
            `Please arrange payment at your earliest convenience.\nJazakAllah Khair 🥛\n\n` +
            `— Cow Fresh Dairy\n0331 0377703`
        )
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
        try {
            await markInvoiceWhatsappSent(invoice.id)
            loadInvoices()
        } catch { /* non-critical */ }
    }

    // Filtered + searched list
    const filtered = invoices.filter(inv => {
        const name = `${inv.customer?.person?.first_name || ''} ${inv.customer?.person?.last_name || ''}`.toLowerCase()
        const company = (inv.customer?.company_name || '').toLowerCase()
        const q = searchQuery.toLowerCase()
        return name.includes(q) || company.includes(q)
    })

    // Summary stats
    const totalAmount = filtered.reduce((s, inv) => s + Number(inv.total_amount || 0), 0)
    const unpaidCount = filtered.filter(inv => inv.payment_status === 'unpaid').length
    const paidCount = filtered.filter(inv => inv.payment_status === 'paid').length
    const unpaidAmount = filtered.filter(inv => inv.payment_status === 'unpaid').reduce((s, inv) => s + Number(inv.total_amount || 0), 0)

    // Build month options (current + last 12 months)
    const monthOptions = Array.from({ length: 13 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        return { value: val, label: formatBillingMonth(val) }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Monthly Invoices</h1>
                    <p className="text-gray-500 mt-1">Generate and manage monthly delivery invoices for customers</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => { setBulkMonth(getPreviousBillingMonth()); setShowBulkDialog(true) }}>
                        <Zap className="h-4 w-4 mr-2 text-amber-500" />Bulk Generate
                    </Button>
                    <Button onClick={openGenDialog} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />Generate Invoice
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search customer name or company..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <select
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                    >
                        <option value="">All Months</option>
                        {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as InvoicePaymentStatus | '')}
                    >
                        <option value="">All Statuses</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={loadInvoices}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent></Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Invoices', value: filtered.length, icon: FileText, color: 'purple' },
                    { label: 'Total Billed', value: `Rs. ${totalAmount.toLocaleString('en-PK')}`, icon: DollarSign, color: 'blue' },
                    { label: 'Unpaid', value: `Rs. ${unpaidAmount.toLocaleString('en-PK')}`, icon: AlertCircle, color: 'red' },
                    { label: 'Paid Invoices', value: paidCount, icon: CheckCircle, color: 'green' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}><CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 text-${color}-600`} />
                            </div>
                            <div>
                                <p className="text-lg font-bold leading-tight">{value}</p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </CardContent></Card>
                ))}
            </div>

            {/* Invoice Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Invoices {selectedMonth ? `— ${formatBillingMonth(selectedMonth)}` : '— All Time'}
                        <Badge variant="outline" className="ml-1">{filtered.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />Loading invoices...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No invoices found</p>
                            <p className="text-sm text-gray-400 mt-1">Generate invoices for customers with delivery records</p>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <Button variant="outline" onClick={() => { setBulkMonth(getPreviousBillingMonth()); setShowBulkDialog(true) }}>
                                    <Zap className="h-4 w-4 mr-2 text-amber-500" />Bulk Generate
                                </Button>
                                <Button onClick={openGenDialog} className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="h-4 w-4 mr-2" />Generate Invoice
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Zone</TableHead>
                                <TableHead>Billing Month</TableHead>
                                <TableHead className="text-right">Deliveries</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>WhatsApp</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {filtered.map(inv => {
                                    const sc = STATUS_CONFIG[inv.payment_status as InvoicePaymentStatus] || STATUS_CONFIG.unpaid
                                    const StatusIcon = sc.icon
                                    const name = inv.customer?.person
                                        ? `${inv.customer.person.first_name} ${inv.customer.person.last_name}`
                                        : `Customer #${inv.customer_id}`
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{name}</p>
                                                    {inv.customer?.company_name && <p className="text-xs text-gray-400">{inv.customer.company_name}</p>}
                                                    <p className="text-xs text-gray-400">{inv.customer?.person?.phone_number}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">{inv.customer?.zone?.zone_name || '—'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-sm">{formatBillingMonth(inv.billing_month)}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{inv.total_deliveries}</TableCell>
                                            <TableCell className="text-right font-semibold font-mono">
                                                Rs. {Number(inv.total_amount || 0).toLocaleString('en-PK')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative group inline-block">
                                                    <Badge className={`${sc.color} text-xs cursor-pointer`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                    </Badge>
                                                    {/* Status dropdown */}
                                                    <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                                                        {(['unpaid', 'partial', 'paid'] as InvoicePaymentStatus[]).map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(inv, s)}
                                                                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 capitalize"
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {inv.whatsapp_sent ? (
                                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                        <MessageCircle className="h-3 w-3 mr-1" />Sent
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => handlePrint(inv)} title="Print Invoice">
                                                        <Printer className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => handleWhatsApp(inv)}
                                                        title="Send via WhatsApp"
                                                        className="text-green-600 hover:text-green-700"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Generate Single Invoice Dialog ── */}
            <Dialog open={showGenDialog} onOpenChange={setShowGenDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-purple-600" />Generate Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Customer *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                                <option value="">— Select customer —</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.person?.first_name} {c.person?.last_name}
                                        {c.company_name ? ` (${c.company_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Billing Month *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={genMonth} onChange={e => setGenMonth(e.target.value)}>
                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                            This will total all <strong>delivered</strong> deliveries for the selected customer and month. If an invoice already exists, it will be refreshed.
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGenDialog(false)}>Cancel</Button>
                        <Button onClick={handleGenerateSingle} disabled={generating || !selectedCustomerId} className="bg-purple-600 hover:bg-purple-700">
                            {generating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            {generating ? 'Generating...' : 'Generate Invoice'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Bulk Generate Dialog ── */}
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />Bulk Generate Invoices</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Billing Month</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={bulkMonth} onChange={e => setBulkMonth(e.target.value)}>
                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                            <p className="font-semibold">⚡ This will generate invoices for ALL customers</p>
                            <p className="mt-1 text-amber-700">who have at least one completed delivery in <strong>{formatBillingMonth(bulkMonth)}</strong>. Existing invoices will be refreshed.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                        <Button onClick={handleBulkGenerate} disabled={bulkGenerating} className="bg-amber-500 hover:bg-amber-600 text-white">
                            {bulkGenerating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            {bulkGenerating ? 'Generating...' : `Generate All — ${formatBillingMonth(bulkMonth)}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
