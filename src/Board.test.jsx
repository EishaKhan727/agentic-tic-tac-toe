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
})
