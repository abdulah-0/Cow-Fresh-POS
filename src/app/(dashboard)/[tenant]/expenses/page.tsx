'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
    Wallet, 
    Plus, 
    Calendar,
    Filter,
    ArrowUpRight
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
import { getExpenses, addExpense, getExpenseCategories, Expense } from '@/lib/services/expenseService'

export default function ExpensesPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showExpenseDialog, setShowExpenseDialog] = useState(false)
    const { showToast } = useToast()

    const [newExpense, setNewExpense] = useState({
        category: '',
        amount: '',
        description: '',
        payment_method: 'cash',
        expense_time: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        async function loadInitialData() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
                const [expenseData, categoryData] = await Promise.all([
                    getExpenses(tenant.id),
                    getExpenseCategories(tenant.id)
                ])
                setExpenses(expenseData)
                setCategories(categoryData)
            }
        }
        loadInitialData()
    }, [tenantSlug])

    const loadExpenses = async () => {
        setLoading(true)
        try {
            const data = await getExpenses(tenantId)
            setExpenses(data)
        } catch (error) {
            console.error('Error loading expenses:', error)
            showToast('error', 'Failed to load expenses')
        } finally {
            setLoading(false)
        }
    }

    const handleAddExpense = async () => {
        if (!newExpense.category || !newExpense.amount) return
        
        setLoading(true)
        try {
            await addExpense({
                tenant_id: tenantId,
                category: newExpense.category,
                amount: parseFloat(newExpense.amount),
                description: newExpense.description,
                payment_method: newExpense.payment_method,
                expense_time: new Date(newExpense.expense_time).toISOString()
            })
            showToast('success', 'Expense recorded')
            setShowExpenseDialog(false)
            setNewExpense({
                category: '',
                amount: '',
                description: '',
                payment_method: 'cash',
                expense_time: new Date().toISOString().split('T')[0]
            })
            loadExpenses()
            // Refresh categories in case a new one was added
            const updatedCats = await getExpenseCategories(tenantId)
            setCategories(updatedCats)
        } catch (error) {
            console.error('Error adding expense:', error)
            showToast('error', 'Failed to record expense')
        } finally {
            setLoading(false)
        }
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Shop Expenses</h1>
                    <p className="text-gray-500 mt-1">Manage and track operational costs</p>
                </div>
                <Button onClick={() => setShowExpenseDialog(true)} className="bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Expense
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Expenses</p>
                                <p className="text-3xl font-bold mt-1">PKR {totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <Wallet className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-gray-900">{expenses.length} Records</p>
                        <p className="text-xs text-gray-400 mt-1">Managed across {categories.length} categories</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-widest">Top Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-gray-900">
                            {categories[0] || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                            Most frequent expense type
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Expense History</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Date</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">
                                        No expense records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="text-sm font-medium">
                                            {new Date(expense.expense_time).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {expense.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                                            {expense.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs uppercase text-gray-400">
                                            {expense.payment_method || 'cash'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-gray-900 font-mono">
                                            PKR {Number(expense.amount).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Shop Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <div className="flex gap-2">
                                <Select 
                                    value={newExpense.category} 
                                    onValueChange={(v) => setNewExpense({...newExpense, category: v})}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select or type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input 
                                    className="flex-1" 
                                    placeholder="Or new category..." 
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (PKR)</Label>
                                <Input 
                                    type="number" 
                                    placeholder="0.00" 
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input 
                                    type="date" 
                                    value={newExpense.expense_time}
                                    onChange={(e) => setNewExpense({...newExpense, expense_time: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                                placeholder="Details about this expense" 
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select 
                                value={newExpense.payment_method} 
                                onValueChange={(v) => setNewExpense({...newExpense, payment_method: v})}
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
                        <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
                        <Button onClick={handleAddExpense} disabled={loading || !newExpense.amount || !newExpense.category}>
                            {loading ? 'Recording...' : 'Record Expense'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
