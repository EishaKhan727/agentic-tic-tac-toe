import { useState } from 'react'

export default function Board() {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)

  const currentPlayer = xIsNext ? 'X' : 'O'

  function handleClick(index) {
    if (squares[index]) return

    const nextSquares = squares.slice()
    nextSquares[index] = currentPlayer
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  return (
    <div className="game">
      <div className="status" role="status">
        Next player: {currentPlayer}
      </div>
      <div
        className="board"
        role="group"
        aria-label="Tic Tac Toe board"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 4rem)',
          gridTemplateRows: 'repeat(3, 4rem)',
          gap: '0.25rem',
        }}
      >
        {squares.map((value, index) => (
          <button
            key={index}
            type="button"
            className="square"
            aria-label={`Square ${index + 1}${value ? `, ${value}` : ''}`}
            onClick={() => handleClick(index)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}
