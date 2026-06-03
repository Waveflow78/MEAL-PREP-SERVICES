/**
 * Singleton Google Maps script loader.
 * Appends the <script> tag once and resolves all waiting callers.
 */

const CALLBACK = '__maliMealsGmaps'

// Track state in module scope so it persists across React renders
let state: 'idle' | 'loading' | 'ready' = 'idle'
const waiters: Array<() => void> = []

export function loadGoogleMaps(): Promise<void> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key || typeof window === 'undefined') return Promise.resolve()

  // Already loaded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).google?.maps?.places) return Promise.resolve()

  return new Promise<void>((resolve) => {
    waiters.push(resolve)

    if (state !== 'idle') return // already loading — just queue resolver

    state = 'loading'

    // Global callback that Gmaps will call when ready
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)[CALLBACK] = () => {
      state = 'ready'
      waiters.splice(0).forEach((r) => r())
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=${CALLBACK}&loading=async`
    script.async = true
    script.onerror = () => {
      state = 'idle'
      waiters.splice(0).forEach((r) => r()) // resolve anyway — component will gracefully degrade
    }
    document.head.appendChild(script)
  })
}

export const hasMapsKey = () => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
