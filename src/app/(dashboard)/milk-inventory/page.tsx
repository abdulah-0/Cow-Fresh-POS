'use client'

import { useState, useEffect, useCallback } from 'react'
import { Milk, Plus, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, BarChart3, Save, Loader2, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { getMilkInventoryHistory, getMilkInventoryByDate, upsertMilkInventory } from '@/lib/services/milkInventoryService'
import type { MilkInventory } from '@/types'

function toLocalDate(d: Date) { return d.toISOString().split('T')[0] }

export default function MilkInventoryPage() {
    const today = toLocalDate(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [todayRecord, setTodayRecord] = useState<MilkInventory | null>(null)
    const [history, setHistory] = useState<MilkInventory[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state for today's entry
    const [form, setForm] = useState({
        total_received: '',
        total_pos_sold: '',
        total_rider_deliveries: '',
    })

    const { showToast } = useToast()

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [record, hist] = await Promise.all([
                getMilkInventoryByDate(selectedDate),
                getMilkInventoryHistory(30),
            ])
            setTodayRecord(record)
            setHistory(hist)
            if (record) {
                setForm({
                    total_received: String(record.total_received || ''),
                    total_pos_sold: String(record.total_pos_sold || ''),
                    total_rider_deliveries: String(record.total_rider_deliveries || ''),
                })
            } else {
                setForm({ total_received: '', total_pos_sold: '', total_rider_deliveries: '' })
            }
        } catch {
            showToast('error', 'Failed to load inventory data')
        } finally {
            setLoading(false)
        }
    }, [selectedDate, showToast])

    useEffect(() => { loadData() }, [loadData])

    const handleSave = async () => {
        const received = parseFloat(form.total_received)
        if (isNaN(received) || received < 0) return showToast('error', 'Total received is required')
        setSaving(true)
        try {
            await upsertMilkInventory({
                inventory_date: selectedDate,
                total_received: received,
                total_pos_sold: parseFloat(form.total_pos_sold) || 0,
                total_rider_deliveries: parseFloat(form.total_rider_deliveries) || 0,
            })
            showToast('success', 'Inventory saved successfully')
            loadData()
        } catch {
            showToast('error', 'Failed to save inventory')
        } finally {
            setSaving(false)
        }
    }

    const shiftDate = (delta: number) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(toLocalDate(d)) }

    const received = parseFloat(form.total_received) || 0
    const posSold = parseFloat(form.total_pos_sold) || 0
    const riderDeliveries = parseFloat(form.total_rider_deliveries) || 0
    const remaining = received - posSold - riderDeliveries
    const utilizationPct = received > 0 ? Math.round(((posSold + riderDeliveries) / received) * 100) : 0

    // History totals
    const avgReceived = history.length > 0 ? history.reduce((s, h) => s + h.total_received, 0) / history.length : 0
    const totalReceivedAllTime = history.reduce((s, h) => s + h.total_received, 0)
    const avgRemaining = history.length > 0 ? history.reduce((s, h) => s + h.remaining_milk, 0) / history.length : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Milk Inventory</h1>
                    <p className="text-gray-500 mt-1">Track daily milk intake, sales, and rider deliveries</p>
                </div>
            </div>

            {/* Date Navigator */}
            <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => shiftDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
                    {selectedDate === today && <Badge className="bg-green-100 text-green-700 border-green-200">Today</Badge>}
                    {todayRecord && <Badge variant="outline" className="text-blue-600 border-blue-300">Record exists</Badge>}
                    <Button variant="outline" size="sm" onClick={() => shiftDate(1)} disabled={selectedDate >= today}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-purple-600 ml-auto">Jump to Today</Button>
                </div>
            </CardContent></Card>

            {/* History Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center"><Milk className="h-5 w-5 text-blue-600" /></div>
                        <div><p className="text-2xl font-bold">{avgReceived.toFixed(0)}<span className="text-sm font-normal text-gray-400 ml-1">L</span></p><p className="text-sm text-gray-500">Avg Daily Received</p></div>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
                        <div><p className="text-2xl font-bold">{totalReceivedAllTime.toFixed(0)}<span className="text-sm font-normal text-gray-400 ml-1">L</span></p><p className="text-sm text-gray-500">Total (30 Days)</p></div>
                    </div>
                </CardContent></Card>
                <Card><CardContent className="pt-5">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${avgRemaining > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                            {avgRemaining > 0 ? <TrendingDown className="h-5 w-5 text-amber-600" /> : <TrendingUp className="h-5 w-5 text-green-600" />}
                        </div>
                        <div><p className="text-2xl font-bold">{avgRemaining.toFixed(0)}<span className="text-sm font-normal text-gray-400 ml-1">L</span></p><p className="text-sm text-gray-500">Avg Daily Remaining</p></div>
                    </div>
                </CardContent></Card>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Entry Form */}
                <div className="col-span-5">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-blue-500" />Daily Entry — {selectedDate}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? <div className="py-6 text-center text-gray-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div> : <>
                                <div>
                                    <Label htmlFor="received">Total Received (Liters) *</Label>
                                    <Input id="received" type="number" min="0" step="0.5" value={form.total_received} onChange={e => setForm(f => ({ ...f, total_received: e.target.value }))} placeholder="e.g. 500" className="mt-1" />
                                    <p className="text-xs text-gray-400 mt-1">Total milk received from farms/suppliers today</p>
                                </div>
                                <div>
                                    <Label htmlFor="pos-sold">POS Sales (Liters)</Label>
                                    <Input id="pos-sold" type="number" min="0" step="0.5" value={form.total_pos_sold} onChange={e => setForm(f => ({ ...f, total_pos_sold: e.target.value }))} placeholder="e.g. 120" className="mt-1" />
                                    <p className="text-xs text-gray-400 mt-1">Milk sold directly from counter/POS</p>
                                </div>
                                <div>
                                    <Label htmlFor="rider-del">Rider Deliveries (Liters)</Label>
                                    <Input id="rider-del" type="number" min="0" step="0.5" value={form.total_rider_deliveries} onChange={e => setForm(f => ({ ...f, total_rider_deliveries: e.target.value }))} placeholder="e.g. 350" className="mt-1" />
                                    <p className="text-xs text-gray-400 mt-1">Total delivered via riders (from dispatch records)</p>
                                </div>

                                {/* Live calculation */}
                                {received > 0 && (
                                    <div className={`rounded-xl p-4 space-y-2 ${remaining >= 0 ? 'bg-blue-50 border border-blue-100' : 'bg-red-50 border border-red-100'}`}>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Balance</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between"><span className="text-gray-600">Received</span><span className="font-semibold">{received.toFixed(1)} L</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">− POS Sales</span><span className="text-red-600">− {posSold.toFixed(1)} L</span></div>
                                            <div className="flex justify-between"><span className="text-gray-600">− Rider Deliveries</span><span className="text-red-600">− {riderDeliveries.toFixed(1)} L</span></div>
                                            <div className="flex justify-between border-t pt-1 font-bold text-base">
                                                <span>Remaining</span>
                                                <span className={remaining >= 0 ? 'text-blue-700' : 'text-red-600'}>{remaining.toFixed(1)} L</span>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Utilization</span><span>{utilizationPct}%</span></div>
                                            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${Math.min(utilizationPct, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button onClick={handleSave} disabled={saving || !form.total_received} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-2" />}
                                    {saving ? 'Saving...' : todayRecord ? 'Update Record' : 'Save Record'}
                                </Button>
                            </>}
                        </CardContent>
                    </Card>
                </div>

                {/* History Table */}
                <div className="col-span-7">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />30-Day History</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Milk className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                                    <p>No records yet. Start by entering today&apos;s inventory.</p>
                                </div>
                            ) : (
                                <div className="overflow-auto" style={{ maxHeight: '480px' }}>
                                    <Table>
                                        <TableHeader><TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Received</TableHead>
                                            <TableHead className="text-right">POS</TableHead>
                                            <TableHead className="text-right">Riders</TableHead>
                                            <TableHead className="text-right">Remaining</TableHead>
                                            <TableHead>Utilization</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {history.map(h => {
                                                const util = h.total_received > 0
                                                    ? Math.round(((h.total_pos_sold + h.total_rider_deliveries) / h.total_received) * 100)
                                                    : 0
                                                const rem = h.remaining_milk ?? (h.total_received - h.total_pos_sold - h.total_rider_deliveries)
                                                return (
                                                    <TableRow key={h.id} className={h.inventory_date === selectedDate ? 'bg-purple-50' : ''}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{h.inventory_date}</span>
                                                                {h.inventory_date === today && <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5">Today</Badge>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{h.total_received.toFixed(1)}</TableCell>
                                                        <TableCell className="text-right font-mono text-gray-500">{h.total_pos_sold.toFixed(1)}</TableCell>
                                                        <TableCell className="text-right font-mono text-gray-500">{h.total_rider_deliveries.toFixed(1)}</TableCell>
                                                        <TableCell className="text-right font-mono font-semibold">
                                                            <span className={rem >= 0 ? 'text-blue-700' : 'text-red-600'}>{rem.toFixed(1)}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                                                                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400" style={{ width: `${Math.min(util, 100)}%` }} />
                                                                </div>
                                                                <span className="text-xs text-gray-500">{util}%</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
