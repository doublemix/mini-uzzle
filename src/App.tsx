import { useEffect, useState } from 'react'
import { DebugPage } from './pages/DebugPage'
import { MainPage } from './pages/MainPage'
import './App.css'

type Route = 'main' | 'debug'

function readRoute(): Route {
  return window.location.hash.startsWith('#/debug') ? 'debug' : 'main'
}

function App() {
  const [route, setRoute] = useState<Route>(() => readRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div className="page-root">
      <header className="topbar">
        <a className="brand" href="#/">
          Uzzle Stack Royale
        </a>
        <nav className="topnav" aria-label="Page mode">
          <a
            href="#/"
            className={route === 'main' ? 'nav-link active' : 'nav-link'}
          >
            Card Generator
          </a>
          <a
            href="#/debug"
            className={route === 'debug' ? 'nav-link active' : 'nav-link'}
          >
            Debug Lab
          </a>
        </nav>
      </header>

      {route === 'debug' ? <DebugPage /> : <MainPage />}
    </div>
  )
}

export default App
