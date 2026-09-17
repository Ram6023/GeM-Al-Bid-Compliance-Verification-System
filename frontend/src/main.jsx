import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Configure Axios Base URL: Use VITE_API_URL or fallback to the live Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gem-al-bid-compliance-verification-system.onrender.com'
axios.defaults.baseURL = API_BASE_URL

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
