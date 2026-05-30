interface CardControlsProps {
  seed: string
  setCount: number
  onSeedChange: (seed: string) => void
  onSetCountChange: (setCount: number) => void
  onRegenerate: () => void
}

export function CardControls({
  seed,
  setCount,
  onSeedChange,
  onSetCountChange,
  onRegenerate,
}: CardControlsProps) {
  return (
    <form
      className="controls"
      onSubmit={(event) => {
        event.preventDefault()
        onRegenerate()
      }}
    >
      <label>
        <span>Seed</span>
        <input
          value={seed}
          onChange={(event) => onSeedChange(event.target.value.trim() || 'uzzle')}
          placeholder="Shareable seed"
        />
      </label>
      <label>
        <span>Sets</span>
        <select
          value={setCount}
          onChange={(event) => onSetCountChange(Number(event.target.value))}
        >
          <option value={1}>1 set</option>
          <option value={2}>2 sets</option>
          <option value={3}>3 sets</option>
          <option value={4}>4 sets</option>
        </select>
      </label>
      <button type="submit">Generate new card</button>
    </form>
  )
}