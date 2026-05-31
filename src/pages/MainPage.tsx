import { useMemo, useState } from 'react'
import { useGameState } from '../game/state/useGameState'
import { BLOCK_HALF_UNIT } from '../game/types'

const CARD_SIZE = 420
const CARD_PADDING = 24

function cardLayout(
  blocks: ReturnType<typeof useGameState>['puzzle']['blocks'],
) {
  if (blocks.length === 0) {
    return {
      scale: 1,
      offsetX: CARD_PADDING,
      offsetY: CARD_PADDING,
      width: 0,
      height: 0,
    }
  }

  const minX = Math.min(...blocks.map((block) => block.x * BLOCK_HALF_UNIT))
  const maxX = Math.max(...blocks.map((block) => (block.x + block.width) * BLOCK_HALF_UNIT))
  const minY = Math.min(...blocks.map((block) => block.y * BLOCK_HALF_UNIT))
  const maxY = Math.max(...blocks.map((block) => (block.y + block.height) * BLOCK_HALF_UNIT))
  const contentWidth = Math.max(1, maxX - minX)
  const contentHeight = Math.max(1, maxY - minY)
  const available = CARD_SIZE - CARD_PADDING * 2
  const scale = Math.min(available / contentWidth, available / contentHeight)
  const scaledWidth = contentWidth * scale
  const scaledHeight = contentHeight * scale

  return {
    scale,
    width: contentWidth,
    height: contentHeight,
    offsetX: (CARD_SIZE - scaledWidth) / 2 - minX * scale,
    offsetY: (CARD_SIZE - scaledHeight) / 2 - minY * scale,
  }
}

export function MainPage() {
  const {
    puzzle,
    setCount,
    regenerate,
    setSetCount,
  } = useGameState()
  const [hasGenerated, setHasGenerated] = useState(false)
  const layout = useMemo(() => cardLayout(puzzle.blocks), [puzzle.blocks])

  const onSetChange = (value: number) => {
    setSetCount(value)
    setHasGenerated(false)
  }

  const onGenerate = () => {
    regenerate()
    setHasGenerated(true)
  }

  return (
    <main className="main-simple">
      <section className="main-entry">
        <h1>Uzzle Stack Royale Card Generator</h1>
        <p>Choose your sets, then generate a build card for your physical blocks.</p>
        <div className="main-actions">
          <label>
            <span>Number of sets</span>
            <select
              value={setCount}
              onChange={(event) => onSetChange(Number(event.target.value))}
            >
              <option value={1}>1 set</option>
              <option value={2}>2 sets</option>
              <option value={3}>3 sets</option>
              <option value={4}>4 sets</option>
            </select>
          </label>
          <button type="button" onClick={onGenerate}>Generate Card</button>
        </div>
      </section>

      <section className="card-stage" aria-label="Card preview">
        <article className="pattern-card" role="img" aria-label={hasGenerated ? puzzle.name : 'No card generated yet'}>
          {hasGenerated ? (
            <div className="pattern-canvas">
              {puzzle.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`pattern-block block-${block.color}`}
                  style={{
                    left: layout.offsetX + block.x * BLOCK_HALF_UNIT * layout.scale,
                    bottom: layout.offsetY + block.y * BLOCK_HALF_UNIT * layout.scale,
                    width: block.width * BLOCK_HALF_UNIT * layout.scale,
                    height: block.height * BLOCK_HALF_UNIT * layout.scale,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="empty-card-note">Generate a card to preview it here.</p>
          )}
        </article>
      </section>
    </main>
  )
}