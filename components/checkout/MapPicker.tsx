'use client'
import { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { toast } from '@/components/ui/Toast'

export interface DeliveryLocation {
  lat: number
  lng: number
  address: string
}

interface Props {
  value: DeliveryLocation | null
  onChange: (loc: DeliveryLocation) => void
}

const NAIROBI = { lat: -1.2921, lng: 36.8219 }

// Global load promise — only load Maps script once
let _mapsReady: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (_mapsReady) return _mapsReady
  setOptions({ key: apiKey, libraries: ['places', 'geocoding'] })
  _mapsReady = Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
    importLibrary('geocoding'),
  ]).then(() => undefined)
  return _mapsReady
}

export default function MapPicker({ value, onChange }: Props) {
  const mapDivRef  = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<google.maps.Map | null>(null)
  const markerRef  = useRef<google.maps.Marker | null>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [address,  setAddress]  = useState(value?.address ?? '')
  const [locating, setLocating] = useState(false)
  const [ready,    setReady]    = useState(false)
  const [noKey,    setNoKey]    = useState(false)

  /* ── helpers ── */
  function reverseGeocode(lat: number, lng: number) {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const addr =
        status === 'OK' && results?.[0]
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setAddress(addr)
      onChangeRef.current({ lat, lng, address: addr })
    })
  }

  /* ── init map ── */
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
    if (!apiKey) { setNoKey(true); return }

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mapDivRef.current) return
        const center = value ?? NAIROBI

        const map = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        })
        mapRef.current = map

        const marker = new google.maps.Marker({
          position: center,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Drag to set delivery location',
        })
        markerRef.current = marker

        // Drag pin
        marker.addListener('dragend', () => {
          const pos = marker.getPosition()!
          reverseGeocode(pos.lat(), pos.lng())
        })

        // Tap/click map
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return
          marker.setPosition(e.latLng)
          reverseGeocode(e.latLng.lat(), e.latLng.lng())
        })

        // Places Autocomplete on search input
        if (inputRef.current) {
          const ac = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'ke' },
            fields: ['geometry', 'formatted_address', 'name'],
          })
          ac.addListener('place_changed', () => {
            const place = ac.getPlace()
            if (!place.geometry?.location) return
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const addr = place.formatted_address ?? place.name ?? ''
            map.panTo({ lat, lng })
            marker.setPosition({ lat, lng })
            setAddress(addr)
            onChangeRef.current({ lat, lng, address: addr })
          })
        }

        setReady(true)
      })
      .catch(() => setNoKey(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── GPS button ── */
  function handleUseLocation() {
    if (!navigator.geolocation) { toast('Geolocation not supported', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        mapRef.current?.panTo({ lat, lng })
        markerRef.current?.setPosition({ lat, lng })
        reverseGeocode(lat, lng)
        setLocating(false)
      },
      () => {
        toast('Could not get location — please allow location access.', 'error')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  /* ── Fallback (no API key) ── */
  if (noKey) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-mid">Delivery Address</label>
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            onChange({ lat: 0, lng: 0, address: e.target.value })
          }}
          placeholder="e.g. 14 Riverside Drive, Westlands, Nairobi"
          className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20"
        />
        <p className="text-xs text-amber-600">
          ⚠ Set <code className="bg-amber-50 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable map picker
        </p>
      </div>
    )
  }

  /* ── Full map UI ── */
  return (
    <div className="space-y-2">
      {/* Address search */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-mid">Delivery Address</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">🔍</span>
          <input
            ref={inputRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search your delivery address…"
            className="w-full rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white pl-8 pr-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20"
          />
        </div>
      </div>

      {/* Use my location */}
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={locating || !ready}
        className="flex items-center gap-2 rounded-lg border border-forest/40 bg-forest/5 px-3 py-1.5 text-xs font-medium text-forest transition-colors hover:bg-forest/10 disabled:opacity-50"
      >
        {locating
          ? <><span className="inline-block h-3 w-3 rounded-full border-2 border-forest border-t-transparent animate-spin" />Getting your location…</>
          : <><span>📍</span>Use my current location</>}
      </button>

      {/* Map */}
      <div className="relative h-52 w-full rounded-xl overflow-hidden border border-[rgba(45,74,62,0.12)]">
        <div ref={mapDivRef} className="h-full w-full" />
        {!ready && (
          <div className="absolute inset-0 bg-cream flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
            <span className="text-xs text-muted">Loading map…</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted truncate">
        {address ? `📌 ${address}` : 'Tap the map or drag the pin to set your delivery location'}
      </p>
    </div>
  )
}
