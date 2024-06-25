import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest'
import { HttpResponse, http } from 'msw'

import type { MonitorSummary } from '@/models/monitor'
import { MonitorRepository } from '@/repos/monitor-repo'

import { setupTestAPI } from '@/utils/testing/test-api'

describe('MonitorRepository', () => {
  const server = setupTestAPI()

  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

  // Close server after all tests
  afterAll(() => server.close())

  // Reset handlers after each test `important for test isolation`
  afterEach(() => server.resetHandlers())

  const repo = new MonitorRepository()

  it('getMonitorInfos', async () => {
    const monitorInfos = await repo.getMonitorInfos()
    expect(monitorInfos).toEqual([
      {
        monitor_id: 'cfe88463-5c04-4b43-b10f-1f508963cc5d',
        name: 'foo-backup.sh',
        expected_duration: 1320,
        grace_duration: 300,
        last_started_job: {
          job_id: 'c72be737-1089-4e10-9da3-0076f4d4123d',
          start_time: '2024-03-31T20:54:00',
          end_time: null,
          succeeded: null,
          output: null,
          duration: null,
          late: false,
          in_progress: true
        },
        last_finished_job: null
      },
      {
        monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
        name: 'analyse-bar.py',
        expected_duration: 21600,
        grace_duration: 1800,
        last_started_job: {
          job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
          start_time: '2024-03-31T12:35:00',
          end_time: '2024-03-31T12:59:00',
          succeeded: true,
          output: null,
          duration: 1440,
          late: false,
          in_progress: false
        },
        last_finished_job: {
          job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
          start_time: '2024-03-31T12:35:00',
          end_time: '2024-03-31T12:59:00',
          succeeded: true,
          output: null,
          duration: 1440,
          late: false,
          in_progress: false
        }
      },
      {
        monitor_id: '96ef2054-715b-4686-a155-a146ae9dec29',
        name: 'analyse-bar.py',
        expected_duration: 21600,
        grace_duration: 1800,
        last_started_job: null,
        last_finished_job: null
      }
    ])
  })

  it("getMonitorInfos() when there aren't any monitors", async () => {
    server.use(
      http.get('http://127.0.0.1:8000/api/v1/monitors', () => {
        return HttpResponse.json({
          data: [],
          paging: { total: 0 }
        })
      })
    )

    const monitorInfos = await repo.getMonitorInfos()
    expect(monitorInfos.length).toEqual(0)
  })

  it('getMonitor', async () => {
    const monitor = await repo.getMonitor('e534a01a-4efe-4b8e-9b04-44a3c76b0462')
    expect(monitor).toEqual({
      monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
      name: 'analyse-bar.py',
      expected_duration: 21600,
      grace_duration: 1800,
      jobs: [
        {
          job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
          start_time: '2024-03-31T12:35:00',
          end_time: '2024-03-31T12:59:00',
          succeeded: true,
          output: null,
          duration: 1440,
          late: false,
          in_progress: false
        },
        {
          job_id: '34061949-1a39-4b37-afd0-324f9bbc7697',
          start_time: '2024-03-30T10:30:00',
          end_time: '2024-03-30T18:55:00',
          succeeded: false,
          output: 'Timed out',
          duration: 30300,
          late: true,
          in_progress: false
        },
        {
          job_id: '68483bae-3206-45f0-a358-1cf9d7c22975',
          start_time: '2024-03-29T10:30:00',
          end_time: '2024-03-29T16:35:00',
          succeeded: false,
          output: 'Timed out',
          duration: 21900,
          late: false,
          in_progress: false
        }
      ]
    })
  })

  it('getMonitor() when monitor does not exist', async () => {
    await expect(async () => await repo.getMonitor('non-existent-id')).rejects.toThrowError(
      "Failed to find monitor with id 'non-existent-id'"
    )
  })

  it('addMonitor', async () => {
    const newMonitor: MonitorSummary = {
      name: 'new-monitor.sh',
      expected_duration: 300,
      grace_duration: 60
    }

    const monitor = await repo.addMonitor(newMonitor)
    expect(monitor).toMatchObject({
      name: 'new-monitor.sh',
      expected_duration: 300,
      grace_duration: 60,
      jobs: []
    })
    expect(monitor).toHaveProperty('monitor_id')
  })

  it('updateMonitor', async () => {
    const originalMonitor = await repo.getMonitor('e534a01a-4efe-4b8e-9b04-44a3c76b0462')

    const monitor = {
      monitor_id: originalMonitor.monitor_id,
      name: 'new-name.sh',
      expected_duration: originalMonitor.expected_duration + 1,
      grace_duration: originalMonitor.grace_duration + 1,
      jobs: originalMonitor.jobs
    }

    const updatedMonitor = await repo.updateMonitor(monitor)
    expect(updatedMonitor).toEqual(monitor)
    expect(updatedMonitor).not.toEqual(originalMonitor)
  })

  it('deleteMonitor', async () => {
    const monitor = await repo.getMonitor('e534a01a-4efe-4b8e-9b04-44a3c76b0462')
    await repo.deleteMonitor(monitor)

    await expect(
      async () => await repo.getMonitor('e534a01a-4efe-4b8e-9b04-44a3c76b0462')
    ).rejects.toThrowError()
  })
})

describe('MonitorRepository when the API down', () => {
  it('getMonitor', async () => {
    const repo = new MonitorRepository()
    await expect(
      async () => await repo.getMonitor('e534a01a-4efe-4b8e-9b04-44a3c76b0462')
    ).rejects.toThrowError('Failed to connect to the CronMon API.')
  })
})
