import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFavorites } from '../game/favorites/useFavorites'
import { useGameState } from '../game/state/useGameState'
import type { FavoriteCard } from '../game/favorites/useFavorites'
import { BLOCK_HALF_UNIT } from '../game/types'

const CARD_SIZE = 420
const CARD_PADDING = 24
const CARD_PADDING_RATIO = CARD_PADDING / CARD_SIZE
const FLIP_MS = 560
const FAVORITE_UI_AUTOHIDE_MS = 2800
type Puzzle = ReturnType<typeof useGameState>['puzzle']
type FaceContent =
  | { kind: 'setup' }
  | { kind: 'puzzle'; puzzle: Puzzle }
type FlipDirection = 'forward' | 'backward'
type PendingFlip = { target: FaceContent; direction: FlipDirection }

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
  showFavoriteButton,
  onCanvasTap,
}: {
  puzzle: Puzzle
  isFavorited: boolean
  onToggleFavorite: () => void
  showFavoriteButton: boolean
  onCanvasTap: () => void
}) {
  const layout = useMemo(() => cardLayout(puzzle.blocks), [puzzle.blocks])

  return (
    <div className="pattern-canvas" onClick={onCanvasTap}>
      <button
        type="button"
        className={`favorite-btn${isFavorited ? ' favorite-btn--active' : ''}${showFavoriteButton ? ' favorite-btn--revealed' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          onToggleFavorite()
        }}
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
  showFavoriteButton,
  onPatternTap,
}: {
  content: FaceContent
  setCount: number
  onSetChange: (value: number) => void
  favoritesCount: number
  onBrowseFavorites: () => void
  isFavorited: boolean
  onToggleFavorite: () => void
  showFavoriteButton: boolean
  onPatternTap: () => void
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
      showFavoriteButton={showFavoriteButton}
      onCanvasTap={onPatternTap}
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
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<FavoriteCard[]>([])
  const [favoritesIndex, setFavoritesIndex] = useState(0)
  const [isTouchRevealMode, setIsTouchRevealMode] = useState(false)
  const [showFavoriteButton, setShowFavoriteButton] = useState(false)

  const [frontFace, setFrontFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'puzzle', puzzle } : { kind: 'setup' },
  )
  const [backFace, setBackFace] = useState<FaceContent>(() =>
    initialHasSeed ? { kind: 'setup' } : { kind: 'puzzle', puzzle },
  )
  const [showBack, setShowBack] = useState(false)
  const [rotationY, setRotationY] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const settleTimerRef = useRef<number | null>(null)
  const favoriteUiTimerRef = useRef<number | null>(null)
  const pendingFlipRef = useRef<PendingFlip | null>(null)
  const showBackRef = useRef(showBack)

  useEffect(() => {
    showBackRef.current = showBack
  }, [showBack])

  useEffect(() => {
    const media = window.matchMedia('(hover: none), (pointer: coarse)')
    const syncMode = () => {
      const isTouch = media.matches
      setIsTouchRevealMode(isTouch)
      setShowFavoriteButton((visible) => (isTouch ? visible : false))
    }

    syncMode()
    media.addEventListener('change', syncMode)
    return () => {
      media.removeEventListener('change', syncMode)
    }
  }, [])

  const stopFavoriteUiTimer = useCallback(() => {
    if (favoriteUiTimerRef.current !== null) {
      window.clearTimeout(favoriteUiTimerRef.current)
      favoriteUiTimerRef.current = null
    }
  }, [])

  const scheduleFavoriteUiAutohide = useCallback(() => {
    if (!isTouchRevealMode) {
      return
    }
    stopFavoriteUiTimer()
    favoriteUiTimerRef.current = window.setTimeout(() => {
      setShowFavoriteButton(false)
      favoriteUiTimerRef.current = null
    }, FAVORITE_UI_AUTOHIDE_MS)
  }, [isTouchRevealMode, stopFavoriteUiTimer])

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current)
      }
      if (favoriteUiTimerRef.current !== null) {
        window.clearTimeout(favoriteUiTimerRef.current)
      }
    }
  }, [])

  const onSetChange = useCallback((value: number) => {
    setSetCount(value)
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }

    pendingFlipRef.current = null
    stopFavoriteUiTimer()
    setShowFavoriteButton(false)
    setShowBack(false)
    setRotationY(0)
    setIsFlipping(false)
    setFrontFace({ kind: 'setup' })
    setBackFace({ kind: 'puzzle', puzzle })
    setIsBrowsingFavorites(false)
  }, [puzzle, setSetCount, stopFavoriteUiTimer])

  const startFlipTo = useCallback((target: FaceContent, direction: FlipDirection = 'forward') => {
    if (isFlipping) {
      // Queue the latest target; previous pending (if any) is discarded.
      pendingFlipRef.current = { target, direction }
      return
    }

    setIsFlipping(true)
    pendingFlipRef.current = null

    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current)
    }

    const doFlip = (face: FaceContent, currentShowBack: boolean, currentDirection: FlipDirection) => {
      const nextRotationDelta = currentDirection === 'backward' ? -180 : 180

      const afterFlip = () => {
        settleTimerRef.current = null
        const next = pendingFlipRef.current
        pendingFlipRef.current = null
        if (next !== null) {
          // Start the queued flip immediately after this one settles.
          doFlip(next.target, showBackRef.current, next.direction)
        } else {
          setIsFlipping(false)
        }
      }

      if (currentShowBack) {
        // Back is currently visible, so stage target on front then flip to front.
        setFrontFace(face)
        setShowBack(false)
        setRotationY((value) => value + nextRotationDelta)
        settleTimerRef.current = window.setTimeout(() => {
          setBackFace(face)
          afterFlip()
        }, FLIP_MS)
      } else {
        // Front is currently visible, so stage target on back then flip to back.
        setBackFace(face)
        setShowBack(true)
        setRotationY((value) => value + nextRotationDelta)
        settleTimerRef.current = window.setTimeout(() => {
          setFrontFace(face)
          afterFlip()
        }, FLIP_MS)
      }
    }

    doFlip(target, showBack, direction)
  }, [isFlipping, showBack])

  const onGenerate = useCallback(() => {
    const nextPuzzle = regenerate()
    startFlipTo({ kind: 'puzzle', puzzle: nextPuzzle }, 'forward')
  }, [regenerate, startFlipTo])

  const onBack = useCallback(() => {
    clearShareableState()
    setIsBrowsingFavorites(false)
    setFavoritesSnapshot([])
    stopFavoriteUiTimer()
    setShowFavoriteButton(false)
    startFlipTo({ kind: 'setup' }, 'backward')
  }, [clearShareableState, startFlipTo, stopFavoriteUiTimer])

  const onBrowseFavorites = useCallback(() => {
    if (favorites.length === 0) {
      return
    }
    const snapshot = [...favorites]
    setFavoritesSnapshot(snapshot)
    setIsBrowsingFavorites(true)
    setFavoritesIndex(0)
    startFlipTo({ kind: 'puzzle', puzzle: restoreFromFavorite(snapshot[0]!) }, 'forward')
  }, [favorites, restoreFromFavorite, startFlipTo])

  const activeFavorites = isBrowsingFavorites ? favoritesSnapshot : favorites

  const onFavoritesPrev = useCallback(() => {
    const nextIndex = favoritesIndex - 1
    if (nextIndex < 0 || nextIndex >= activeFavorites.length) {
      return
    }
    setFavoritesIndex(nextIndex)
    startFlipTo(
      { kind: 'puzzle', puzzle: restoreFromFavorite(activeFavorites[nextIndex]!) },
      'backward',
    )
  }, [activeFavorites, favoritesIndex, restoreFromFavorite, startFlipTo])

  const onFavoritesNext = useCallback(() => {
    const nextIndex = favoritesIndex + 1
    if (nextIndex >= activeFavorites.length) {
      return
    }
    setFavoritesIndex(nextIndex)
    startFlipTo(
      { kind: 'puzzle', puzzle: restoreFromFavorite(activeFavorites[nextIndex]!) },
      'forward',
    )
  }, [activeFavorites, favoritesIndex, restoreFromFavorite, startFlipTo])

  // In favorites browsing mode, keep browsing order stable via snapshot even if items are unfavorited.
  const onToggleCurrentFavorite = useCallback(() => {
    const visibleFace = showBack ? backFace : frontFace
    if (visibleFace.kind !== 'puzzle') {
      return
    }
    toggleFavorite(visibleFace.puzzle)
    if (isTouchRevealMode) {
      scheduleFavoriteUiAutohide()
    }
  }, [
    backFace,
    frontFace,
    isTouchRevealMode,
    scheduleFavoriteUiAutohide,
    showBack,
    toggleFavorite,
  ])

  const onPatternTap = useCallback(() => {
    if (!isTouchRevealMode) {
      return
    }

    setShowFavoriteButton((visible) => {
      const nextVisible = !visible
      if (nextVisible) {
        scheduleFavoriteUiAutohide()
      } else {
        stopFavoriteUiTimer()
      }
      return nextVisible
    })
  }, [isTouchRevealMode, scheduleFavoriteUiAutohide, stopFavoriteUiTimer])

  const cardAngle = rotationY
  const visibleFace = showBack ? backFace : frontFace
  const showBackButton = visibleFace.kind === 'puzzle'
  const ariaLabel = visibleFace.kind === 'puzzle'
    ? visibleFace.puzzle.name
    : 'Generator setup card'

  const visiblePuzzleId = visibleFace.kind === 'puzzle' ? visibleFace.puzzle.id : null
  const isCurrentFavorited = visiblePuzzleId ? isFavorited(visiblePuzzleId) : false

  // Keep favoritesIndex in bounds for current browsing list.
  const clampedFavoritesIndex = activeFavorites.length > 0
    ? Math.min(favoritesIndex, activeFavorites.length - 1)
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
    showFavoriteButton,
    onPatternTap,
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

        {isBrowsingFavorites && activeFavorites.length > 0 ? (
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
              {clampedFavoritesIndex + 1} / {activeFavorites.length}
            </span>
            <button
              type="button"
              className="favorites-nav-btn"
              onClick={onFavoritesNext}
              disabled={clampedFavoritesIndex === activeFavorites.length - 1}
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