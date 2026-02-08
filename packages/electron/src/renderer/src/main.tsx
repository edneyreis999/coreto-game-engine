import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles.css'

/**
 * React Entry Point
 *
 * Mounts the React application to the DOM root element.
 * ErrorBoundary catches and displays errors from child components.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element. React app cannot mount.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
