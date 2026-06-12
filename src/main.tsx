import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './demo/App'
import './demo/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
