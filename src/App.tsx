import { Board } from './game/ui/Board'
import { CardControls } from './game/ui/CardControls'
import { useGameState } from './game/state/useGameState'
import './App.css'

function App() {
  const {
    puzzle,
    seed,
    setCount,
    totalBlocks,
    interestingness,
    stabilityMargin,
    validation,
    regenerate,
    setSeed,
    setSetCount,
  } = useGameState()

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Uzzle Stack Royale</p>
        <h1>Generate build pattern cards on a half-tile grid.</h1>
        <p className="hero-copy">
          Generate printable-style patterns for your physical block sets using
          seeded layouts, scaled board bounds, and center-of-mass stability
          checks.
        </p>
        <CardControls
          seed={seed}
          setCount={setCount}
          onSeedChange={setSeed}
          onSetCountChange={setSetCount}
          onRegenerate={regenerate}
        />
      </section>

      <section className="workspace-panel" aria-label="Generated puzzle card">
        <header className="panel-header">
          <div>
            <p className="panel-label">Current card</p>
            <h2>{puzzle.name}</h2>
          </div>
          <div className="metadata-grid">
            <div>
              <span>Blocks</span>
              <strong>{totalBlocks}</strong>
            </div>
            <div>
              <span>Sets</span>
              <strong>{setCount}</strong>
            </div>
            <div>
              <span>Stability margin</span>
              <strong>{stabilityMargin.toFixed(2)}</strong>
            </div>
            <div>
              <span>Interestingness</span>
              <strong>{interestingness.toFixed(2)}</strong>
            </div>
          </div>
        </header>

        <Board puzzle={puzzle} />

        <div className="validation-panel">
          <div>
            <p className="panel-label">Validation</p>
            <h3>{validation.isValid ? 'Card is buildable' : 'Needs review'}</h3>
            <p>
              {validation.isValid
                ? 'Every supported substructure keeps its combined center of mass inside a safe support span.'
                : 'The generated pattern failed one or more support, contact, or stability checks.'}
            </p>
          </div>
          <ul>
            {validation.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

export default App
