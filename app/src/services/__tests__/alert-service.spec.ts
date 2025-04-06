import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest'
import { HttpResponse, http } from 'msw'

import type { AlertConfig } from '@/types/alert-config'
import { AlertConfigService } from '../alert-service'

import { setupTestAPI } from '@/utils/testing/test-api'

describe('AlertConfigService', () => {
  const server = setupTestAPI('foo-token')

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const service = new AlertConfigService(() => 'foo-token')
  const alertConfig: AlertConfig = {
    // Same alert config ID as utils/testing/test-api.ts
    alert_config_id: 'eef240ae-a5b3-4971-b3c3-2603434d1ede',
    name: 'Test Alert',
    active: true,
    on_late: true,
    on_error: false,
    monitors: [],
    type: {
      Slack: {
        channel: '#alerts',
        token: 'fake-token'
      }
    }
  }

  it('sends a test alert', async () => {
    await service.sendTestAlert(alertConfig)

    await expect(async () => await service.sendTestAlert(alertConfig)).not.toThrowError()
  })

  it('throws when the alert config is not found', async () => {
    server.use(
      http.post('/api/v1/alert-configs/eef240ae-a5b3-4971-b3c3-2603434d1ede/test', () => {
        return HttpResponse.json(
          {
            error: {
              code: 404,
              reason: 'Not Found',
              description: 'The requested resource could not be found.'
            }
          },
          { status: 404 }
        )
      })
    )

    await expect(async () => await service.sendTestAlert(alertConfig)).rejects.toThrowError()
  })

  it('throws when the test alert cannot be sent', async () => {
    server.use(
      http.post('/api/v1/alert-configs/eef240ae-a5b3-4971-b3c3-2603434d1ede/test', () => {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              reason: 'Internal Server Error',
              description: 'An unexpected error occurred.'
            }
          },
          { status: 500 }
        )
      })
    )

    await expect(async () => await service.sendTestAlert(alertConfig)).rejects.toThrowError()
  })
})
