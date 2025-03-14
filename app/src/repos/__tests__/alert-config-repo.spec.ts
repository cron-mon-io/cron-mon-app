import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest'
import { HttpResponse, http } from 'msw'

import { AlertConfigRepository } from '@/repos/alert-config-repo'
import type { AlertConfigSummary } from '@/types/alert-config'

import { setupTestAPI } from '@/utils/testing/test-api'

describe('AlertConfigRepository', () => {
  const server = setupTestAPI('foo-token')

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const repo = new AlertConfigRepository(() => 'foo-token')

  it('getAlertConfigs', async () => {
    const alertConfigs = await repo.getAlertConfigs()
    expect(alertConfigs).toEqual([
      {
        active: true,
        alert_config_id: 'eef240ae-a5b3-4971-b3c3-2603434d1ede',
        monitors: [
          {
            monitor_id: 'cfe88463-5c04-4b43-b10f-1f508963cc5d',
            name: 'foo-backup.sh'
          },
          {
            monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
            name: 'analyse-bar.py'
          }
        ],
        name: 'Slack on late',
        on_error: false,
        on_late: true,
        type: {
          Slack: {
            channel: 'monitoring-alerts',
            token: 'fake-slack-bot-token'
          }
        }
      }
    ])
  })

  it("getAlertConfigs() when there aren't any alert configs", async () => {
    server.use(
      http.get('/api/v1/alert-configs', () => {
        return HttpResponse.json({
          data: [],
          paging: { total: 0 }
        })
      })
    )

    const alertConfigs = await repo.getAlertConfigs()
    expect(alertConfigs.length).toEqual(0)
  })

  it('getAlertConfig', async () => {
    const alertConfig = await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')
    expect(alertConfig).toEqual({
      active: true,
      alert_config_id: 'eef240ae-a5b3-4971-b3c3-2603434d1ede',
      monitors: [
        {
          monitor_id: 'cfe88463-5c04-4b43-b10f-1f508963cc5d',
          name: 'foo-backup.sh'
        },
        {
          monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
          name: 'analyse-bar.py'
        }
      ],
      name: 'Slack on late',
      on_error: false,
      on_late: true,
      type: {
        Slack: {
          channel: 'monitoring-alerts',
          token: 'fake-slack-bot-token'
        }
      }
    })
  })

  it('getAlertConfig() when alert config does not exist', async () => {
    await expect(async () => await repo.getAlertConfig('non-existent-id')).rejects.toThrowError(
      "Failed to find alert config with id 'non-existent-id'"
    )
  })

  it('addMonitor', async () => {
    const newAlertConfig: AlertConfigSummary = {
      name: 'New config',
      active: true,
      on_late: true,
      on_error: true,
      type: {
        Slack: {
          token: 'fake-slack-bot-token',
          channel: 'C1234567890'
        }
      }
    }

    const alertConfig = await repo.addAlertConfig(newAlertConfig)
    expect(alertConfig).toMatchObject({})
    expect(alertConfig).toHaveProperty('alert_config_id')
  })

  it('updateMonitor', async () => {
    const originalAlertConfig = await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')

    const alertConfig = {
      alert_config_id: originalAlertConfig.alert_config_id,
      name: 'new-name.sh',
      active: originalAlertConfig.active,
      on_late: !originalAlertConfig.on_late,
      on_error: !originalAlertConfig.on_error,
      type: originalAlertConfig.type,
      monitors: originalAlertConfig.monitors
    }

    const updatedAlertConfig = await repo.updateAlertConfig(alertConfig)
    expect(updatedAlertConfig).toEqual(alertConfig)
    expect(updatedAlertConfig).not.toEqual(originalAlertConfig)
  })

  it('deleteAlertConfig', async () => {
    const alertConfig = await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')
    await repo.deleteAlertConfig(alertConfig)

    await expect(
      async () => await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')
    ).rejects.toThrowError()
  })
})

describe('AlertConfigRepository when auth token is invalid', () => {
  const server = setupTestAPI('foo-token')

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const repo = new AlertConfigRepository(() => 'invalid-token')

  it('getAlertConfigs', async () => {
    await expect(async () => await repo.getAlertConfigs()).rejects.toThrowError(
      'The request requires user authentication.'
    )
  })

  it('getAlertConfig', async () => {
    await expect(
      async () => await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')
    ).rejects.toThrowError('The request requires user authentication.')
  })

  it('addAlertConfig', async () => {
    await expect(
      async () =>
        await repo.addAlertConfig({
          name: 'New alert config',
          active: true,
          on_late: true,
          on_error: true,
          type: {
            Slack: {
              token: 'fake-slack-bot-token',
              channel: 'C1234567890'
            }
          }
        })
    ).rejects.toThrowError('The request requires user authentication.')
  })

  it('updateAlertConfig', async () => {
    await expect(
      async () =>
        await repo.updateAlertConfig({
          alert_config_id: 'eef240ae-a5b3-4971-b3c3-2603434d1ede',
          name: 'Alert config',
          active: true,
          on_late: true,
          on_error: true,
          type: {
            Slack: {
              token: 'fake-slack-bot-token',
              channel: 'C1234567890'
            }
          }
        })
    ).rejects.toThrowError('The request requires user authentication.')
  })

  it('deleteAlertConfig', async () => {
    await expect(
      async () =>
        await repo.deleteAlertConfig({
          alert_config_id: 'eef240ae-a5b3-4971-b3c3-2603434d1ede',
          name: 'new-name.sh',
          active: true,
          on_late: true,
          on_error: true,
          type: {
            Slack: {
              token: 'fake-slack-bot-token',
              channel: 'C1234567890'
            }
          },
          monitors: []
        })
    ).rejects.toThrowError('The request requires user authentication.')
  })
})

describe('AlertConfigRepository when the API down', () => {
  it('getAlertConfig', async () => {
    const repo = new AlertConfigRepository(() => 'foo-token')
    await expect(
      async () => await repo.getAlertConfig('eef240ae-a5b3-4971-b3c3-2603434d1ede')
    ).rejects.toThrowError('Failed to connect to the CronMon API.')
  })
})
