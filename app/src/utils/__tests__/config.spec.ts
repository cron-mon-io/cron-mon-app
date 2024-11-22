import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'

import { getAuthConfig } from '../config'

describe('getAuthConfig', () => {
  const server = setupServer(
    ...[
      http.get('/auth-config', () => {
        return HttpResponse.json({
          url: 'http://localhost:8080',
          realm: 'test',
          client: 'test'
        })
      })
    ]
  )

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  it('works as expected', async () => {
    const config = await getAuthConfig()
    expect(config).toEqual({
      url: 'http://localhost:8080',
      realm: 'test',
      client: 'test'
    })
  })

  it('throws an error when fetch fails', async () => {
    server.use(
      http.get('/auth-config', () => {
        return new HttpResponse(null, { status: 404, statusText: 'Failed to fetch' })
      })
    )

    await expect(getAuthConfig()).rejects.toThrowError('Failed to fetch auth config')
  })

  it('throws an error when response is not JSON', async () => {
    server.use(
      http.get('/auth-config', () => {
        return HttpResponse.text('Not JSON')
      })
    )

    await expect(getAuthConfig()).rejects.toThrowError()
  })

  it('throws an error when response is missing required fields', async () => {
    server.use(
      http.get('/auth-config', () => {
        return HttpResponse.json({})
      })
    )

    await expect(getAuthConfig()).rejects.toThrowError('Invalid auth config')
  })
})
