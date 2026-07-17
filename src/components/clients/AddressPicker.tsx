import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    house_number?: string
    road?: string
    neighbourhood?: string
    suburb?: string
    village?: string
    town?: string
    city?: string
    municipality?: string
    county?: string
    state_district?: string
    state?: string
    region?: string
    postcode?: string
    country?: string
  }
}

export type AddressValue = {
  adresse: string
  codePostal: string
  region: string
  pays: string
  lat?: number
  lon?: number
}

// Leaflet types
type LeafletMap = {
  remove: () => void
  setView: (center: [number, number], zoom: number) => LeafletMap
  getZoom: () => number
  on: (event: string, handler: (e: LeafletMouseEvent) => void) => void
}

type LeafletMarker = {
  setLatLng: (latlng: [number, number]) => void
  addTo: (map: LeafletMap) => LeafletMarker
}

type LeafletTileLayer = {
  addTo: (map: LeafletMap) => LeafletTileLayer
}

type LeafletMouseEvent = {
  latlng: {
    lat: number
    lng: number
  }
}

type LeafletStatic = {
  map: (element: HTMLElement, options?: { zoomControl?: boolean }) => LeafletMap
  tileLayer: (url: string, options: { attribution: string }) => LeafletTileLayer
  marker: (latlng: [number, number]) => LeafletMarker
}

function buildAdresse(addr?: NominatimResult['address']) {
  if (!addr) return ''
  const line1 = [addr.house_number, addr.road].filter(Boolean).join(' ')
  const locality = addr.neighbourhood || addr.suburb || addr.village || addr.town || addr.city || ''
  const parts = [line1, locality].filter(Boolean)
  return parts.join(', ')
}

function extractPostalCode(displayName?: string): string {
  if (!displayName) return ''
  const m = displayName.match(/\b\d{4,6}\b/)
  return m?.[0] || ''
}

function extractRegion(addr?: NominatimResult['address'], displayName?: string): string {
  const fromAddr =
    addr?.state ||
    addr?.region ||
    addr?.state_district ||
    addr?.county ||
    addr?.municipality ||
    addr?.city ||
    addr?.town ||
    addr?.village ||
    ''

  if (fromAddr) return fromAddr
  if (!displayName) return ''

  const parts = displayName.split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return ''

  // Heuristique: souvent la région est avant le pays (dernier)
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
}

let leafletPromise: Promise<void> | null = null

function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if ((window as unknown as { L?: LeafletStatic }).L) return Promise.resolve()
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    const cssId = 'leaflet-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const scriptId = 'leaflet-js'
    if (document.getElementById(scriptId)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.body.appendChild(script)
  })

  return leafletPromise
}

import { useTranslation } from '@/lib/hooks/useTranslation'

export default function AddressPicker({
  value,
  onChange,
}: {
  value: { adresse: string; codePostal: string; region: string; pays: string }
  onChange: (v: AddressValue) => void
}) {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement | null>(null)
  // ... rest of refs ...
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<NominatimResult[]>([])

  const initialCenter = useMemo(() => ({ lat: 36.8065, lon: 10.1815 }), [])

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true)
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`
      const r = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })
      const data = await r.json()
      const addr = data?.address as NominatimResult['address'] | undefined
      const displayName = (data?.display_name as string | undefined) || ''
      const adresseText = buildAdresse(addr) || displayName || value.adresse || ''
      const regionText = extractRegion(addr, displayName) || value.region || ''

      onChange({
        adresse: adresseText,
        codePostal: addr?.postcode || extractPostalCode(displayName) || value.codePostal || '',
        region: regionText,
        pays: addr?.country || value.pays || '',
        lat,
        lon,
      })
    } catch (e) {
      console.error('Reverse geocode failed', e)
    } finally {
      setLoading(false)
    }
  }, [onChange, value])

  const placeMarker = useCallback((lat: number, lon: number) => {
    const L = (window as unknown as { L: LeafletStatic }).L
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lon]).addTo(map)
    } else {
      markerRef.current.setLatLng([lat, lon])
    }
    map.setView([lat, lon], Math.max(map.getZoom(), 14))
  }, [])

  useEffect(() => {
    let mounted = true

      ; (async () => {
        try {
          await loadLeaflet()
          if (!mounted) return

          const L = (window as unknown as { L: LeafletStatic }).L
          if (!L || !mapRef.current || mapInstanceRef.current) return

          const map = L.map(mapRef.current, {
            zoomControl: true,
          }).setView([initialCenter.lat, initialCenter.lon], 6)

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(map)

          mapInstanceRef.current = map

          map.on('click', async (e: LeafletMouseEvent) => {
            const lat = e.latlng.lat
            const lon = e.latlng.lng
            placeMarker(lat, lon)
            await reverseGeocode(lat, lon)
          })
        } catch (e) {
          console.error(e)
        }
      })()

    return () => {
      mounted = false
      try {
        mapInstanceRef.current?.remove?.()
      } catch {
        // ignore
      }
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [initialCenter.lat, initialCenter.lon, reverseGeocode, placeMarker])

  const search = async () => {
    const q = query.trim()
    if (!q) return

    try {
      setLoading(true)
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6`
      const r = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })
      const data = (await r.json()) as NominatimResult[]
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Search failed', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (r: NominatimResult) => {
    const lat = Number(r.lat)
    const lon = Number(r.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return

    placeMarker(lat, lon)

    onChange({
      adresse: buildAdresse(r.address) || r.display_name || '',
      codePostal: r.address?.postcode || extractPostalCode(r.display_name) || '',
      region: extractRegion(r.address, r.display_name) || '',
      pays: r.address?.country || '',
      lat,
      lon,
    })

    setResults([])
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.searchAddress')}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#149fad]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  search()
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#149fad]/20 focus:border-[#149fad] transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
              placeholder={t('clients.searchAddressPlaceholder')}
            />
          </div>
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-[#149fad] hover:bg-[#117a85] text-white shadow-sm disabled:opacity-50"
          >
            {loading ? '...' : t('common.search')}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors border-b last:border-b-0 border-gray-100"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#149fad]/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-[#149fad]" />
                </div>
                <div className="text-sm text-gray-900">{r.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('clients.chooseOnMap')}</label>
        <div className="rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">
          <div ref={mapRef} className="h-64 w-full" />
        </div>
        <p className="mt-2 text-xs text-gray-500">{t('clients.mapTip')}</p>
      </div>
    </div>
  )
}
