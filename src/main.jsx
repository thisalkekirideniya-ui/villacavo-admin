// Entry point of the Villa Cavo admin panel (a separate app from the website).
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AdminApp from './AdminApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>
)
