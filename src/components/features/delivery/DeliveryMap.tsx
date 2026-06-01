'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Map as LeafletMap } from 'leaflet'
import type { OptimizedRoute, RouteStop } from '@/lib/services/routeService'

interface DeliveryMapProps {
    stops: RouteStop[]
    route: OptimizedRoute | null
    completedStops: Set<number>
    onStopClick: (stop: RouteStop) => void
}

export default function DeliveryMap({ stops, route, completedStops, onStopClick }: DeliveryMapProps) {
    const mapRef = useRef<LeafletMap | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const defaultCenter: [number, number] = [33.5362, 73.0931]
        const firstStop = stops.find(s => s.lat && s.lng)
        const center: [number, number] = firstStop
            ? [firstStop.lat, firstStop.lng]
            : defaultCenter

        const map = L.map(containerRef.current!, {
            center,
            zoom: 13,
            zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map)

        mapRef.current = map

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const map = mapRef.current
        if (!map) return

        const overlays: L.Layer[] = []

        if (route && route.routeGeometry.length > 1) {
            const polyline = L.polyline(route.routeGeometry, {
                color: '#6366f1',
                weight: 4,
                opacity: 0.85,
                dashArray: undefined,
            }).addTo(map)
            overlays.push(polyline)
        }

        stops.forEach((stop, idx) => {
            if (!stop.lat || !stop.lng) return

            const isDone = completedStops.has(stop.id)
            const isDepot = stop.type === 'depot'

            const markerColor = isDepot ? '#7c3aed' : isDone ? '#16a34a' : '#2563eb'
            const labelColor = isDepot ? 'D' : (idx).toString()

            const icon = L.divIcon({
                className: '',
                html: `
                    <div style="
                        background:${markerColor};
                        color:white;
                        width:32px;height:32px;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        border:2px solid white;
                        box-shadow:0 2px 6px rgba(0,0,0,0.35);
                        display:flex;align-items:center;justify-content:center;
                    ">
                        <span style="transform:rotate(45deg);font-size:11px;font-weight:700;">${labelColor}</span>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -36],
            })

            const mapsUrl = !isDepot
                ? `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`
                : null

            const marker = L.marker([stop.lat, stop.lng], { icon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px">
                        <strong style="font-size:13px">${stop.name}</strong><br/>
                        ${stop.address ? `<span style="color:#555;font-size:11px">${stop.address}</span><br/>` : ''}
                        ${stop.phone ? `<span style="font-size:11px">📞 ${stop.phone}</span><br/>` : ''}
                        <span style="
                            display:inline-block;margin-top:4px;padding:2px 8px;
                            border-radius:99px;font-size:10px;font-weight:600;
                            background:${isDone ? '#dcfce7' : '#eff6ff'};
                            color:${isDone ? '#15803d' : '#1d4ed8'};
                        ">${isDone ? '✓ Delivered' : isDepot ? 'Depot' : 'Pending'}</span>
                        ${mapsUrl ? `<br/><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="
                            display:inline-flex;align-items:center;gap:4px;margin-top:6px;
                            padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;
                            background:#4285F4;color:white;text-decoration:none;
                        ">🗺️ Navigate with Google Maps</a>` : ''}
                    </div>
                `)

            marker.on('click', (e) => {
                if (!isDepot) onStopClick(stop)
            })
            overlays.push(marker)
        })

        const validStops = stops.filter(s => s.lat && s.lng)
        if (validStops.length > 1) {
            const bounds = L.latLngBounds(validStops.map(s => [s.lat, s.lng] as [number, number]))
            map.fitBounds(bounds, { padding: [40, 40] })
        }

        return () => {
            overlays.forEach(layer => layer.remove())
        }
    }, [stops, route, completedStops, onStopClick])

    return (
        <div
            ref={containerRef}
            className="w-full rounded-xl overflow-hidden border border-gray-200"
            style={{ height: '480px' }}
        />
    )
}
