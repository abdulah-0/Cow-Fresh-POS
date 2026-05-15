'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Package2, Plus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTenantBySlug, getEmployeeId } from '@/lib/tenantUtils'
import { getReceivings } from '@/lib/services/receivingService'
import { getAllInventoryTransactions } from '@/lib/services/inventoryService'
import { createClient } from '@/lib/supabase/client'
import ReceivingFormDialog from '@/components/features/receiving/ReceivingFormDialog'

export default function ReceivingPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [employeeId, setEmployeeId] = useState<number>(0)
    const [receivings, setReceivings] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showReceivingDialog, setShowReceivingDialog] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        async function loadTenantAndEmployee() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)

                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const empId = await getEmployeeId(user.id, tenant.id)
                    if (empId) setEmployeeId(empId)
                }
            }
        }
        loadTenantAndEmployee()
    }, [tenantSlug])

    useEffect(() => {
        if (tenantId) {
            loadData()
        }
    }, [tenantId])

    const loadData = async () => {
        setLoading(true)
        try {
            const [receivingsData, transactionsData] = await Promise.all([
                getReceivings(tenantId),
                getAllInventoryTransactions(tenantId)
            ])
            setReceivings(receivingsData)
            setTransactions(transactionsData)
        } catch (error) {
            console.error('Error loading data:', error)
            showToast('error', 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleReceivingSaved = () => {
        setShowReceivingDialog(false)
        loadData()
    }

    const calculateTotal = (receiving: any) => {
        return receiving.receivings_items?.reduce((sum: number, item: any) => {
            const itemTotal = item.item_unit_price * item.quantity_purchased
            const discount = itemTotal * (item.discount_percent / 100)
            return sum + (itemTotal - discount)
        }, 0) || 0
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Inventory Receiving</h1>
                    <p className="text-gray-500 mt-1">Manage stock purchases and track inventory ledger</p>
                </div>
                <Button onClick={() => setShowReceivingDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Receiving
                </Button>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="history">Receiving History</TabsTrigger>
                    <TabsTrigger value="ledger">Inventory Ledger</TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Package2 className="h-5 w-5" />
                                Historical Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-12 text-gray-500">Loading history...</div>
                            ) : receivings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500">No receivings found</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead>Payment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receivings.map((receiving) => (
                                            <TableRow key={receiving.id}>
                                                <TableCell className="font-mono text-sm">#{receiving.id}</TableCell>
                                                <TableCell>
                                                    {new Date(receiving.receiving_time).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {receiving.supplier?.company_name || '-'}
                                                </TableCell>
                                                <TableCell>{receiving.reference || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {receiving.receivings_items?.length || 0} items
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-blue-700">
                                                    PKR {(receiving.total_amount || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {receiving.payment_type ? (
                                                        <Badge variant="outline" className="capitalize">
                                                            {receiving.payment_type}
                                                        </Badge>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ledger">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <History className="h-5 w-5" />
                                Inventory Transaction Ledger
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-12 text-gray-500">Loading ledger...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500">No inventory transactions found</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Change</TableHead>
                                            <TableHead>Type/Comment</TableHead>
                                            <TableHead>Handled By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((trans) => (
                                            <TableRow key={trans.id}>
                                                <TableCell className="text-sm">
                                                    {new Date(trans.trans_date).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{trans.item?.name}</div>
                                                    <div className="text-xs text-gray-400 font-mono">{trans.item?.item_number}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{trans.location?.location_name}</Badge>
                                                </TableCell>
                                                <TableCell className={`text-right font-bold ${trans.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {trans.quantity_change > 0 ? '+' : ''}{trans.quantity_change}
                                                </TableCell>
                                                <TableCell className="text-sm italic text-gray-600">
                                                    {trans.comment || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {trans.user?.person ? `${trans.user.person.first_name} ${trans.user.person.last_name}` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ReceivingFormDialog
                open={showReceivingDialog}
                onOpenChange={setShowReceivingDialog}
                tenantId={tenantId}
                employeeId={employeeId}
                onSaved={handleReceivingSaved}
            />
        </div>
    )
}
