import { useCallback, useState } from 'react'
import type { PuzzleCard } from '../types'
import {
  addFavorite,
  getList,
  isFavorited as isFavoritedInStorage,
  removeFavorite,
  type FavoriteCard,
  type FavoritesList,
} from './favoritesStorage'

export type { FavoriteCard, FavoritesList }

export function useFavorites() {
  const [list, setList] = useState<FavoritesList>(() => getList(localStorage))

  const refresh = useCallback(() => {
    setList(getList(localStorage))
  }, [])

  const isFavorited = useCallback(
    (cardId: string) => list.cards.some((c) => c.id === cardId),
    [list.cards],
  )

  const toggleFavorite = useCallback(
    (puzzle: PuzzleCard) => {
      if (isFavoritedInStorage(localStorage, puzzle.id)) {
        removeFavorite(localStorage, puzzle.id)
      } else {
        addFavorite(localStorage, {
          id: puzzle.id,
          name: puzzle.name,
          seed: puzzle.seed,
          setCount: puzzle.setCount,
          boardWidth: puzzle.boardWidth,
          maxHeight: puzzle.maxHeight,
          blocks: puzzle.blocks,
        })
      }
      refresh()
    },
    [refresh],
  )

  const restoreFromFavorite = useCallback((fav: FavoriteCard): PuzzleCard => {
    return {
      id: fav.id,
      name: fav.name,
      seed: fav.seed,
      setCount: fav.setCount,
      boardWidth: fav.boardWidth,
      maxHeight: fav.maxHeight,
      blocks: fav.blocks,
    }
  }, [])

  return {
    favorites: list.cards,
    isFavorited,
    toggleFavorite,
    restoreFromFavorite,
  }
}
