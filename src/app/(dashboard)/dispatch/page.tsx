'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeftRight, Plus, Search, ChevronLeft, ChevronRight, Bike, Package, AlertTriangle, Check, RotateCcw, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { getDispatchByDate, upsertDispatch, updateReturnedQuantity, updateReturnedQuantityAndPackets, getRidersForDispatch, getItemsForDispatch } from '@/lib/services/dispatchService'

function toLocalDate(d: Date) { return d.toISOString().split('T')[0] }

export default function DispatchPage() {
    const today = toLocalDate(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [dispatches, setDispatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [riders, setRiders] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [form, setForm] = useState({
        rider_id: '',
        item_id: '',
        supplied_quantity: '',
        returned_quantity: '0',
        picked_milk_packets: '0',
        picked_yogurt_packets: '0',
        dropped_milk_packets: '0',
        dropped_yogurt_packets: '0'
    })
    const [saving, setSaving] = useState(false)
    const [showReturnDialog, setShowReturnDialog] = useState(false)
    const [editingDispatch, setEditingDispatch] = useState<any>(null)
    const [returnQty, setReturnQty] = useState('')
    const [droppedMilk, setDroppedMilk] = useState('0')
    const [droppedYogurt, setDroppedYogurt] = useState('0')
    const [updatingReturn, setUpdatingReturn] = useState(false)
    const { showToast } = useToast()

    const loadDispatches = useCallback(async () => {
        setLoading(true)
        try { setDispatches(await getDispatchByDate(selectedDate)) }
        catch { showToast('error', 'Failed to load dispatch records') }
        finally { setLoading(false) }
    }, [selectedDate, showToast])

    useEffect(() => { loadDispatches() }, [loadDispatches])

    const openAddDialog = async () => {
        const [r, i] = await Promise.all([getRidersForDispatch(), getItemsForDispatch()])
        setRiders(r); setItems(i)
        setForm({
            rider_id: '',
            item_id: '',
            supplied_quantity: '',
            returned_quantity: '0',
            picked_milk_packets: '0',
            picked_yogurt_packets: '0',
            dropped_milk_packets: '0',
            dropped_yogurt_packets: '0'
        })
        setShowAddDialog(true)
    }

    const handleSaveDispatch = async () => {
        if (!form.rider_id || !form.item_id || !form.supplied_quantity) return showToast('error', 'Please fill all required fields')
        const supplied = parseFloat(form.supplied_quantity), returned = parseFloat(form.returned_quantity) || 0
        if (supplied <= 0) return showToast('error', 'Supplied quantity must be positive')
        if (returned < 0 || returned > supplied) return showToast('error', 'Return cannot exceed supplied')
        
        const pickedMilk = parseInt(form.picked_milk_packets) || 0
        const pickedYogurt = parseInt(form.picked_yogurt_packets) || 0
        const droppedMilk = parseInt(form.dropped_milk_packets) || 0
        const droppedYogurt = parseInt(form.dropped_yogurt_packets) || 0

        setSaving(true)
        try {
            await upsertDispatch({
                rider_id: +form.rider_id,
                item_id: +form.item_id,
                dispatch_date: selectedDate,
                supplied_quantity: supplied,
                returned_quantity: returned,
                picked_milk_packets: pickedMilk,
                dropped_milk_packets: droppedMilk,
                picked_yogurt_packets: pickedYogurt,
                dropped_yogurt_packets: droppedYogurt
            })
            showToast('success', 'Dispatch record saved'); setShowAddDialog(false); loadDispatches()
        } catch { showToast('error', 'Failed to save dispatch') } finally { setSaving(false) }
    }

    const handleUpdateReturn = async () => {
        if (!editingDispatch) return
        const qty = parseFloat(returnQty)
        if (isNaN(qty) || qty < 0 || qty > editingDispatch.supplied_quantity) return showToast('error', 'Invalid return quantity')
        const droppedM = parseInt(droppedMilk) || 0
        const droppedY = parseInt(droppedYogurt) || 0
        if (droppedM < 0 || droppedY < 0) return showToast('error', 'Dropped packets cannot be negative')

        setUpdatingReturn(true)
        try {
            await updateReturnedQuantityAndPackets(editingDispatch.id, qty, droppedM, droppedY)
            showToast('success', 'Return updated'); setShowReturnDialog(false); loadDispatches()
        } catch { showToast('error', 'Failed to update return') } finally { setUpdatingReturn(false) }
    }

    const shiftDate = (delta: number) => { const d = new Date(selectedDate); d.setDate(d.getDate() + delta); setSelectedDate(toLocalDate(d)) }
    const filtered = dispatches.filter(d => {
        const rname = `${d.rider?.person?.first_name || ''} ${d.rider?.person?.last_name || ''}`.toLowerCase()
        return rname.includes(searchQuery.toLowerCase()) || (d.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    })
    const totalSupplied = dispatches.reduce((s, d) => s + (d.supplied_quantity || 0), 0)
    const totalReturned = dispatches.reduce((s, d) => s + (d.returned_quantity || 0), 0)
    const totalDelivered = totalSupplied - totalReturned

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Rider Dispatch & Returns</h1>
                    <p className="text-gray-500 mt-1">Track daily stock dispatched to riders and returned quantities</p>
                </div>
                <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Record</Button>
            </div>

            <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => shiftDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
                    {selectedDate === today && <Badge className="bg-green-100 text-green-700 border-green-200">Today</Badge>}
                    <Button variant="outline" size="sm" onClick={() => shiftDate(1)} disabled={selectedDate >= today}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-purple-600 ml-auto">Jump to Today</Button>
                </div>
            </CardContent></Card>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Supplied', value: totalSupplied, icon: Package, color: 'blue' },
                    { label: 'Total Returned', value: totalReturned, icon: RotateCcw, color: 'amber' },
                    { label: 'Net Delivered', value: totalDelivered, icon: Check, color: 'green' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label}><CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                                <Icon className={`h-5 w-5 text-${color}-600`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{value.toFixed(1)}<span className="text-sm font-normal text-gray-400 ml-1">L</span></p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </CardContent></Card>
                ))}
            </div>

            <Card><CardContent className="pt-4 pb-4">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by rider or product..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
            </CardContent></Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5" />Dispatch Records — {selectedDate}
                    <Badge variant="outline" className="ml-1">{dispatches.length} records</Badge>
                </CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No dispatch records for this date</p>
                            <Button onClick={openAddDialog} className="mt-4 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add First Record</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>Rider</TableHead><TableHead>Product</TableHead>
                                <TableHead className="text-right">Supplied</TableHead><TableHead className="text-right">Returned</TableHead>
                                <TableHead className="text-right">Delivered</TableHead>
                                <TableHead className="text-center">Milk Packets (P/D/Net)</TableHead>
                                <TableHead className="text-center">Yogurt Packets (P/D/Net)</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                                <TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {filtered.map(d => {
                                    const delivered = d.supplied_quantity - (d.returned_quantity || 0)
                                    const value = delivered * (d.item?.unit_price || 0)
                                    const reconciled = (d.returned_quantity || 0) > 0
                                    return (
                                        <TableRow key={d.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center"><Bike className="h-3.5 w-3.5 text-purple-600" /></div>
                                                    <div><p className="font-medium text-sm">{d.rider?.person?.first_name} {d.rider?.person?.last_name}</p><p className="text-xs text-gray-400">@{d.rider?.username}</p></div>
                                                </div>
                                            </TableCell>
                                            <TableCell><p className="font-medium text-sm">{d.item?.name}</p><p className="text-xs text-gray-400">{d.item?.unit_type}</p></TableCell>
                                            <TableCell className="text-right font-mono">{d.supplied_quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{d.returned_quantity > 0 ? <span className="text-amber-600">{d.returned_quantity}</span> : <span className="text-gray-300">—</span>}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">{delivered}</TableCell>
                                            <TableCell className="text-center font-mono text-sm">
                                                {d.picked_milk_packets || d.dropped_milk_packets ? (
                                                    <span className="inline-flex gap-1.5 items-center">
                                                        <span className="text-blue-600">{d.picked_milk_packets || 0}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-amber-600">{d.dropped_milk_packets || 0}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="font-semibold text-green-700">{(d.picked_milk_packets || 0) - (d.dropped_milk_packets || 0)}</span>
                                                    </span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-sm">
                                                {d.picked_yogurt_packets || d.dropped_yogurt_packets ? (
                                                    <span className="inline-flex gap-1.5 items-center">
                                                        <span className="text-blue-600">{d.picked_yogurt_packets || 0}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-amber-600">{d.dropped_yogurt_packets || 0}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="font-semibold text-green-700">{(d.picked_yogurt_packets || 0) - (d.dropped_yogurt_packets || 0)}</span>
                                                    </span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-green-700">{value > 0 ? `Rs. ${value.toLocaleString('en-PK')}` : '—'}</TableCell>
                                            <TableCell>
                                                {reconciled ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs"><Check className="h-3 w-3 mr-1" />Reconciled</Badge>
                                                    : <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingDispatch(d)
                                                        setReturnQty(String(d.returned_quantity || 0))
                                                        setDroppedMilk(String(d.dropped_milk_packets || 0))
                                                        setDroppedYogurt(String(d.dropped_yogurt_packets || 0))
                                                        setShowReturnDialog(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Dispatch Record</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div><Label>Rider *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.rider_id} onChange={e => setForm(f => ({ ...f, rider_id: e.target.value }))}>
                                <option value="">— Select rider —</option>
                                {riders.map(r => <option key={r.id} value={r.id}>{r.person?.first_name} {r.person?.last_name}{r.username ? ` (@${r.username})` : ''}</option>)}
                            </select></div>
                        <div><Label>Product *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.item_id} onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))}>
                                <option value="">— Select product —</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit_type || 'unit'})</option>)}
                            </select></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="supplied">Supplied Qty (L/KG) *</Label><Input id="supplied" type="number" min="0" step="0.5" value={form.supplied_quantity} onChange={e => setForm(f => ({ ...f, supplied_quantity: e.target.value }))} className="mt-1" /></div>
                            <div><Label htmlFor="returned">Returned Qty (L/KG)</Label><Input id="returned" type="number" min="0" step="0.5" value={form.returned_quantity} onChange={e => setForm(f => ({ ...f, returned_quantity: e.target.value }))} className="mt-1" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div><Label htmlFor="picked_milk">Picked Milk Packets</Label><Input id="picked_milk" type="number" min="0" value={form.picked_milk_packets} onChange={e => setForm(f => ({ ...f, picked_milk_packets: e.target.value }))} className="mt-1" /></div>
                            <div><Label htmlFor="dropped_milk">Dropped Milk Packets</Label><Input id="dropped_milk" type="number" min="0" value={form.dropped_milk_packets} onChange={e => setForm(f => ({ ...f, dropped_milk_packets: e.target.value }))} className="mt-1" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div><Label htmlFor="picked_yogurt">Picked Yogurt Packets</Label><Input id="picked_yogurt" type="number" min="0" value={form.picked_yogurt_packets} onChange={e => setForm(f => ({ ...f, picked_yogurt_packets: e.target.value }))} className="mt-1" /></div>
                            <div><Label htmlFor="dropped_yogurt">Dropped Yogurt Packets</Label><Input id="dropped_yogurt" type="number" min="0" value={form.dropped_yogurt_packets} onChange={e => setForm(f => ({ ...f, dropped_yogurt_packets: e.target.value }))} className="mt-1" /></div>
                        </div>
                        {form.supplied_quantity && (
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 space-y-1 dark:bg-blue-950/30 dark:text-blue-300">
                                <div>Net delivered Qty: <strong>{(parseFloat(form.supplied_quantity) - parseFloat(form.returned_quantity || '0')).toFixed(1)}</strong> L/KG</div>
                                <div>Net delivered Milk Packets: <strong>{parseInt(form.picked_milk_packets || '0') - parseInt(form.dropped_milk_packets || '0')}</strong></div>
                                <div>Net delivered Yogurt Packets: <strong>{parseInt(form.picked_yogurt_packets || '0') - parseInt(form.dropped_yogurt_packets || '0')}</strong></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveDispatch} disabled={saving} className="bg-purple-600 hover:bg-purple-700">{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{saving ? 'Saving...' : 'Save Record'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Dialog */}
            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Update Return Quantity</DialogTitle></DialogHeader>
                    {editingDispatch && <div className="space-y-4 py-2">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-zinc-900">
                            <p className="font-medium">{editingDispatch.rider?.person?.first_name} {editingDispatch.rider?.person?.last_name}</p>
                            <p className="text-gray-500 dark:text-gray-400">{editingDispatch.item?.name} — Supplied: {editingDispatch.supplied_quantity}</p>
                        </div>
                        <div><Label htmlFor="return-qty">Returned Quantity (L/KG)</Label><Input id="return-qty" type="number" min="0" max={editingDispatch.supplied_quantity} step="0.5" value={returnQty} onChange={e => setReturnQty(e.target.value)} className="mt-1" /><p className="text-xs text-gray-400 mt-1">Max: {editingDispatch.supplied_quantity}</p></div>
                        
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div><Label htmlFor="dropped-milk-qty">Dropped Milk Packets</Label><Input id="dropped-milk-qty" type="number" min="0" value={droppedMilk} onChange={e => setDroppedMilk(e.target.value)} className="mt-1" /></div>
                            <div><Label htmlFor="dropped-yogurt-qty">Dropped Yogurt Packets</Label><Input id="dropped-yogurt-qty" type="number" min="0" value={droppedYogurt} onChange={e => setDroppedYogurt(e.target.value)} className="mt-1" /></div>
                        </div>

                        {returnQty && (
                            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 space-y-1 dark:bg-green-950/30 dark:text-green-300">
                                <div>Net delivered Qty: <strong>{(editingDispatch.supplied_quantity - parseFloat(returnQty || '0')).toFixed(1)}</strong> L/KG</div>
                                <div>Net delivered Milk Packets: <strong>{(editingDispatch.picked_milk_packets || 0) - parseInt(droppedMilk || '0')}</strong></div>
                                <div>Net delivered Yogurt Packets: <strong>{(editingDispatch.picked_yogurt_packets || 0) - parseInt(droppedYogurt || '0')}</strong></div>
                            </div>
                        )}
                    </div>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateReturn} disabled={updatingReturn} className="bg-green-600 hover:bg-green-700">{updatingReturn ? 'Updating...' : 'Update Return'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
