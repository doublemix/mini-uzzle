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
  const urlSeed = params.get('seed')
  const seed = urlSeed || createSeedToken()
  const setCount = Math.max(1, Math.min(4, Number(params.get('sets') || DEFAULT_SET_COUNT)))
  const hasSeedInUrl = Boolean(urlSeed)

  return { seed, setCount, hasSeedInUrl }
}

function replaceUrlParams(params: URLSearchParams) {
  const nextQuery = params.toString()
  const nextUrl = nextQuery
    ? `${window.location.pathname}?${nextQuery}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`
  window.history.replaceState({}, '', nextUrl)
}

function writeUrlState(seed: string, setCount: number) {
  const params = new URLSearchParams(window.location.search)
  params.set('seed', seed)
  params.set('sets', String(setCount))
  replaceUrlParams(params)
}

function clearUrlState() {
  const params = new URLSearchParams(window.location.search)
  params.delete('seed')
  params.delete('sets')
  replaceUrlParams(params)
}

export function useGameState() {
  const initial = readUrlState()
  const [initialHasSeed] = useState(initial.hasSeedInUrl)
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
    const nextPuzzle = localPuzzleProvider.generate({
      seed: nextSeed,
      setCount,
      boardWidth: board.boardWidth,
      maxHeight: board.maxHeight,
    })
    writeUrlState(nextSeed, setCount)
    setSeed(nextSeed)
    return nextPuzzle
  }

  const clearShareableState = () => {
    clearUrlState()
  }

  return {
    initialHasSeed,
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
    clearShareableState,
  }
}