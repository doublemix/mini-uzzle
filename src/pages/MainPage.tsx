import { Board } from '../game/ui/Board'
import { useGameState } from '../game/state/useGameState'

export function MainPage() {
  const {
    puzzle,
    seed,
    setCount,
    totalBlocks,
    interestingness,
    stabilityMargin,
    regenerate,
    setSetCount,
  } = useGameState()

  return (
    <main className="main-layout">
      <section className="main-hero">
        <p className="eyebrow">Build Pattern Cards</p>
        <h1>Generate your next stacking challenge in seconds.</h1>
        <p>
          Pick the number of physical block sets you have, generate a pattern,
          and build it at the table.
        </p>

        <div className="main-actions">
          <label>
            <span>Sets</span>
            <select
              value={setCount}
              onChange={(event) => setSetCount(Number(event.target.value))}
            >
              <option value={1}>1 set</option>
              <option value={2}>2 sets</option>
              <option value={3}>3 sets</option>
              <option value={4}>4 sets</option>
            </select>
          </label>
          <button type="button" onClick={regenerate}>
            Generate New Pattern
          </button>
        </div>

        <p className="seed-note">Seed: {seed}</p>
      </section>

      <section className="main-board" aria-label="Pattern preview">
        <header className="panel-header">
          <div>
            <p className="panel-label">Pattern card</p>
            <h2>{puzzle.name}</h2>
          </div>
          <div className="metadata-grid">
            <div>
              <span>Blocks</span>
              <strong>{totalBlocks}</strong>
            </div>
            <div>
              <span>Interestingness</span>
              <strong>{interestingness.toFixed(2)}</strong>
            </div>
            <div>
              <span>Stability</span>
              <strong>{stabilityMargin.toFixed(2)}</strong>
            </div>
          </div>
        </header>

        <Board puzzle={puzzle} />
      </section>
    </main>
  )
}