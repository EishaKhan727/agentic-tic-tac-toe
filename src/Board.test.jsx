import { render, screen, fireEvent } from '@testing-library/react'
import Board from './Board.jsx'

function getSquares() {
  return screen.getAllByRole('button', { name: /^square \d/i })
}

describe('Board', () => {
  it('renders 9 empty cells', () => {
    render(<Board />)
    const squares = getSquares()
    expect(squares).toHaveLength(9)
    squares.forEach((square) => expect(square).toHaveTextContent(''))
  })

  it('shows X as the first player', () => {
    render(<Board />)
    expect(screen.getByRole('status')).toHaveTextContent('Next player: X')
  })

  it('places X on an empty square and toggles the turn to O', () => {
    render(<Board />)
    fireEvent.click(getSquares()[0])

    expect(getSquares()[0]).toHaveTextContent('X')
    expect(screen.getByRole('status')).toHaveTextContent('Next player: O')
  })

  it('alternates between X and O on subsequent moves', () => {
    render(<Board />)
    fireEvent.click(getSquares()[0])
    fireEvent.click(getSquares()[4])

    expect(getSquares()[0]).toHaveTextContent('X')
    expect(getSquares()[4]).toHaveTextContent('O')
    expect(screen.getByRole('status')).toHaveTextContent('Next player: X')
  })

  it('does nothing when clicking an already occupied square', () => {
    render(<Board />)
    fireEvent.click(getSquares()[0])
    fireEvent.click(getSquares()[0])

    expect(getSquares()[0]).toHaveTextContent('X')
    expect(screen.getByRole('status')).toHaveTextContent('Next player: O')
    expect(getSquares().filter((s) => s.textContent !== '')).toHaveLength(1)
  })

  it('detects a horizontal win', () => {
    render(<Board />)
    const squares = getSquares()
    // X: 0,1,2 (top row) / O: 3,4
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[3]) // O
    fireEvent.click(squares[1]) // X
    fireEvent.click(squares[4]) // O
    fireEvent.click(squares[2]) // X wins top row

    expect(screen.getByRole('status')).toHaveTextContent('Winner: X')
  })

  it('detects a vertical win', () => {
    render(<Board />)
    const squares = getSquares()
    // X: 0,3,6 (left column) / O: 1,2
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[1]) // O
    fireEvent.click(squares[3]) // X
    fireEvent.click(squares[2]) // O
    fireEvent.click(squares[6]) // X wins left column

    expect(screen.getByRole('status')).toHaveTextContent('Winner: X')
  })

  it('detects a diagonal win', () => {
    render(<Board />)
    const squares = getSquares()
    // X: 0,4,8 (main diagonal) / O: 1,2
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[1]) // O
    fireEvent.click(squares[4]) // X
    fireEvent.click(squares[2]) // O
    fireEvent.click(squares[8]) // X wins diagonal

    expect(screen.getByRole('status')).toHaveTextContent('Winner: X')
  })

  it('detects the anti-diagonal win', () => {
    render(<Board />)
    const squares = getSquares()
    // X: 2,4,6 (anti-diagonal) / O: 0,1
    fireEvent.click(squares[2]) // X
    fireEvent.click(squares[0]) // O
    fireEvent.click(squares[4]) // X
    fireEvent.click(squares[1]) // O
    fireEvent.click(squares[6]) // X wins anti-diagonal

    expect(screen.getByRole('status')).toHaveTextContent('Winner: X')
  })

  it('detects a win for O', () => {
    render(<Board />)
    const squares = getSquares()
    // X: 0,1,8 / O: 3,4,5 (middle row)
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[3]) // O
    fireEvent.click(squares[1]) // X
    fireEvent.click(squares[4]) // O
    fireEvent.click(squares[8]) // X
    fireEvent.click(squares[5]) // O wins middle row

    expect(screen.getByRole('status')).toHaveTextContent('Winner: O')
  })

  it('locks the board once a winner is decided', () => {
    render(<Board />)
    const squares = getSquares()
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[3]) // O
    fireEvent.click(squares[1]) // X
    fireEvent.click(squares[4]) // O
    fireEvent.click(squares[2]) // X wins top row

    // Attempt to click an empty square after the game is won
    fireEvent.click(squares[5])

    expect(squares[5]).toHaveTextContent('')
    squares.forEach((square) => expect(square).toBeDisabled())
    expect(screen.getByRole('status')).toHaveTextContent('Winner: X')
  })

  it('detects a draw when all 9 cells are filled with no winner', () => {
    render(<Board />)
    const squares = getSquares()
    // Final board (no winner):
    // X O X
    // X O O
    // O X X
    const moveOrder = [0, 1, 2, 4, 3, 5, 7, 6, 8]
    moveOrder.forEach((index) => fireEvent.click(squares[index]))

    expect(screen.getByRole('status')).toHaveTextContent('Game ended in a Draw!')
    squares.forEach((square) => expect(square).toBeDisabled())
  })

  it('restores the board to its blank initial state when reset is clicked', () => {
    render(<Board />)
    const squares = getSquares()
    fireEvent.click(squares[0]) // X
    fireEvent.click(squares[3]) // O
    fireEvent.click(squares[1]) // X
    fireEvent.click(squares[4]) // O
    fireEvent.click(squares[2]) // X wins top row

    fireEvent.click(screen.getByRole('button', { name: /reset game/i }))

    const resetSquares = getSquares()
    resetSquares.forEach((square) => {
      expect(square).toHaveTextContent('')
      expect(square).not.toBeDisabled()
    })
    expect(screen.getByRole('status')).toHaveTextContent('Next player: X')
  })
})
