'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
    Navigation, MapPin, Users, Clock, Route,
    CheckCircle, Circle, Bike, RefreshCw, AlertCircle,
    ChevronRight, Timer, Ruler
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getZones } from '@/lib/services/zoneService'
import { calculateOptimizedRoute, geocodeAddress } from '@/lib/services/routeService'
import type { OptimizedRoute, RouteStop } from '@/lib/services/routeService'
import type { Zone } from '@/types'

// Leaflet must not be server-rendered
const DeliveryMap = dynamic(
    () => import('@/components/features/delivery/DeliveryMap'),
    { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
    return (
        <div className="w-full rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"
            style={{ height: '480px' }}>
            <div className="text-center text-gray-400">
                <Navigation className="mx-auto h-10 w-10 mb-3 animate-pulse" />
                <p className="text-sm font-medium">Loading map...</p>
            </div>
        </div>
    )
}

// Depot coordinates — Cow Fresh Dairy Plaza Bahria Town Rawalpindi
const DEPOT: RouteStop = {
    id: 0,
    name: 'Cow Fresh Dairy — Depot',
    lat: 33.5362,
    lng: 73.0931,
    address: 'Plaza # 86 E-1 Commercial Phase 8, Bahria Town, Rawalpindi',
    type: 'depot',
}

export default function DeliveryRoutesPage() {
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [stops, setStops] = useState<RouteStop[]>([])
    const [route, setRoute] = useState<OptimizedRoute | null>(null)
    const [completedStops, setCompletedStops] = useState<Set<number | string>>(new Set())
    const [loadingZones, setLoadingZones] = useState(true)
    const [calculatingRoute, setCalculatingRoute] = useState(false)
    const [noKeyWarning, setNoKeyWarning] = useState(false)
    const { showToast } = useToast()
    const routeCalcRef = useRef(false)

    // Load zones on mount
    const loadZones = useCallback(async () => {
        setLoadingZones(true)
        try {
            const data = await getZones()
            setZones(data)
        } catch (e) {
            console.error('Failed to load delivery zones:', e)
            showToast('error', 'Failed to load delivery zones', 0)
        } finally {
            setLoadingZones(false)
        }
    }, [showToast])

    useEffect(() => { loadZones() }, [loadZones])

    // Build stops and calculate route when a zone is selected
    const handleSelectZone = useCallback(async (zone: Zone) => {
        if (routeCalcRef.current) return
        routeCalcRef.current = true

        setSelectedZone(zone)
        setCompletedStops(new Set())
        setRoute(null)

        // Build stop list from zone customers, resolving coordinates if missing
        const customers = (zone.customers || []) as any[]
        const customerStops: RouteStop[] = []

        for (let idx = 0; idx < customers.length; idx++) {
            const c = customers[idx]
            let lat = c.latitude != null ? Number(c.latitude) : null
            let lng = c.longitude != null ? Number(c.longitude) : null

            // Auto-resolve missing coordinates via server geocoding endpoint
            if (lat == null || lng == null) {
                const addr = c.delivery_address || [c.person?.address_1, c.person?.city, c.person?.state].filter(Boolean).join(', ')
                if (addr) {
                    const resolved = await geocodeAddress(addr, c.id)
                    if (resolved) {
                        lat = resolved.lat
                        lng = resolved.lng
                    }
                }
            }

            if (lat != null && lng != null) {
                customerStops.push({
                    id: c.id,
                    name: `${c.person?.first_name || ''} ${c.person?.last_name || ''}`.trim() || `Customer ${idx + 1}`,
                    lat,
                    lng,
                    address: c.delivery_address || '',
                    phone: c.person?.phone_number || '',
                    type: 'customer' as const,
                })
            }
        }

        if (customerStops.length === 0) {
            showToast('error', 'No customer coordinates available for this zone.', 0)
            setStops([DEPOT])
            routeCalcRef.current = false
            return
        }

        const allStops = [DEPOT, ...customerStops]
        setStops(allStops)

        // Calculate optimized route via server route service
        setCalculatingRoute(true)
        try {
            const optimized = await calculateOptimizedRoute(allStops)
            setRoute(optimized)
            if (optimized) {
                setNoKeyWarning(optimized.fallback)
                if (optimized.fallback) {
                    showToast('info', `Estimated route (Haversine): ${optimized.totalDistanceKm} km · ~${optimized.totalDurationMin} min`)
                } else {
                    showToast('success', `Live route calculated: ${optimized.totalDistanceKm} km · ~${optimized.totalDurationMin} min`)
                }
            }
        } catch (e) {
            console.error('Failed to calculate route:', e)
            showToast('error', 'Failed to calculate route', 0)
        } finally {
            setCalculatingRoute(false)
            routeCalcRef.current = false
        }
    }, [showToast])

    const handleRecalculate = useCallback(async () => {
        if (!selectedZone) return
        setCalculatingRoute(true)
        try {
            const optimized = await calculateOptimizedRoute(stops)
            setRoute(optimized)
            showToast('success', 'Route recalculated')
        } catch (e) {
            console.error('Failed to recalculate route:', e)
            showToast('error', 'Failed to recalculate route', 0)
        } finally {
            setCalculatingRoute(false)
        }
    }, [selectedZone, stops, showToast])

    const handleStopClick = useCallback((stop: RouteStop) => {
        if (stop.type === 'depot') return
        setCompletedStops(prev => {
            const next = new Set(prev)
            if (next.has(stop.id)) {
                next.delete(stop.id)
                showToast('success', `${stop.name} marked as pending`)
            } else {
                next.add(stop.id)
                showToast('success', `✓ Delivery completed for ${stop.name}`)
            }
            return next
        })
    }, [showToast])

    const customerStops = stops.filter(s => s.type === 'customer')
    const completedCount = completedStops.size
    const pendingCount = customerStops.length - completedCount
    const progressPct = customerStops.length > 0
        ? Math.round((completedCount / customerStops.length) * 100)
        : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Delivery Routes</h1>
                    <p className="text-gray-500 mt-1">
                        Select a zone to calculate the optimized rider route using OpenStreetMap
                    </p>
                </div>
                {selectedZone && (
                    <Button
                        onClick={handleRecalculate}
                        disabled={calculatingRoute}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${calculatingRoute ? 'animate-spin' : ''}`} />
                        Recalculate
                    </Button>
                )}
            </div>

            {/* ORS Key Warning */}
            {noKeyWarning && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />
                    <div>
                        <p className="font-semibold">Route optimization unavailable</p>
                        <p className="mt-0.5 text-amber-700">
                            Add your free OpenRouteService API key to <code className="bg-amber-100 px-1 rounded">.env</code> as{' '}
                            <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_ORS_API_KEY</code> to enable optimized routing.
                            Until then, stops are displayed in their zone order.{' '}
                            <a href="https://openrouteservice.org/dev/#/signup" target="_blank" rel="noreferrer"
                                className="underline font-medium">Get free key →</a>
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* Zone Selector Panel */}
                <div className="col-span-4 space-y-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-purple-600" />
                                Select Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                            {loadingZones ? (
                                <div className="text-sm text-gray-400 py-4 text-center">Loading zones...</div>
                            ) : zones.length === 0 ? (
                                <div className="text-sm text-gray-400 py-4 text-center">
                                    No zones found. Create zones first.
                                </div>
                            ) : (
                                zones.map(zone => {
                                    const isSelected = selectedZone?.id === zone.id
                                    const customerCount = (zone.customers?.length || 0)
                                    const rider = zone.rider as any
                                    return (
                                        <button
                                            key={zone.id}
                                            onClick={() => handleSelectZone(zone)}
                                            className={`w-full text-left rounded-lg border px-3 py-3 transition-all ${
                                                isSelected
                                                    ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-400'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-sm">{zone.zone_name}</p>
                                                    {zone.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{zone.description}</p>
                                                    )}
                                                </div>
                                                <ChevronRight className={`h-4 w-4 mt-0.5 transition-colors ${isSelected ? 'text-purple-600' : 'text-gray-300'}`} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Users className="h-3 w-3" /> {customerCount}
                                                </span>
                                                {rider ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <Bike className="h-3 w-3" />
                                                        {rider.person?.first_name} {rider.person?.last_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-amber-500">No rider</span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Route Summary Card */}
                    {selectedZone && route && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Route className="h-4 w-4 text-indigo-600" />
                                    Route Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-indigo-50 p-3 text-center">
                                        <Ruler className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-indigo-700">{route.totalDistanceKm} km</p>
                                        <p className="text-xs text-indigo-500">Total Distance</p>
                                    </div>
                                    <div className="rounded-lg bg-purple-50 p-3 text-center">
                                        <Timer className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-purple-700">{route.totalDurationMin} min</p>
                                        <p className="text-xs text-purple-500">Est. Duration</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>{completedCount} delivered</span>
                                        <span>{pendingCount} pending</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-1">{progressPct}% complete</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stop Order List */}
                    {selectedZone && stops.length > 1 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    Delivery Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-1.5">
                                {stops.map((stop, idx) => {
                                    const isDone = completedStops.has(stop.id)
                                    const isDepot = stop.type === 'depot'
                                    return (
                                        <button
                                            key={stop.id}
                                            onClick={() => !isDepot && handleStopClick(stop)}
                                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-left ${
                                                isDepot
                                                    ? 'bg-purple-50 cursor-default'
                                                    : isDone
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'hover:bg-gray-50 cursor-pointer'
                                            }`}
                                        >
                                            <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                isDepot ? 'bg-purple-600 text-white' :
                                                isDone ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                                            }`}>
                                                {isDepot ? 'D' : idx}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isDone ? 'line-through opacity-60' : ''}`}>
                                                    {stop.name}
                                                </p>
                                                {stop.address && (
                                                    <p className="text-xs text-gray-400 truncate">{stop.address}</p>
                                                )}
                                            </div>
                                            {!isDepot && (
                                                isDone
                                                    ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    : <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Map Panel */}
                <div className="col-span-8">
                    {calculatingRoute ? (
                        <div className="w-full rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center"
                            style={{ height: '480px' }}>
                            <div className="text-center text-gray-500">
                                <Navigation className="mx-auto h-10 w-10 mb-3 animate-bounce text-indigo-500" />
                                <p className="font-semibold text-indigo-700">Calculating optimal route...</p>
                                <p className="text-sm text-gray-400 mt-1">Querying OpenRouteService</p>
                            </div>
                        </div>
                    ) : !selectedZone ? (
                        <div className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center"
                            style={{ height: '480px' }}>
                            <div className="text-center text-gray-400">
                                <MapPin className="mx-auto h-12 w-12 mb-3 text-gray-300" />
                                <p className="font-medium text-gray-500">Select a delivery zone</p>
                                <p className="text-sm mt-1">The optimized route will appear here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Map legend */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-purple-600 inline-block" />
                                    Depot
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-blue-600 inline-block" />
                                    Pending
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded-full bg-green-600 inline-block" />
                                    Delivered
                                </span>
                                <span className="flex items-center gap-1.5 ml-auto italic">
                                    Click a marker or list item to toggle delivery status
                                </span>
                            </div>

                            <DeliveryMap
                                stops={stops}
                                route={route}
                                completedStops={completedStops}
                                onStopClick={handleStopClick}
                            />

                            {/* Leg details */}
                            {route && route.legs.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500 font-medium">Route Segments</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-1">
                                            {route.legs.map((leg, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                                    <span className="text-gray-600">
                                                        <span className="font-medium text-gray-800">{leg.from}</span>
                                                        <span className="mx-1.5 text-gray-400">→</span>
                                                        <span className="font-medium text-gray-800">{leg.to}</span>
                                                    </span>
                                                    <div className="flex items-center gap-3 text-gray-400">
                                                        <span>{leg.distanceKm} km</span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            ~{leg.durationMin} min
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
