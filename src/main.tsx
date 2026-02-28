import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './mobile.css'
import { BrowserRouter } from 'react-router-dom'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.log('SW Registration Failed', err));
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GlobalErrorBoundary>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GlobalErrorBoundary>
    </React.StrictMode>,
)
