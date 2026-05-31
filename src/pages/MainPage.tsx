import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGameState } from '../game/state/useGameState'
import { BLOCK_HALF_UNIT } from '../game/types'

const CARD_SIZE = 420
const CARD_PADDING = 24
const CARD_PADDING_RATIO = CARD_PADDING / CARD_SIZE
const FLIP_MS = 560
type Puzzle = ReturnType<typeof useGameState>['puzzle']
type FaceContent =
  | { kind: 'setup' }
  | { kind: 'puzzle'; puzzle: Puzzle }

function cardLayout(blocks: Puzzle['blocks']) {
  if (blocks.length === 0) {
    return {
      scale: 1,
      offsetX: CARD_PADDING_RATIO,
      offsetY: CARD_PADDING_RATIO,
    }
  }

  const minX = Math.min(...blocks.map((block) => block.x * BLOCK_HALF_UNIT))
  const maxX = Math.max(...blocks.map((block) => (block.x + block.width) * BLOCK_HALF_UNIT))
  const minY = Math.min(...blocks.map((block) => block.y * BLOCK_HALF_UNIT))
  const maxY = Math.max(...blocks.map((block) => (block.y + block.height) * BLOCK_HALF_UNIT))
  const contentWidth = Math.max(1, maxX - minX)
  const contentHeight = Math.max(1, maxY - minY)
  const availableRatio = 1 - CARD_PADDING_RATIO * 2
  const scale = Math.min(availableRatio / contentWidth, availableRatio / contentHeight)
  const scaledWidth = contentWidth * scale
  const scaledHeight = contentHeight * scale

  return {
    scale,
    offsetX: (1 - scaledWidth) / 2 - minX * scale,
    offsetY: (1 - scaledHeight) / 2 - minY * scale,
  }
}

function PatternFace({ puzzle }: { puzzle: Puzzle }) {
  const layout = useMemo(() => cardLayout(puzzle.blocks), [puzzle.blocks])

  return (
    <div className="pattern-canvas">
      {puzzle.blocks.map((block) => (
        <div
          key={block.id}
          className={`pattern-block block-${block.color}`}
          style={{
            left: `${(layout.offsetX + block.x * BLOCK_HALF_UNIT * layout.scale) * 100}%`,
            bottom: `${(layout.offsetY + block.y * BLOCK_HALF_UNIT * layout.scale) * 100}%`,
            width: `${block.width * BLOCK_HALF_UNIT * layout.scale * 100}%`,
            height: `${block.height * BLOCK_HALF_UNIT * layout.scale * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

function SetupFace({
  setCount,
  onSetChange,
}: {
  setCount: number
  onSetChange: (value: number) => void
}) {
  return (
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
  )
}

function Face({
  content,
  setCount,
  onSetChange,
}: {
  content: FaceContent
  setCount: number
  onSetChange: (value: number) => void
}) {
  if (content.kind === 'setup') {
    return <SetupFace setCount={setCount} onSetChange={onSetChange} />
  }

  return <PatternFace puzzle={content.puzzle} />
}

interface MainPageProps {
  onBackAvailabilityChange: (visible: boolean, handler: () => void) => void
}

export function MainPage({ onBackAvailabilityChange }: MainPageProps) {
  const {
    initialHasSeed,
    puzzle,
    setCount,
    regenerate,
    setSetCount,
    clearShareableState,
  } = useGameState()
  const [frontFace, setFrontFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'puzzle', puzzle } : { kind: 'setup' },
  )
  const [backFace, setBackFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'setup' } : { kind: 'puzzle', puzzle },
  )
  const [showBack, setShowBack] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const settleTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current)
      }
    }
  }, [])

  const onSetChange = useCallback((value: number) => {
    setSetCount(value)
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }

    setShowBack(false)
    setIsFlipping(false)
    setFrontFace({ kind: 'setup' })
    setBackFace({ kind: 'puzzle', puzzle })
  }, [puzzle, setSetCount])

  const startFlipTo = useCallback((target: FaceContent) => {
    if (isFlipping) {
      return
    }

    setIsFlipping(true)

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }

    if (showBack) {
      // Back is currently visible, so stage target on front then flip to front.
      setFrontFace(target)
      setShowBack(false)
      settleTimerRef.current = window.setTimeout(() => {
        setBackFace(target)
        setIsFlipping(false)
        settleTimerRef.current = null
      }, FLIP_MS)
      return
    }

    // Front is currently visible, so stage target on back then flip to back.
    setBackFace(target)
    setShowBack(true)
    settleTimerRef.current = window.setTimeout(() => {
      setFrontFace(target)
      setIsFlipping(false)
      settleTimerRef.current = null
    }, FLIP_MS)
  }, [isFlipping, showBack])

  const onGenerate = useCallback(() => {
    const nextPuzzle = regenerate()
    startFlipTo({ kind: 'puzzle', puzzle: nextPuzzle })
  }, [regenerate, startFlipTo])

  const onBack = useCallback(() => {
    clearShareableState()
    startFlipTo({ kind: 'setup' })
  }, [clearShareableState, startFlipTo])

  const cardAngle = showBack ? 180 : 0
  const visibleFace = showBack ? backFace : frontFace
  const showBackButton = visibleFace.kind === 'puzzle'
  const ariaLabel = visibleFace.kind === 'puzzle'
    ? visibleFace.puzzle.name
    : 'Generator setup card'

  useEffect(() => {
    onBackAvailabilityChange(showBackButton, onBack)
  }, [onBackAvailabilityChange, onBack, showBackButton])

  return (
    <main className="main-redesign">
      <section className="main-center-stage">
        <div className="flip-scene">
          <article
            className="flip-card"
            style={{ transform: `rotateY(${cardAngle}deg)` }}
            role="img"
            aria-label={ariaLabel}
          >
            <div className="flip-face flip-front">
              <Face content={frontFace} setCount={setCount} onSetChange={onSetChange} />
            </div>

            <div className="flip-face flip-back">
              <Face content={backFace} setCount={setCount} onSetChange={onSetChange} />
            </div>
          </article>
        </div>

        <button type="button" className="generate-floating" onClick={onGenerate}>
          Generate Card
        </button>
      </section>
    </main>
  )
}