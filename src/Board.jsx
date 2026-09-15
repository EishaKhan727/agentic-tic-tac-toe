import { useState } from 'react'

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function calculateWinner(squares) {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

export default function Board() {
  const [squares, setSquares] = useState(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)

  const currentPlayer = xIsNext ? 'X' : 'O'
  const winner = calculateWinner(squares)
  const isDraw = !winner && squares.every((value) => value !== null)
  const isGameOver = Boolean(winner) || isDraw

  function handleClick(index) {
    if (squares[index] || isGameOver) return

    const nextSquares = squares.slice()
    nextSquares[index] = currentPlayer
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  function handleReset() {
    setSquares(Array(9).fill(null))
    setXIsNext(true)
  }

  let status
  if (winner) {
    status = `Winner: ${winner}`
  } else if (isDraw) {
    status = 'Game ended in a Draw!'
  } else {
    status = `Next player: ${currentPlayer}`
  }

  return (
    <div className="game">
      <div className="status" role="status">
        {status}
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
            disabled={isGameOver}
          >
            {value}
          </button>
        ))}
      </div>
      <button type="button" className="reset" onClick={handleReset}>
        Reset Game
      </button>
    </div>
  )
}
