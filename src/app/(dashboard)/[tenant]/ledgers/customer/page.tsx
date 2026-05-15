'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
    BookOpen, 
    Plus, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Wallet,
    Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { getCustomers } from '@/lib/services/customersService'
import { getCustomerLedger, addCustomerLedgerEntry, calculateLedgerSummary, LedgerEntry } from '@/lib/services/ledgerService'

export default function CustomerLedgerPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [showEntryDialog, setShowEntryDialog] = useState(false)
    const { showToast } = useToast()

    const [newEntry, setNewEntry] = useState({
        transaction_type: 'payment' as const,
        amount: '',
        description: '',
        payment_method: 'cash',
        reference_id: '',
    })

    useEffect(() => {
        async function loadTenant() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
                const customersData = await getCustomers(tenant.id)
                setCustomers(customersData)
            }
        }
        loadTenant()
    }, [tenantSlug])

    useEffect(() => {
        if (tenantId && selectedCustomerId) {
            loadLedger()
        } else {
            setLedgerEntries([])
        }
    }, [tenantId, selectedCustomerId])

    const loadLedger = async () => {
        setLoading(true)
        try {
            const data = await getCustomerLedger(tenantId, parseInt(selectedCustomerId))
            setLedgerEntries(data)
        } catch (error) {
            console.error('Error loading ledger:', error)
            showToast('error', 'Failed to load ledger')
        } finally {
            setLoading(false)
        }
    }

    const handleAddEntry = async () => {
        if (!selectedCustomerId || !newEntry.amount) return
        
        setLoading(true)
        try {
            await addCustomerLedgerEntry({
                tenant_id: tenantId,
                customer_id: parseInt(selectedCustomerId),
                transaction_type: newEntry.transaction_type,
                amount: parseFloat(newEntry.amount),
                description: newEntry.description,
                payment_method: newEntry.payment_method,
                transaction_time: new Date().toISOString()
            })
            showToast('success', 'Ledger entry added')
            setShowEntryDialog(false)
            setNewEntry({
                transaction_type: 'payment',
                amount: '',
                description: '',
                payment_method: 'cash',
                reference_id: '',
            })
            loadLedger()
        } catch (error) {
            console.error('Error adding entry:', error)
            showToast('error', 'Failed to add entry')
        } finally {
            setLoading(false)
        }
    }

    const summary = calculateLedgerSummary(ledgerEntries)

    // Running Balance Calculation
    let runningBalance = 0
    const ledgerWithBalance = ledgerEntries.map(entry => {
        if (entry.transaction_type === 'credit') {
            runningBalance += Number(entry.amount)
        } else {
            runningBalance -= Number(entry.amount)
        }
        return { ...entry, balance: runningBalance }
    }).reverse()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Customer Ledger</h1>
                    <p className="text-gray-500 mt-1">Track receivables and payments from customers</p>
                </div>
                {selectedCustomerId && (
                    <Button onClick={() => setShowEntryDialog(true)} className="bg-blue-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment/Credit
                    </Button>
                )}
            </div>

            <Card className="bg-white/50 backdrop-blur-sm border-blue-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label>Select Customer</Label>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a customer to view ledger" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {(c.person?.first_name || '') + ' ' + (c.person?.last_name || '')} {c.company_name ? `(${c.company_name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={loadLedger} disabled={!selectedCustomerId || loading}>
                            <Search className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedCustomerId ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <ArrowUpCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Total Due (Credit)</p>
                                        <p className="text-2xl font-bold text-gray-900">PKR {summary.totalCredit.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <ArrowDownCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Total Received</p>
                                        <p className="text-2xl font-bold text-gray-900">PKR {summary.totalPayment.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-xl">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Net Receivable</p>
                                        <p className="text-2xl font-bold">PKR {summary.balance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Running Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ledgerWithBalance.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                                No ledger entries found for this customer.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ledgerWithBalance.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(entry.transaction_time).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={entry.transaction_type === 'credit' ? 'destructive' : 'default'} className="capitalize">
                                                        {entry.transaction_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {entry.description || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm capitalize text-gray-500">
                                                    {entry.payment_method || '-'}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${entry.transaction_type === 'credit' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {entry.transaction_type === 'credit' ? '+' : '-'} {Number(entry.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-gray-900 border-l border-gray-50">
                                                    PKR {entry.balance.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl border-gray-200 text-gray-400">
                    <BookOpen className="h-10 w-10 mb-2 opacity-20" />
                    <p>Please select a customer to view their financial ledger</p>
                </div>
            )}

            <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Customer Ledger Entry</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transaction Type</Label>
                            <Select 
                                value={newEntry.transaction_type} 
                                onValueChange={(v: any) => setNewEntry({...newEntry, transaction_type: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="payment">Payment Received (Customer paid)</SelectItem>
                                    <SelectItem value="credit">Credit Sale (Customer owes money)</SelectItem>
                                    <SelectItem value="adjustment">Balance Adjustment</SelectItem>
                                    <SelectItem value="advance">Advance Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount (PKR)</Label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={newEntry.amount}
                                onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                                placeholder="What is this for?" 
                                value={newEntry.description}
                                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select 
                                value={newEntry.payment_method} 
                                onValueChange={(v) => setNewEntry({...newEntry, payment_method: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddEntry} disabled={loading || !newEntry.amount}>
                            {loading ? 'Adding...' : 'Add Entry'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
