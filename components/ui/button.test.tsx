import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from './button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  const button = screen.getByRole('button', { name: /click me/i })
  expect(button).toBeInTheDocument()
})
