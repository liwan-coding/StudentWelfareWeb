import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/config'
import './styles/global.css'
import './styles/design.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
