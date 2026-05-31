import { useEffect, useState } from 'react'
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
        <a className="brand" href="#/" aria-label="Home">
          the Uzzle: Stack Royale
        </a>
        {isDev && route === 'debug' ? <span className="dev-badge">Debug Mode</span> : null}
      </header>

      {route === 'debug' ? <DebugPage /> : <MainPage />}
    </div>
  )
}

export default App
