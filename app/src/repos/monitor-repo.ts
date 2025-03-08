import type { MonitorSummary, MonitorIdentity, Monitor, MonitorInformation } from '@/types/monitor'
import { ApiRepository } from './api-repo'

export interface MonitorRepoInterface {
  getMonitorInfos(): Promise<Array<MonitorInformation>>
  getMonitor(monitorId: string): Promise<Monitor>
  addMonitor(monitor: MonitorSummary): Promise<Monitor>
  updateMonitor(monitor: MonitorIdentity): Promise<Monitor>
  deleteMonitor(monitor: MonitorIdentity): Promise<void>
}

type MonitorResp = {
  data: Monitor
}

type MonitorList = {
  data: Array<MonitorInformation>
  paging: {
    total: number
  }
}

export class MonitorRepository extends ApiRepository implements MonitorRepoInterface {
  async getMonitorInfos(): Promise<Array<MonitorInformation>> {
    const resp = await this.sendRequest(`/api/v1/monitors`, 'GET')
    return (resp as MonitorList).data
  }

  async getMonitor(monitorId: string): Promise<Monitor> {
    const resp = await this.sendRequest(`/api/v1/monitors/${monitorId}`, 'GET')
    return (resp as MonitorResp).data
  }

  async addMonitor(monitor: MonitorSummary): Promise<Monitor> {
    return await this.postMonitorInfo(`/api/v1/monitors`, 'POST', monitor)
  }

  async updateMonitor(monitor: MonitorIdentity): Promise<Monitor> {
    return await this.postMonitorInfo(`/api/v1/monitors/${monitor.monitor_id}`, 'PATCH', monitor)
  }

  async deleteMonitor(monitor: MonitorIdentity): Promise<void> {
    await this.sendRequest(`/api/v1/monitors/${monitor.monitor_id}`, 'DELETE')
  }

  private async postMonitorInfo(
    route: string,
    method: string,
    monitor: MonitorSummary
  ): Promise<Monitor> {
    const resp = await this.sendRequest(route, method, {
      name: monitor.name,
      expected_duration: monitor.expected_duration,
      grace_duration: monitor.grace_duration
    })

    return (resp as MonitorResp).data
  }
}
