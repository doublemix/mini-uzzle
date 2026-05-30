import { BLOCK_HALF_UNIT, type PuzzleCard } from '../types'

interface BoardProps {
  puzzle: PuzzleCard
}

export function Board({ puzzle }: BoardProps) {
  const width = puzzle.boardWidth * BLOCK_HALF_UNIT
  const height = puzzle.maxHeight * BLOCK_HALF_UNIT

  return (
    <div className="board-shell">
      <div className="board-stage" style={{ width, height }}>
        <div className="board-grid" />
        {puzzle.blocks.map((block) => (
          <article
            key={block.id}
            className={`block block-${block.color}`}
            style={{
              left: block.x * BLOCK_HALF_UNIT,
              bottom: block.y * BLOCK_HALF_UNIT,
              width: block.width * BLOCK_HALF_UNIT,
              height: block.height * BLOCK_HALF_UNIT,
            }}
          >
            <span>{block.color}</span>
            <small>{block.orientation === 'horizontal' ? '6x2' : '2x6'}</small>
          </article>
        ))}
      </div>
      <div className="board-caption">
        <span>Half-tile lattice</span>
        <span>{puzzle.boardWidth} x {puzzle.maxHeight} units</span>
      </div>
    </div>
  )
}