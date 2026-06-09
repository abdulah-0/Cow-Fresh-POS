'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Plus, Search, Edit, Trash2, MapPin, Users, UserCheck,
    ChevronDown, ChevronUp, Bike, X, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
    getZones, createZone, updateZone, deleteZone,
    assignCustomerToZone, assignRiderToZone,
    getUnzonedCustomers, getRiders,
} from '@/lib/services/zoneService'
import type { Zone } from '@/types'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(
    () => import('@/components/features/delivery/LocationPicker'),
    { ssr: false, loading: () => <div className="h-[250px] rounded-xl bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading map...</div> }
)

export default function ZonesPage() {
    const [zones, setZones] = useState<Zone[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedZone, setExpandedZone] = useState<number | null>(null)

    // Zone dialog
    const [showZoneDialog, setShowZoneDialog] = useState(false)
    const [editingZone, setEditingZone] = useState<Zone | null>(null)
    const [zoneName, setZoneName] = useState('')
    const [zoneDescription, setZoneDescription] = useState('')
    const [savingZone, setSavingZone] = useState(false)

    // Assign customer dialog
    const [showAssignCustomer, setShowAssignCustomer] = useState(false)
    const [targetZoneId, setTargetZoneId] = useState<number | null>(null)
    const [unzonedCustomers, setUnzonedCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [customerAddress, setCustomerAddress] = useState('')
    const customerLatRef = useRef<number | undefined>(undefined)
    const customerLngRef = useRef<number | undefined>(undefined)
    const [assigningCustomer, setAssigningCustomer] = useState(false)

    // Assign rider dialog
    const [showAssignRider, setShowAssignRider] = useState(false)
    const [riders, setRiders] = useState<any[]>([])
    const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null)
    const [assigningRider, setAssigningRider] = useState(false)

    const { showToast } = useToast()

    const loadZones = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getZones()
            setZones(data)
        } catch {
            showToast('error', 'Failed to load zones')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => { loadZones() }, [loadZones])

    const filtered = zones.filter(z =>
        z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (z.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ── Zone CRUD ──────────────────────────────────────────────────────────
    const openAddZone = () => {
        setEditingZone(null)
        setZoneName('')
        setZoneDescription('')
        setShowZoneDialog(true)
    }

    const openEditZone = (zone: Zone) => {
        setEditingZone(zone)
        setZoneName(zone.zone_name)
        setZoneDescription(zone.description || '')
        setShowZoneDialog(true)
    }

    const handleSaveZone = async () => {
        if (!zoneName.trim()) return showToast('error', 'Zone name is required')
        setSavingZone(true)
        try {
            if (editingZone) {
                await updateZone(editingZone.id, { zone_name: zoneName.trim(), description: zoneDescription.trim() })
                showToast('success', `Zone "${zoneName}" updated`)
            } else {
                await createZone({ zone_name: zoneName.trim(), description: zoneDescription.trim() })
                showToast('success', `Zone "${zoneName}" created`)
            }
            setShowZoneDialog(false)
            loadZones()
        } catch {
            showToast('error', 'Failed to save zone')
        } finally {
            setSavingZone(false)
        }
    }

    const handleDeleteZone = async (zone: Zone) => {
        const hasCustomers = (zone.customers?.length ?? 0) > 0
        if (hasCustomers) {
            showToast('error', 'Remove all customers from this zone before deleting it')
            return
        }
        if (!confirm(`Delete zone "${zone.zone_name}"?`)) return
        try {
            await deleteZone(zone.id)
            showToast('success', 'Zone deleted')
            loadZones()
        } catch {
            showToast('error', 'Failed to delete zone')
        }
    }

    // ── Assign Customer ────────────────────────────────────────────────────
    const openAssignCustomer = async (zoneId: number) => {
        setTargetZoneId(zoneId)
        setSelectedCustomerId(null)
        setCustomerAddress('')
        customerLatRef.current = undefined
        customerLngRef.current = undefined
        const data = await getUnzonedCustomers()
        setUnzonedCustomers(data)
        setShowAssignCustomer(true)
    }

    const handleAssignCustomer = async () => {
        if (!selectedCustomerId || !targetZoneId) return
        if (!customerLatRef.current || !customerLngRef.current) {
            showToast('error', 'Please pin the customer location on the map first — click the map, drag the pin, use "My Location", or enter coordinates manually', 0)
            return
        }
        console.log('Assigning customer with coordinates:', { lat: customerLatRef.current, lng: customerLngRef.current })
        setAssigningCustomer(true)
        try {
            await assignCustomerToZone(selectedCustomerId, targetZoneId, {
                delivery_address: customerAddress.trim() || undefined,
                latitude: customerLatRef.current,
                longitude: customerLngRef.current,
            })
            showToast('success', 'Customer assigned to zone')
            setShowAssignCustomer(false)
            loadZones()
        } catch (e) {
            console.error('Failed to assign customer:', e)
            showToast('error', 'Failed to assign customer', 0)
        } finally {
            setAssigningCustomer(false)
        }
    }

    const handleRemoveCustomer = async (customerId: number, zoneName: string) => {
        if (!confirm(`Remove this customer from zone "${zoneName}"?`)) return
        try {
            await assignCustomerToZone(customerId, null)
            showToast('success', 'Customer removed from zone')
            loadZones()
        } catch {
            showToast('error', 'Failed to remove customer from zone')
        }
    }

    // ── Assign Rider ───────────────────────────────────────────────────────
    const openAssignRider = async (zone: Zone) => {
        setTargetZoneId(zone.id)
        setSelectedRiderId(zone.assigned_rider_id ?? null)
        const data = await getRiders()
        setRiders(data)
        setShowAssignRider(true)
    }

    const handleAssignRider = async () => {
        if (!targetZoneId) return
        setAssigningRider(true)
        try {
            await assignRiderToZone(targetZoneId, selectedRiderId)
            showToast('success', selectedRiderId ? 'Rider assigned to zone' : 'Rider removed from zone')
            setShowAssignRider(false)
            loadZones()
        } catch {
            showToast('error', 'Failed to assign rider')
        } finally {
            setAssigningRider(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Delivery Zones</h1>
                    <p className="text-gray-500 mt-1">Manage zone-based delivery coverage areas and rider assignments</p>
                </div>
                <Button onClick={openAddZone} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{zones.length}</p>
                                <p className="text-sm text-gray-500">Total Zones</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {zones.reduce((s, z) => s + (z.customers?.length ?? 0), 0)}
                                </p>
                                <p className="text-sm text-gray-500">Assigned Customers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <Bike className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {zones.filter(z => z.assigned_rider_id).length}
                                </p>
                                <p className="text-sm text-gray-500">Zones With Riders</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search zones by name or description..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Zone List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading zones...</div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No zones found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Try a different search term' : 'Create your first delivery zone to get started'}
                        </p>
                        {!searchQuery && (
                            <Button onClick={openAddZone} className="mt-4 bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 mr-2" /> Add First Zone
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(zone => (
                        <Card key={zone.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{zone.zone_name}</CardTitle>
                                            {zone.description && (
                                                <p className="text-sm text-gray-500 mt-0.5">{zone.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            <Users className="h-3 w-3 mr-1" />
                                            {zone.customers?.length ?? 0} customers
                                        </Badge>
                                        {zone.rider ? (
                                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                                <Bike className="h-3 w-3 mr-1" />
                                                {(zone.rider as any).person?.first_name} {(zone.rider as any).person?.last_name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                No rider assigned
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button size="sm" variant="outline" onClick={() => openAssignRider(zone)}>
                                        <Bike className="h-3.5 w-3.5 mr-1.5" />
                                        {zone.assigned_rider_id ? 'Change Rider' : 'Assign Rider'}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openAssignCustomer(zone.id)}>
                                        <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                                        Add Customer
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openEditZone(zone)}>
                                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteZone(zone)}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Delete
                                    </Button>
                                    {(zone.customers?.length ?? 0) > 0 && (
                                        <Button
                                            size="sm" variant="ghost"
                                            className="ml-auto text-gray-500"
                                            onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                                        >
                                            {expandedZone === zone.id ? (
                                                <><ChevronUp className="h-4 w-4 mr-1" /> Hide Customers</>
                                            ) : (
                                                <><ChevronDown className="h-4 w-4 mr-1" /> View Customers</>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {/* Expandable customer list */}
                                {expandedZone === zone.id && (zone.customers?.length ?? 0) > 0 && (
                                    <div className="mt-4 border-t pt-4 space-y-2">
                                        {zone.customers!.map((customer: any) => (
                                            <div key={customer.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                                <div>
                                                    <span className="font-medium">
                                                        {customer.person.first_name} {customer.person.last_name}
                                                    </span>
                                                    {customer.delivery_address && (
                                                        <span className="text-gray-500 ml-2 text-xs">— {customer.delivery_address}</span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    className="text-red-500 hover:text-red-700 h-7 px-2"
                                                    onClick={() => handleRemoveCustomer(customer.id, zone.zone_name)}
                                                    title="Remove from zone"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Add/Edit Zone Dialog ── */}
            <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="zone-name">Zone Name *</Label>
                            <Input
                                id="zone-name"
                                value={zoneName}
                                onChange={e => setZoneName(e.target.value)}
                                placeholder="e.g. Bahria Town, DHA Phase 1"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="zone-desc">Description</Label>
                            <Input
                                id="zone-desc"
                                value={zoneDescription}
                                onChange={e => setZoneDescription(e.target.value)}
                                placeholder="Optional notes about this zone"
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowZoneDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveZone} disabled={savingZone} className="bg-purple-600 hover:bg-purple-700">
                            {savingZone ? 'Saving...' : editingZone ? 'Update Zone' : 'Create Zone'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Assign Customer Dialog ── */}
            <Dialog open={showAssignCustomer} onOpenChange={setShowAssignCustomer}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Customer to Zone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Select Customer</Label>
                            <select
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={selectedCustomerId ?? ''}
                                onChange={e => setSelectedCustomerId(Number(e.target.value) || null)}
                            >
                                <option value="">— Select a customer —</option>
                                {unzonedCustomers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.person.first_name} {c.person.last_name}
                                        {c.person.phone_number ? ` (${c.person.phone_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            {unzonedCustomers.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">All customers are already assigned to zones.</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="delivery-address">Delivery Address</Label>
                            <Input
                                id="delivery-address"
                                value={customerAddress}
                                onChange={e => setCustomerAddress(e.target.value)}
                                placeholder="House/street address for delivery"
                                className="mt-1"
                            />
                        </div>
                        <LocationPicker
                            latitude={customerLatRef.current}
                            longitude={customerLngRef.current}
                            onLocationChange={(lat, lng) => {
                                customerLatRef.current = lat
                                customerLngRef.current = lng
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignCustomer(false)}>Cancel</Button>
                        <Button
                            onClick={handleAssignCustomer}
                            disabled={!selectedCustomerId || assigningCustomer}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {assigningCustomer ? 'Assigning...' : 'Assign Customer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Assign Rider Dialog ── */}
            <Dialog open={showAssignRider} onOpenChange={setShowAssignRider}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Rider to Zone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Select Rider</Label>
                            <select
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={selectedRiderId ?? ''}
                                onChange={e => setSelectedRiderId(Number(e.target.value) || null)}
                            >
                                <option value="">— No rider (unassign) —</option>
                                {riders.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.person.first_name} {r.person.last_name}
                                        {r.username ? ` (@${r.username})` : ''}
                                    </option>
                                ))}
                            </select>
                            {riders.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    No riders found. Add employees with the &quot;Rider&quot; role first.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignRider(false)}>Cancel</Button>
                        <Button
                            onClick={handleAssignRider}
                            disabled={assigningRider}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="h-4 w-4 mr-1.5" />
                            {assigningRider ? 'Saving...' : 'Confirm Assignment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
