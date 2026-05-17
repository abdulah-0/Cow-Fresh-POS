'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, AlertCircle } from 'lucide-react'
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
import { getWastage } from '@/lib/services/wastageService'
import { RecordWastageDialog } from '@/components/features/inventory/RecordWastageDialog'

export default function WastagePage() {
    const [wastageRecords, setWastageRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getWastage()
            setWastageRecords(data)
        } catch (error) {
            console.error('Error loading wastage:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Wastage Tracking</h1>
                    <p className="text-gray-500 mt-1">Monitor and record product loss due to expiry or damage</p>
                </div>
                <RecordWastageDialog 
                    onSuccess={loadData} 
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-red-500" />
                        Loss Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading records...</div>
                    ) : wastageRecords.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No wastage recorded yet</p>
                            <p className="text-sm text-gray-400">Keep up the good work! Fresh stock is happy stock.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {wastageRecords.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {new Date(record.wastage_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{record.item?.name}</div>
                                            <div className="text-xs text-gray-400">{record.item?.item_number}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            {record.quantity}
                                        </TableCell>
                                        <TableCell>{record.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={record.reason.toLowerCase().includes('expiry') ? 'destructive' : 'secondary'}>
                                                {record.reason}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


