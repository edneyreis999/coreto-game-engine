import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

/**
 * React Entry Point
 *
 * Mounts the React application to the DOM root element.
 */

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
