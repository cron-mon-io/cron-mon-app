import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest'
import { HttpResponse, http } from 'msw'

import { ApiKeyRepository } from '@/repos/api-key-repo'
import type { ApiKey } from '@/types/api-key'

import { setupTestAPI } from '@/utils/testing/test-api'

describe('MonitorApiKeyRepositoryRepository', () => {
  const server = setupTestAPI('foo-token')

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const repo = new ApiKeyRepository(() => 'foo-token')

  it('getKeys', async () => {
    const keys = await repo.getKeys()
    expect(keys).toEqual([
      {
        api_key_id: 'f4b3b3b4-0b3b-4b3b-8b3b-2b3b3b3b3b3b',
        name: 'Test Key 1',
        masked: 'test************key1',
        created: '2024-03-31T12:35:00',
        last_used: {
          time: '2024-03-31T12:35:00',
          monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
          monitor_name: 'analyse-bar.py'
        }
      },
      {
        api_key_id: 'f47f4cfc-92b0-4987-bf53-883ea8c6851b',
        name: 'Test Key 2',
        masked: 'test************key2',
        created: '2024-03-30T10:30:00',
        last_used: null
      }
    ])
  })

  it("getKeys() when there aren't any API keys", async () => {
    server.use(
      http.get('/api/v1/keys', () => {
        return HttpResponse.json({
          data: [],
          paging: { total: 0 }
        })
      })
    )

    const keys = await repo.getKeys()
    expect(keys.length).toEqual(0)
  })

  it('revokeKey', async () => {
    const key: ApiKey = {
      api_key_id: 'f47f4cfc-92b0-4987-bf53-883ea8c6851b',
      name: 'Test Key 2',
      masked: 'test************key2',
      created: '2024-03-31T12:35:00',
      last_used: null
    }

    await repo.revokeKey(key)

    const keys = await repo.getKeys()
    expect(keys).toHaveLength(1)
    expect(keys.map((key) => key.api_key_id)).not.toContain(key.api_key_id)
  })

  it('revokeKey() when API key does not exist', async () => {
    const key: ApiKey = {
      api_key_id: 'non-existent-id',
      name: 'Non existent key',
      masked: 'Non ************ t key',
      created: '2024-03-31T12:35:00',
      last_used: null
    }
    await expect(async () => await repo.revokeKey(key)).rejects.toThrowError(
      'The requested resource could not be found.'
    )
  })

  it('generateKey', async () => {
    const generatedKey = await repo.generateKey('Newly generated key')

    // Our mocked API just returns the reverse of the name as the actual key.
    expect(generatedKey).toEqual('yek detareneg ylweN')
  })
})

describe('ApiKeyRepository when auth token is invalid', () => {
  const server = setupTestAPI('foo-token')

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const repo = new ApiKeyRepository(() => 'invalid-token')

  it('getKeys', async () => {
    await expect(async () => await repo.getKeys()).rejects.toThrowError(
      'The request requires user authentication.'
    )
  })

  it('revokeKey', async () => {
    const key: ApiKey = {
      api_key_id: 'f47f4cfc-92b0-4987-bf53-883ea8c6851b',
      name: 'Test Key 2',
      masked: 'test************key2',
      created: '2024-03-31T12:35:00',
      last_used: null
    }

    await expect(async () => await repo.revokeKey(key)).rejects.toThrowError(
      'The request requires user authentication.'
    )
  })

  it('generateKey', async () => {
    await expect(async () => await repo.generateKey('Newly generated key')).rejects.toThrowError(
      'The request requires user authentication.'
    )
  })
})

describe('ApiKeyRepository when the API down', () => {
  it('getKeys', async () => {
    const repo = new ApiKeyRepository(() => 'foo-token')
    await expect(async () => await repo.getKeys()).rejects.toThrowError(
      'Failed to connect to the CronMon API.'
    )
  })
})
