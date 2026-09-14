import { render, screen } from '@testing-library/react'
import App from './App.jsx'

describe('App', () => {
  it('renders the game title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeInTheDocument()
  })

  it('renders the board with 9 cells and the turn status', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /^square \d/i })).toHaveLength(9)
    expect(screen.getByRole('status')).toHaveTextContent('Next player: X')
  })
})
