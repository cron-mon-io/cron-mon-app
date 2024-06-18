import { v4 as uuidv4 } from 'uuid'

import type { MonitorSummary, MonitorIdentity, Monitor, MonitorInformation } from '@/models/monitor'
import type { Job } from '@/models/job'
import type { MonitorRepoInterface } from '@/repos/monitor-repo'

type MonitorData = Monitor & MonitorInformation

export class FakeMonitorRepository implements MonitorRepoInterface {
  private data: Record<string, MonitorData> = {}

  constructor(data: Array<MonitorData> = []) {
    this.data = Object.fromEntries(data.map((monitor) => [monitor.monitor_id, monitor]))
  }

  async getMonitorInfos(): Promise<Array<MonitorInformation>> {
    return Promise.resolve(
      Object.entries(this.data).map(([_key, monitor]) => ({
        monitor_id: monitor.monitor_id,
        name: monitor.name,
        expected_duration: monitor.expected_duration,
        grace_duration: monitor.grace_duration,
        last_finished_job: monitor.last_finished_job,
        last_started_job: monitor.last_started_job
      }))
    )
  }

  async getMonitor(monitorId: string): Promise<Monitor> {
    const monitor = this.data[monitorId]
    return Promise.resolve(
      monitor !== undefined
        ? {
            monitor_id: monitor.monitor_id,
            name: monitor.name,
            expected_duration: monitor.expected_duration,
            grace_duration: monitor.grace_duration,
            jobs: monitor.jobs
          }
        : (undefined as unknown as Monitor) // TODO: Remove this hack once we have proper error handling
    )
  }

  async addMonitor(monitor: MonitorSummary): Promise<Monitor> {
    const fullMonitor = {
      ...monitor,
      monitor_id: uuidv4(),
      last_started_job: null,
      last_finished_job: null,
      jobs: []
    }
    this.data[fullMonitor.monitor_id] = fullMonitor
    return Promise.resolve({
      monitor_id: fullMonitor.monitor_id,
      name: fullMonitor.name,
      expected_duration: fullMonitor.expected_duration,
      grace_duration: fullMonitor.grace_duration,
      jobs: fullMonitor.jobs
    })
  }

  async updateMonitor(monitor: MonitorIdentity): Promise<Monitor> {
    const fullMonitor = this.data[monitor.monitor_id]
    fullMonitor.name = monitor.name
    fullMonitor.expected_duration = monitor.expected_duration
    fullMonitor.grace_duration = monitor.grace_duration

    return Promise.resolve({
      monitor_id: fullMonitor.monitor_id,
      name: fullMonitor.name,
      expected_duration: fullMonitor.expected_duration,
      grace_duration: fullMonitor.grace_duration,
      jobs: fullMonitor.jobs
    })
  }

  async deleteMonitor(monitor: MonitorIdentity): Promise<void> {
    delete this.data[monitor.monitor_id]
    return Promise.resolve()
  }

  // Not part of the interface, but required for testing.
  addJob(monitorId: string, job: Job) {
    const monitor = this.data[monitorId]
    monitor.jobs.push(job)
  }
}
