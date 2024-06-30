import { describe, expect, it } from 'vitest'

import { AppError } from '../error'

describe('AppError', () => {
  it('with default required parameters', () => {
    const error = new AppError('test')
    expect(error.message).toBe('test')
    expect(error.statusCode).toBeUndefined()
    expect(error.name).toBe('AppError')
  })

  it('with all parameters', () => {
    const error = new AppError('test', 400)
    expect(error.message).toBe('test')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('AppError')
  })
})
