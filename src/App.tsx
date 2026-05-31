import { useCallback, useEffect, useState } from 'react'
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
  const [mainBackHandler, setMainBackHandler] = useState<(() => void) | null>(null)

  const handleMainBackChange = useCallback((visible: boolean, handler: () => void) => {
    setShowMainBack(visible)
    setMainBackHandler(() => handler)
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
          {route === 'main' && showMainBack && mainBackHandler ? (
            <button type="button" className="appbar-back-button" onClick={mainBackHandler}>
              ← Back
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
