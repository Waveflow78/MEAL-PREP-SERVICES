'use client'
/**
 * AddressPicker
 * Two modes:
 *   1. GPS — browser geolocation → reverse geocode via Google Maps
 *   2. Search — Google Places Autocomplete on a text input
 *
 * Once a location is chosen either way, a small Google Map is shown with
 * a draggable pin. Dragging the pin reverse-geocodes the new position.
 *
 * Falls back to a plain text input if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { loadGoogleMaps, hasMapsKey } from '@/lib/googleMaps'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMap   = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Marker = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AC     = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gm = () => (window as any).google.maps

export interface PickedLocation {
  address: string
  lat: number
  lng: number
}

interface Props {
  value: PickedLocation | null
  onChange: (loc: PickedLocation) => void
  label?: string
}

export default function AddressPicker({ value, onChange, label = 'Delivery Address' }: Props) {
  const [mapsReady, setMapsReady] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [gpsError, setGpsError]   = useState('')

  const searchRef  = useRef<HTMLInputElement>(null)
  const mapDivRef  = useRef<HTMLDivElement>(null)
  const mapObj     = useRef<GMap>(null)
  const markerObj  = useRef<Marker>(null)
  const acObj      = useRef<AC>(null)

  // ── Load Google Maps once ──────────────────────────────────────────
  useEffect(() => {
    if (!hasMapsKey()) return
    loadGoogleMaps().then(() => setMapsReady(true))
  }, [])

  // ── Reverse geocode ────────────────────────────────────────────────
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const geocoder = new (gm().Geocoder)()
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      const address =
        status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      onChange({ address, lat, lng })
    })
  }, [onChange])

  // ── Build / update map ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !value || !mapDivRef.current) return

    const center = { lat: value.lat, lng: value.lng }

    if (!mapObj.current) {
      // First render — create map + marker
      const map = new (gm().Map)(mapDivRef.current, {
        center,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      })

      const marker = new (gm().Marker)({
        position: center,
        map,
        draggable: true,
        animation: gm().Animation.DROP,
        title: 'Drag to adjust pin',
      })

      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        if (pos) reverseGeocode(pos.lat(), pos.lng())
      })

      mapObj.current    = map
      markerObj.current = marker
    } else {
      // Subsequent updates — pan + reposition
      const latLng = new (gm().LatLng)(value.lat, value.lng)
      mapObj.current.panTo(latLng)
      markerObj.current?.setPosition(latLng)
    }
  }, [mapsReady, value, reverseGeocode])

  // ── Attach Places Autocomplete to search input ─────────────────────
  useEffect(() => {
    if (!mapsReady || !searchRef.current || acObj.current) return

    const ac = new (gm().places.Autocomplete)(searchRef.current, {
      componentRestrictions: { country: 'ke' },
      fields: ['formatted_address', 'geometry', 'name'],
    })

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place?.geometry?.location) return
      onChange({
        address: place.formatted_address || place.name || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      })
      // Clear the search box after selection so it doesn't look stale
      if (searchRef.current) searchRef.current.value = ''
    })

    acObj.current = ac
  }, [mapsReady, onChange])

  // ── GPS handler ────────────────────────────────────────────────────
  function handleGPS() {
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location access.')
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGpsStatus('idle')
        if (mapsReady) {
          reverseGeocode(coords.latitude, coords.longitude)
        } else {
          // No Maps API — store raw coords
          onChange({
            address: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
            lat: coords.latitude,
            lng: coords.longitude,
          })
        }
      },
      (err) => {
        setGpsStatus('error')
        setGpsError(
          err.code === 1
            ? 'Location permission denied. Please allow access in your browser settings.'
            : err.code === 2
            ? 'Location unavailable. Try searching manually.'
            : 'Location timed out. Try again or search manually.'
        )
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    )
  }

  // ── No API key — plain text fallback ──────────────────────────────
  if (!hasMapsKey()) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-mid">{label}</label>
        <input
          type="text"
          value={value?.address ?? ''}
          onChange={(e) => onChange({ address: e.target.value, lat: 0, lng: 0 })}
          placeholder="e.g. 14 Nairobi Lane, Westlands, Nairobi"
          className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-medium text-mid">{label}</label>

      {/* ── Option 1: GPS ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsStatus === 'loading'}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-forest/40 bg-forest/5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest/10 disabled:opacity-60"
      >
        {gpsStatus === 'loading' ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            Getting your location…
          </>
        ) : (
          <>📍 Use my phone&apos;s current location</>
        )}
      </button>

      {gpsStatus === 'error' && (
        <p className="flex items-start gap-1.5 rounded-lg bg-[rgba(196,98,45,0.08)] px-3 py-2 text-xs text-terracotta">
          <span className="shrink-0 mt-0.5">⚠️</span>
          {gpsError}
        </p>
      )}

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-[rgba(45,74,62,0.15)]" />
        <span className="text-[11px] font-medium text-muted uppercase tracking-wide">or search</span>
        <div className="flex-1 border-t border-[rgba(45,74,62,0.15)]" />
      </div>

      {/* ── Option 2: Google Places Autocomplete ──────────────────── */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder={mapsReady ? 'Search an address on Google Maps…' : 'Loading maps…'}
          disabled={!mapsReady}
          className="w-full rounded-xl border border-[rgba(45,74,62,0.25)] bg-warm-white py-2.5 pl-9 pr-3 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20 disabled:opacity-50"
        />
      </div>

      {/* ── Map + confirmed address (shown once we have a location) ── */}
      {value && (
        <div className="space-y-2 pt-1">
          {/* Map */}
          <div
            ref={mapDivRef}
            className="h-48 w-full rounded-xl border border-[rgba(45,74,62,0.15)] overflow-hidden shadow-sm"
          />

          {/* Confirmed address chip */}
          <div className="flex items-start gap-2 rounded-xl bg-forest/8 px-3 py-2.5">
            <span className="mt-0.5 shrink-0 text-forest">📌</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-charcoal leading-snug">{value.address}</p>
              <p className="mt-0.5 text-[11px] text-muted">Drag the pin to fine-tune your exact location</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
