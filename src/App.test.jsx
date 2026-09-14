import { render, screen } from '@testing-library/react'
import App from './App.jsx'

describe('App', () => {
  it('renders the game title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeInTheDocument()
  })
})
