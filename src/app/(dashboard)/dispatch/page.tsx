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
import { getDispatchByDate, upsertDispatch, updateReturnedQuantity, updateReturnedQuantityAndPackets, recordReturns, getRidersForDispatch, getItemsForDispatch } from '@/lib/services/dispatchService'

function toLocalDate(d: Date) { return d.toISOString().split('T')[0] }

export default function DispatchPage() {
    const today = toLocalDate(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [dispatches, setDispatches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [riders, setRiders] = useState<any[]>([])
    const [items, setItems] = useState<any[]>([])
    const [saving, setSaving] = useState(false)

    // Dispatch dialog
    const [showDispatchDialog, setShowDispatchDialog] = useState(false)
    const [dispatchForm, setDispatchForm] = useState({
        rider_id: '',
        item_id: '',
        supplied_quantity: '',
        picked_milk_packets: '0',
        picked_yogurt_packets: '0',
    })

    // Returns dialog
    const [showReturnsDialog, setShowReturnsDialog] = useState(false)
    const [returnsForm, setReturnsForm] = useState({
        rider_id: '',
        item_id: '',
        returned_quantity: '',
        dropped_milk_packets: '0',
        dropped_yogurt_packets: '0',
    })

    // Edit return dialog (per-row)
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

    const loadRidersAndItems = async () => {
        const [r, i] = await Promise.all([getRidersForDispatch(), getItemsForDispatch()])
        setRiders(r); setItems(i)
    }

    // Dispatch
    const openDispatchDialog = async () => {
        await loadRidersAndItems()
        setDispatchForm({ rider_id: '', item_id: '', supplied_quantity: '', picked_milk_packets: '0', picked_yogurt_packets: '0' })
        setShowDispatchDialog(true)
    }

    const handleSaveDispatch = async () => {
        if (!dispatchForm.rider_id || !dispatchForm.item_id || !dispatchForm.supplied_quantity) return showToast('error', 'Please fill all required fields')
        const supplied = parseFloat(dispatchForm.supplied_quantity)
        if (supplied <= 0) return showToast('error', 'Supplied quantity must be positive')
        setSaving(true)
        try {
            await upsertDispatch({
                rider_id: +dispatchForm.rider_id,
                item_id: +dispatchForm.item_id,
                dispatch_date: selectedDate,
                supplied_quantity: supplied,
                returned_quantity: 0,
                picked_milk_packets: parseInt(dispatchForm.picked_milk_packets) || 0,
                picked_yogurt_packets: parseInt(dispatchForm.picked_yogurt_packets) || 0,
                dropped_milk_packets: 0,
                dropped_yogurt_packets: 0
            })
            showToast('success', 'Dispatch saved'); setShowDispatchDialog(false); loadDispatches()
        } catch { showToast('error', 'Failed to save dispatch') } finally { setSaving(false) }
    }

    // Returns
    const openReturnsDialog = async () => {
        await loadRidersAndItems()
        setReturnsForm({ rider_id: '', item_id: '', returned_quantity: '', dropped_milk_packets: '0', dropped_yogurt_packets: '0' })
        setShowReturnsDialog(true)
    }

    const handleSaveReturns = async () => {
        if (!returnsForm.rider_id || !returnsForm.item_id || !returnsForm.returned_quantity) return showToast('error', 'Please fill all required fields')
        const returned = parseFloat(returnsForm.returned_quantity)
        if (returned <= 0) return showToast('error', 'Returned quantity must be positive')
        setSaving(true)
        try {
            await recordReturns(
                +returnsForm.rider_id,
                +returnsForm.item_id,
                selectedDate,
                returned,
                parseInt(returnsForm.dropped_milk_packets) || 0,
                parseInt(returnsForm.dropped_yogurt_packets) || 0
            )
            showToast('success', 'Return recorded'); setShowReturnsDialog(false); loadDispatches()
        } catch { showToast('error', 'Failed to record return') } finally { setSaving(false) }
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
                <div className="flex gap-2">
                    <Button onClick={openReturnsDialog} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50"><RotateCcw className="h-4 w-4 mr-2" />Record Returns</Button>
                    <Button onClick={openDispatchDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />New Dispatch</Button>
                </div>
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
                            <Button onClick={openDispatchDialog} className="mt-4 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />New Dispatch</Button>
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

            {/* Dispatch Dialog */}
            <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>New Dispatch</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div><Label>Rider *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={dispatchForm.rider_id} onChange={e => setDispatchForm(f => ({ ...f, rider_id: e.target.value }))}>
                                <option value="">— Select rider —</option>
                                {riders.map(r => <option key={r.id} value={r.id}>{r.person?.first_name} {r.person?.last_name}{r.username ? ` (@${r.username})` : ''}</option>)}
                            </select></div>
                        <div><Label>Product *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={dispatchForm.item_id} onChange={e => setDispatchForm(f => ({ ...f, item_id: e.target.value }))}>
                                <option value="">— Select product —</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit_type || 'unit'})</option>)}
                            </select></div>
                        <div><Label htmlFor="supplied">Supplied Qty (L/KG) *</Label><Input id="supplied" type="number" min="0" step="0.5" value={dispatchForm.supplied_quantity} onChange={e => setDispatchForm(f => ({ ...f, supplied_quantity: e.target.value }))} className="mt-1" /></div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div><Label htmlFor="picked_milk">Picked Milk Packets</Label><Input id="picked_milk" type="number" min="0" value={dispatchForm.picked_milk_packets} onChange={e => setDispatchForm(f => ({ ...f, picked_milk_packets: e.target.value }))} className="mt-1" /></div>
                            <div><Label htmlFor="picked_yogurt">Picked Yogurt Packets</Label><Input id="picked_yogurt" type="number" min="0" value={dispatchForm.picked_yogurt_packets} onChange={e => setDispatchForm(f => ({ ...f, picked_yogurt_packets: e.target.value }))} className="mt-1" /></div>
                        </div>
                        {dispatchForm.supplied_quantity && (
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                <div>Net delivered Qty: <strong>{parseFloat(dispatchForm.supplied_quantity).toFixed(1)}</strong> L/KG</div>
                                <div>Net Milk Packets: <strong>{parseInt(dispatchForm.picked_milk_packets || '0')}</strong></div>
                                <div>Net Yogurt Packets: <strong>{parseInt(dispatchForm.picked_yogurt_packets || '0')}</strong></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveDispatch} disabled={saving} className="bg-purple-600 hover:bg-purple-700">{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{saving ? 'Saving...' : 'Save Dispatch'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Returns Dialog */}
            <Dialog open={showReturnsDialog} onOpenChange={setShowReturnsDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Record Returns</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div><Label>Rider *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={returnsForm.rider_id} onChange={e => setReturnsForm(f => ({ ...f, rider_id: e.target.value }))}>
                                <option value="">— Select rider —</option>
                                {riders.map(r => <option key={r.id} value={r.id}>{r.person?.first_name} {r.person?.last_name}{r.username ? ` (@${r.username})` : ''}</option>)}
                            </select></div>
                        <div><Label>Product *</Label>
                            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={returnsForm.item_id} onChange={e => setReturnsForm(f => ({ ...f, item_id: e.target.value }))}>
                                <option value="">— Select product —</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit_type || 'unit'})</option>)}
                            </select></div>
                        <div><Label htmlFor="returned">Returned Qty (L/KG) *</Label><Input id="returned" type="number" min="0" step="0.5" value={returnsForm.returned_quantity} onChange={e => setReturnsForm(f => ({ ...f, returned_quantity: e.target.value }))} className="mt-1" /></div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-3">
                            <div><Label htmlFor="dropped_milk">Dropped Milk Packets</Label><Input id="dropped_milk" type="number" min="0" value={returnsForm.dropped_milk_packets} onChange={e => setReturnsForm(f => ({ ...f, dropped_milk_packets: e.target.value }))} className="mt-1" /></div>
                            <div><Label htmlFor="dropped_yogurt">Dropped Yogurt Packets</Label><Input id="dropped_yogurt" type="number" min="0" value={returnsForm.dropped_yogurt_packets} onChange={e => setReturnsForm(f => ({ ...f, dropped_yogurt_packets: e.target.value }))} className="mt-1" /></div>
                        </div>
                        {returnsForm.returned_quantity && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                <div>Returned Qty: <strong>{parseFloat(returnsForm.returned_quantity).toFixed(1)}</strong> L/KG</div>
                                <div>Dropped Milk Packets: <strong>{parseInt(returnsForm.dropped_milk_packets || '0')}</strong></div>
                                <div>Dropped Yogurt Packets: <strong>{parseInt(returnsForm.dropped_yogurt_packets || '0')}</strong></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReturnsDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveReturns} disabled={saving} className="bg-amber-600 hover:bg-amber-700">{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{saving ? 'Saving...' : 'Save Returns'}</Button>
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
