import type { PlacedBlock } from '../types'

export const FAVORITES_STORAGE_KEY = 'mini-uzzle:favorites'
export const DEFAULT_LIST_ID = 'default'
const DEFAULT_LIST_NAME = 'Favorites'

export interface FavoriteCard {
  id: string
  name: string
  seed: string
  setCount: number
  boardWidth: number
  maxHeight: number
  savedAt: number
  blocks: PlacedBlock[]
}

export interface FavoritesList {
  id: string
  name: string
  cards: FavoriteCard[]
}

export interface FavoritesStore {
  version: 1
  lists: Record<string, FavoritesList>
}

type ReadStorage = Pick<Storage, 'getItem'>
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>

function emptyStore(): FavoritesStore {
  return {
    version: 1,
    lists: {
      [DEFAULT_LIST_ID]: {
        id: DEFAULT_LIST_ID,
        name: DEFAULT_LIST_NAME,
        cards: [],
      },
    },
  }
}

function readStore(storage: ReadStorage): FavoritesStore {
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) {
      return emptyStore()
    }
    const parsed = JSON.parse(raw) as FavoritesStore
    if (parsed?.version !== 1 || typeof parsed.lists !== 'object') {
      return emptyStore()
    }
    return parsed
  } catch {
    return emptyStore()
  }
}

function writeStore(storage: WriteStorage, store: FavoritesStore): void {
  storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(store))
}

export function getList(storage: ReadStorage, listId: string = DEFAULT_LIST_ID): FavoritesList {
  const store = readStore(storage)
  return store.lists[listId] ?? emptyStore().lists[DEFAULT_LIST_ID]!
}

export function addFavorite(
  storage: WriteStorage,
  card: Omit<FavoriteCard, 'savedAt'>,
  listId: string = DEFAULT_LIST_ID,
): void {
  const store = readStore(storage)
  const list: FavoritesList = store.lists[listId] ?? {
    id: listId,
    name: listId === DEFAULT_LIST_ID ? DEFAULT_LIST_NAME : listId,
    cards: [],
  }
  if (!list.cards.some((c) => c.id === card.id)) {
    list.cards.push({ ...card, savedAt: Date.now() })
    store.lists[listId] = list
    writeStore(storage, store)
  }
}

export function removeFavorite(
  storage: WriteStorage,
  cardId: string,
  listId: string = DEFAULT_LIST_ID,
): void {
  const store = readStore(storage)
  const list = store.lists[listId]
  if (!list) {
    return
  }
  list.cards = list.cards.filter((c) => c.id !== cardId)
  writeStore(storage, store)
}

export function isFavorited(
  storage: ReadStorage,
  cardId: string,
  listId: string = DEFAULT_LIST_ID,
): boolean {
  return getList(storage, listId).cards.some((c) => c.id === cardId)
}
