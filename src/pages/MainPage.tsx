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
  const [showCard, setShowCard] = useState(false)
  const [spinTurns, setSpinTurns] = useState(0)
  const [cardKey, setCardKey] = useState(0)
  const layout = useMemo(() => cardLayout(puzzle.blocks), [puzzle.blocks])

  const onSetChange = (value: number) => {
    setSetCount(value)
    setShowCard(false)
    setSpinTurns(0)
    setCardKey((key) => key + 1)
  }

  const onGenerate = () => {
    regenerate()
    if (showCard) {
      setSpinTurns((turns) => turns + 1)
      return
    }

    setShowCard(true)
    setSpinTurns(0)
  }

  const onBack = () => {
    setShowCard(false)
    setSpinTurns(0)
    setCardKey((key) => key + 1)
  }

  const cardAngle = showCard ? 180 + spinTurns * 360 : 0

  const cardFace = (
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
  )

  return (
    <main className="main-redesign">
      <section className="main-center-stage">
        {showCard ? (
          <button type="button" className="back-button" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <span className="back-button-spacer" aria-hidden="true" />
        )}

        <div className="flip-scene" key={cardKey}>
          <article
            className="flip-card"
            style={{ transform: `rotateY(${cardAngle}deg)` }}
            role="img"
            aria-label={showCard ? puzzle.name : 'Generator setup card'}
          >
            <div className="flip-face flip-front">
              {!showCard ? (
                <div className="setup-panel">
                  <h1>Card Setup</h1>
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
                </div>
              ) : (
                cardFace
              )}
            </div>

            <div className="flip-face flip-back">{cardFace}</div>
          </article>
        </div>

        <button type="button" className="generate-floating" onClick={onGenerate}>
          Generate Card
        </button>
      </section>
    </main>
  )
}