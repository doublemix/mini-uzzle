import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFavorites } from '../game/favorites/useFavorites'
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

function PatternFace({
  puzzle,
  isFavorited,
  onToggleFavorite,
}: {
  puzzle: Puzzle
  isFavorited: boolean
  onToggleFavorite: () => void
}) {
  const layout = useMemo(() => cardLayout(puzzle.blocks), [puzzle.blocks])

  return (
    <div className="pattern-canvas">
      <button
        type="button"
        className={`favorite-btn${isFavorited ? ' favorite-btn--active' : ''}`}
        onClick={onToggleFavorite}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
          />
        </svg>
      </button>
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
  favoritesCount,
  onBrowseFavorites,
}: {
  setCount: number
  onSetChange: (value: number) => void
  favoritesCount: number
  onBrowseFavorites: () => void
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
      {favoritesCount > 0 && (
        <button type="button" className="browse-favorites-btn" onClick={onBrowseFavorites}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="currentColor"
            />
          </svg>
          Browse Favorites ({favoritesCount})
        </button>
      )}
    </div>
  )
}

function Face({
  content,
  setCount,
  onSetChange,
  favoritesCount,
  onBrowseFavorites,
  isFavorited,
  onToggleFavorite,
}: {
  content: FaceContent
  setCount: number
  onSetChange: (value: number) => void
  favoritesCount: number
  onBrowseFavorites: () => void
  isFavorited: boolean
  onToggleFavorite: () => void
}) {
  if (content.kind === 'setup') {
    return (
      <SetupFace
        setCount={setCount}
        onSetChange={onSetChange}
        favoritesCount={favoritesCount}
        onBrowseFavorites={onBrowseFavorites}
      />
    )
  }

  return (
    <PatternFace
      puzzle={content.puzzle}
      isFavorited={isFavorited}
      onToggleFavorite={onToggleFavorite}
    />
  )
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
  const { favorites, isFavorited, toggleFavorite, restoreFromFavorite } = useFavorites()

  const [isBrowsingFavorites, setIsBrowsingFavorites] = useState(false)
  const [favoritesIndex, setFavoritesIndex] = useState(0)

  const [frontFace, setFrontFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'puzzle', puzzle } : { kind: 'setup' },
  )
  const [backFace, setBackFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'setup' } : { kind: 'puzzle', puzzle },
  )
  const [showBack, setShowBack] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const settleTimerRef = useRef<number | null>(null)
  const pendingFaceRef = useRef<FaceContent | null>(null)

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

    pendingFaceRef.current = null
    setShowBack(false)
    setIsFlipping(false)
    setFrontFace({ kind: 'setup' })
    setBackFace({ kind: 'puzzle', puzzle })
    setIsBrowsingFavorites(false)
  }, [puzzle, setSetCount])

  const showBackRef = useRef(showBack)
  showBackRef.current = showBack

  const startFlipTo = useCallback((target: FaceContent) => {
    if (isFlipping) {
      // Queue the latest target; previous pending (if any) is discarded.
      pendingFaceRef.current = target
      return
    }

    setIsFlipping(true)
    pendingFaceRef.current = null

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }

    const afterFlip = () => {
      settleTimerRef.current = null
      const next = pendingFaceRef.current
      pendingFaceRef.current = null
      if (next !== null) {
        // Start the queued flip immediately after this one settles.
        setIsFlipping(true)
        const nowShowBack = showBackRef.current
        if (nowShowBack) {
          setFrontFace(next)
          setShowBack(false)
          settleTimerRef.current = window.setTimeout(() => {
            setBackFace(next)
            setIsFlipping(false)
            settleTimerRef.current = null
          }, FLIP_MS)
        } else {
          setBackFace(next)
          setShowBack(true)
          settleTimerRef.current = window.setTimeout(() => {
            setFrontFace(next)
            setIsFlipping(false)
            settleTimerRef.current = null
          }, FLIP_MS)
        }
      } else {
        setIsFlipping(false)
      }
    }

    if (showBack) {
      // Back is currently visible, so stage target on front then flip to front.
      setFrontFace(target)
      setShowBack(false)
      settleTimerRef.current = window.setTimeout(() => {
        setBackFace(target)
        afterFlip()
      }, FLIP_MS)
      return
    }

    // Front is currently visible, so stage target on back then flip to back.
    setBackFace(target)
    setShowBack(true)
    settleTimerRef.current = window.setTimeout(() => {
      setFrontFace(target)
      afterFlip()
    }, FLIP_MS)
  }, [isFlipping, showBack])

  const onGenerate = useCallback(() => {
    const nextPuzzle = regenerate()
    startFlipTo({ kind: 'puzzle', puzzle: nextPuzzle })
  }, [regenerate, startFlipTo])

  const onBack = useCallback(() => {
    clearShareableState()
    setIsBrowsingFavorites(false)
    startFlipTo({ kind: 'setup' })
  }, [clearShareableState, startFlipTo])

  const onBrowseFavorites = useCallback(() => {
    if (favorites.length === 0) {
      return
    }
    setIsBrowsingFavorites(true)
    setFavoritesIndex(0)
    startFlipTo({ kind: 'puzzle', puzzle: restoreFromFavorite(favorites[0]!) })
  }, [favorites, restoreFromFavorite, startFlipTo])

  const onFavoritesPrev = useCallback(() => {
    const nextIndex = favoritesIndex - 1
    if (nextIndex < 0 || nextIndex >= favorites.length) {
      return
    }
    setFavoritesIndex(nextIndex)
    startFlipTo({ kind: 'puzzle', puzzle: restoreFromFavorite(favorites[nextIndex]!) })
  }, [favoritesIndex, favorites, restoreFromFavorite, startFlipTo])

  const onFavoritesNext = useCallback(() => {
    const nextIndex = favoritesIndex + 1
    if (nextIndex >= favorites.length) {
      return
    }
    setFavoritesIndex(nextIndex)
    startFlipTo({ kind: 'puzzle', puzzle: restoreFromFavorite(favorites[nextIndex]!) })
  }, [favoritesIndex, favorites, restoreFromFavorite, startFlipTo])

  // When browsing favorites and the current card is removed, navigate to adjacent or exit.
  const onToggleCurrentFavorite = useCallback(() => {
    const visibleFace = showBack ? backFace : frontFace
    if (visibleFace.kind !== 'puzzle') {
      return
    }
    const puzzleToToggle = visibleFace.puzzle

    // Capture favorite state BEFORE toggling so we can react to removal correctly.
    const wasFavorited = isFavorited(puzzleToToggle.id)
    toggleFavorite(puzzleToToggle)

    if (!isBrowsingFavorites || !wasFavorited) {
      return
    }

    // Card was just removed from favorites while browsing. Adjust navigation.
    // `favorites` is the pre-toggle list, so filtering out the removed card gives us
    // the expected post-toggle list without waiting for a state re-render.
    const listAfterRemoval = favorites.filter((c) => c.id !== puzzleToToggle.id)
    if (listAfterRemoval.length === 0) {
      // No more favorites — exit browsing mode.
      setIsBrowsingFavorites(false)
      startFlipTo({ kind: 'setup' })
      return
    }
    const nextIndex = Math.min(favoritesIndex, listAfterRemoval.length - 1)
    setFavoritesIndex(nextIndex)
    startFlipTo({ kind: 'puzzle', puzzle: restoreFromFavorite(listAfterRemoval[nextIndex]!) })
  }, [
    showBack,
    backFace,
    frontFace,
    isBrowsingFavorites,
    toggleFavorite,
    isFavorited,
    favorites,
    favoritesIndex,
    startFlipTo,
    restoreFromFavorite,
  ])

  const cardAngle = showBack ? 180 : 0
  const visibleFace = showBack ? backFace : frontFace
  const showBackButton = visibleFace.kind === 'puzzle'
  const ariaLabel = visibleFace.kind === 'puzzle'
    ? visibleFace.puzzle.name
    : 'Generator setup card'

  const visiblePuzzleId = visibleFace.kind === 'puzzle' ? visibleFace.puzzle.id : null
  const isCurrentFavorited = visiblePuzzleId ? isFavorited(visiblePuzzleId) : false

  // Keep favoritesIndex in bounds if the list shrank (e.g. from another tab).
  const clampedFavoritesIndex = favorites.length > 0
    ? Math.min(favoritesIndex, favorites.length - 1)
    : 0

  useEffect(() => {
    onBackAvailabilityChange(showBackButton, onBack)
  }, [onBackAvailabilityChange, onBack, showBackButton])

  const faceProps = {
    setCount,
    onSetChange,
    favoritesCount: favorites.length,
    onBrowseFavorites,
    isFavorited: isCurrentFavorited,
    onToggleFavorite: onToggleCurrentFavorite,
  }

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
              <Face content={frontFace} {...faceProps} />
            </div>

            <div className="flip-face flip-back">
              <Face content={backFace} {...faceProps} />
            </div>
          </article>
        </div>

        {isBrowsingFavorites && favorites.length > 0 ? (
          <div className="favorites-nav">
            <button
              type="button"
              className="favorites-nav-btn"
              onClick={onFavoritesPrev}
              disabled={clampedFavoritesIndex === 0}
              aria-label="Previous favorite"
              title="Previous"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
              </svg>
            </button>
            <span className="favorites-nav-count">
              {clampedFavoritesIndex + 1} / {favorites.length}
            </span>
            <button
              type="button"
              className="favorites-nav-btn"
              onClick={onFavoritesNext}
              disabled={clampedFavoritesIndex === favorites.length - 1}
              aria-label="Next favorite"
              title="Next"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" className="generate-floating" onClick={onGenerate}>
            Generate Card
          </button>
        )}
      </section>
    </main>
  )
}