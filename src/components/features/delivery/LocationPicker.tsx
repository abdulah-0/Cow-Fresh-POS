'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Loader2, Crosshair, MapPin } from 'lucide-react'

interface LocationPickerProps {
    latitude?: number | null
    longitude?: number | null
    onLocationChange: (lat: number, lng: number) => void
}

export default function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
    const mapRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [locating, setLocating] = useState(false)
    const [pinned, setPinned] = useState(false)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    )

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return

        const defaultCenter: [number, number] = coords
            ? [coords.lat, coords.lng]
            : [33.5362, 73.0931]

        const map = L.map(containerRef.current!, {
            center: defaultCenter,
            zoom: 15,
            zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map)

        const icon = L.divIcon({
            className: '',
            html: `
                <div style="
                    background:#7c3aed;color:white;width:36px;height:36px;
                    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
                    display:flex;align-items:center;justify-content:center;
                ">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
        })

        const marker = L.marker(defaultCenter, { icon, draggable: true }).addTo(map)
        markerRef.current = marker

        marker.on('dragend', () => {
            const pos = marker.getLatLng()
            setCoords({ lat: pos.lat, lng: pos.lng })
            setPinned(true)
            onLocationChange(pos.lat, pos.lng)
        })

        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng)
            setCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
            setPinned(true)
            onLocationChange(e.latlng.lat, e.latlng.lng)
        })

        mapRef.current = map

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const detectLocation = () => {
        if (!navigator.geolocation) {
            return
        }
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords
                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView([lat, lng], 17)
                    markerRef.current.setLatLng([lat, lng])
                }
                setCoords({ lat, lng })
                setPinned(true)
                onLocationChange(lat, lng)
                setLocating(false)
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Pin Customer Location</Label>
                <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locating}
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                    {locating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Crosshair className="h-3.5 w-3.5" />
                    )}
                    {locating ? 'Detecting...' : 'My Location'}
                </button>
            </div>
            <div
                ref={containerRef}
                className="w-full rounded-xl overflow-hidden border border-gray-200"
                style={{ height: '250px' }}
            />
            {coords && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-purple-500" />
                    <span>
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        {pinned && <span className="ml-1 text-green-600 font-medium">(pinned)</span>}
                    </span>
                </div>
            )}
            {!coords && (
                <p className="text-xs text-gray-400">Click on the map or use &quot;My Location&quot; to pin the customer&apos;s house</p>
            )}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-gray-500">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="e.g. 33.5362"
                        value={coords?.lat ?? ''}
                        onChange={e => {
                            const lat = parseFloat(e.target.value)
                            if (!isNaN(lat) && mapRef.current && markerRef.current) {
                                const lng = coords?.lng ?? 73.0931
                                mapRef.current.setView([lat, lng], 17)
                                markerRef.current.setLatLng([lat, lng])
                                setCoords({ lat, lng })
                                setPinned(true)
                                onLocationChange(lat, lng)
                            }
                        }}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="e.g. 73.0931"
                        value={coords?.lng ?? ''}
                        onChange={e => {
                            const lng = parseFloat(e.target.value)
                            if (!isNaN(lng) && mapRef.current && markerRef.current) {
                                const lat = coords?.lat ?? 33.5362
                                mapRef.current.setView([lat, lng], 17)
                                markerRef.current.setLatLng([lat, lng])
                                setCoords({ lat, lng })
                                setPinned(true)
                                onLocationChange(lat, lng)
                            }
                        }}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                    />
                </div>
            </div>
        </div>
    )
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium text-gray-700">{children}</label>
}
