import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// iOS Safari ignores user-scalable=no in tabs — block its pinch-zoom gesture.
// (double-tap zoom and sideways pan are handled by touch-action: pan-y in CSS)
document.addEventListener('gesturestart', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
