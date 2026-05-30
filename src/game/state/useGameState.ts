import { useMemo, useState } from 'react'
import { createSeedToken } from '../engine/seeding'
import { localPuzzleProvider } from '../providers/puzzleProvider'

const DEFAULT_SET_COUNT = 1
const BASE_BOARD_WIDTH = 18
const BASE_BOARD_HEIGHT = 20
const GROWTH_RATE_PER_SET = 6

function getBoardSize(setCount: number) {
  const growth = Math.max(0, setCount - 1)
  return {
    boardWidth: BASE_BOARD_WIDTH + growth * GROWTH_RATE_PER_SET,
    maxHeight: BASE_BOARD_HEIGHT + growth * GROWTH_RATE_PER_SET,
  }
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search)
  const seed = params.get('seed') || createSeedToken()
  const setCount = Math.max(1, Math.min(4, Number(params.get('sets') || DEFAULT_SET_COUNT)))

  return { seed, setCount }
}

function writeUrlState(seed: string, setCount: number) {
  const params = new URLSearchParams(window.location.search)
  params.set('seed', seed)
  params.set('sets', String(setCount))
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
}

export function useGameState() {
  const initial = readUrlState()
  const [seed, setSeed] = useState(initial.seed)
  const [setCount, setSetCount] = useState(initial.setCount)
  const board = useMemo(() => getBoardSize(setCount), [setCount])
  const puzzle = useMemo(
    () =>
      localPuzzleProvider.generate({
        seed,
        setCount,
        boardWidth: board.boardWidth,
        maxHeight: board.maxHeight,
      }),
    [seed, setCount, board],
  )
  const validation = useMemo(
    () => localPuzzleProvider.validate(puzzle),
    [puzzle],
  )

  const setShareableSeed = (nextSeed: string) => {
    writeUrlState(nextSeed, setCount)
    setSeed(nextSeed)
  }

  const setShareableSetCount = (nextSetCount: number) => {
    writeUrlState(seed, nextSetCount)
    setSetCount(nextSetCount)
  }

  const regenerate = () => {
    const nextSeed = createSeedToken()
    writeUrlState(nextSeed, setCount)
    setSeed(nextSeed)
  }

  return {
    seed,
    setSeed: setShareableSeed,
    setCount,
    setSetCount: setShareableSetCount,
    puzzle,
    validation,
    totalBlocks: puzzle.blocks.length,
    interestingness: puzzle.interestingness ?? 0,
    stabilityMargin: validation.stabilityMargin,
    regenerate,
  }
}