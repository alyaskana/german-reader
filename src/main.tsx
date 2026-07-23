import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

// iOS keeps the home-screen app frozen for days, so the service worker never
// gets a natural chance to look for a new build (with the fresh daily story).
// Check for updates every time the app comes back to the foreground.
registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('pageshow', check)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
