import { useCallback, useEffect, useRef, useState } from 'react'
import { DebugPage } from './pages/DebugPage'
import { MainPage } from './pages/MainPage'
import './App.css'

type Route = 'main' | 'debug'

function readRoute(): Route {
  return window.location.hash.startsWith('#/debug') ? 'debug' : 'main'
}

function App() {
  const isDev = import.meta.env.DEV
  const [route, setRoute] = useState<Route>(() => {
    const initial = readRoute()
    return initial === 'debug' && !isDev ? 'main' : initial
  })
  const [showMainBack, setShowMainBack] = useState(false)
  const mainBackHandlerRef = useRef<(() => void) | null>(null)

  const handleMainBackChange = useCallback((visible: boolean, handler: () => void) => {
    mainBackHandlerRef.current = handler
    setShowMainBack(visible)
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const next = readRoute()
      setRoute(next === 'debug' && !isDev ? 'main' : next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [isDev])

  return (
    <div className="page-root">
      <header className="topbar">
        <div className="topbar-slot topbar-slot-leading">
          {route === 'main' && showMainBack ? (
            <button
              type="button"
              className="appbar-back-button"
              onClick={() => mainBackHandlerRef.current?.()}
              aria-label="Go back"
              title="Back"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                  fill="currentColor"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="topbar-slot topbar-slot-center">
          <a className="brand" href="#/" aria-label="Home">
            the Uzzle: Stack Royale
          </a>
        </div>

        <div className="topbar-slot topbar-slot-trailing">
          {isDev && route === 'debug' ? <span className="dev-badge">Debug Mode</span> : null}
        </div>
      </header>

      {route === 'debug' ? (
        <DebugPage />
      ) : (
        <MainPage onBackAvailabilityChange={handleMainBackChange} />
      )}
    </div>
  )
}

export default App
