import { describe, it, expect } from 'vitest'

import { formatDuration, durationFromString } from '../time'

describe('formatDuration', () => {
  it.each([
    { seconds: 0, expected: '00:00:00' },
    { seconds: 1, expected: '00:00:01' },
    { seconds: 59, expected: '00:00:59' },
    { seconds: 60, expected: '00:01:00' },
    { seconds: 61, expected: '00:01:01' },
    { seconds: 3599, expected: '00:59:59' },
    { seconds: 3600, expected: '01:00:00' },
    { seconds: 3601, expected: '01:00:01' },
    { seconds: 3661, expected: '01:01:01' },
    { seconds: 86399, expected: '23:59:59' }
  ])('formatDuration($seconds) == $expected', ({ seconds, expected }) => {
    expect(formatDuration(seconds)).toBe(expected)
  })

  it('formatDuration(-1) throws an error', () => {
    expect(() => formatDuration(-1)).toThrow('Invalid duration')
  })
})

describe('durationFromString', () => {
  it.each([
    { duration: '00', expected: 0 },
    { duration: '00:00', expected: 0 },
    { duration: '00:00:00', expected: 0 },
    { duration: '01', expected: 1 },
    { duration: '00:00:01', expected: 1 },
    { duration: '00:00:59', expected: 59 },
    { duration: '01:00', expected: 60 },
    { duration: '00:01:00', expected: 60 },
    { duration: '00:01:01', expected: 61 },
    { duration: '00:59:59', expected: 3599 },
    { duration: '01:00:00', expected: 3600 },
    { duration: '01:00:01', expected: 3601 },
    { duration: '01:01:01', expected: 3661 },
    { duration: '23:59:59', expected: 86399 }
  ])('durationFromString($duration) == $expected', ({ duration, expected }) => {
    expect(durationFromString(duration)).toBe(expected)
  })

  it.each([
    { duration: '00:00:00:00', expected: 'Invalid duration' },
    { duration: '-1', expected: 'Invalid seconds' },
    { duration: '60', expected: 'Invalid seconds' },
    { duration: '-1:00', expected: 'Invalid minutes' },
    { duration: '60:00', expected: 'Invalid minutes' },
    { duration: '-1:00:00', expected: 'Invalid hours' },
    { duration: '60:00:00', expected: 'Invalid hours' },
    { duration: 'abc', expected: 'Invalid seconds' },
    { duration: 'abc:00', expected: 'Invalid minutes' },
    { duration: 'abc:00:00', expected: 'Invalid hours' }
  ])('durationFromString($duration) throws an error', ({ duration, expected }) => {
    expect(() => durationFromString(duration)).toThrow(expected)
  })
})
