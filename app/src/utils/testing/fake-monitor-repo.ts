import { v4 as uuidv4 } from 'uuid'

import type { MonitorSummary, MonitorIdentity, Monitor, MonitorInformation } from '@/models/monitor'
import type { Job } from '@/models/job'
import type { MonitorRepoInterface } from '@/repos/monitor-repo'

type MonitorData = Monitor & MonitorInformation

export class FakeMonitorRepository implements MonitorRepoInterface {
  private data: Record<string, MonitorData> = {}
  private errors: Array<string> = []

  constructor(data: Array<MonitorData> = [], errors: Array<string> = []) {
    this.data = Object.fromEntries(data.map((monitor) => [monitor.monitor_id, monitor]))
    this.errors = errors
  }

  async getMonitorInfos(): Promise<Array<MonitorInformation>> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

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
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    const monitor = this.data[monitorId]
    return monitor !== undefined
      ? Promise.resolve({
          monitor_id: monitor.monitor_id,
          name: monitor.name,
          expected_duration: monitor.expected_duration,
          grace_duration: monitor.grace_duration,
          jobs: monitor.jobs
        })
      : Promise.reject(new Error(`Failed to find monitor with id '${monitorId}'`))
  }

  async addMonitor(monitor: MonitorSummary): Promise<Monitor> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

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
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

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
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    delete this.data[monitor.monitor_id]
    return Promise.resolve()
  }

  // Not part of the interface, but required for testing.
  addJob(monitorId: string, job: Job) {
    const monitor = this.data[monitorId]
    monitor.jobs.push(job)
  }
  addError(error: string) {
    this.errors.push(error)
  }
}
