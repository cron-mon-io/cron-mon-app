import type { MonitorSummary, MonitorIdentity, Monitor, MonitorInformation } from '@/models/monitor'

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

export class MonitorRepository implements MonitorRepoInterface {
  async getMonitorInfos(): Promise<Array<MonitorInformation>> {
    // TODO: Put API URL in env.
    type MonitorList = {
      data: Array<MonitorInformation>
      paging: {
        total: number
      }
    }
    const resp: MonitorList = await (await fetch('http://127.0.0.1:8000/api/v1/monitors')).json()
    return resp.data
  }

  async getMonitor(monitorId: string): Promise<Monitor> {
    // TODO: Put API URL in env.
    const resp: MonitorResp = await (
      await fetch(`http://127.0.0.1:8000/api/v1/monitors/${monitorId}`)
    ).json()
    return resp.data
  }

  async addMonitor(monitor: MonitorSummary): Promise<Monitor> {
    return await this.postMonitorInfo('http://127.0.0.1:8000/api/v1/monitors', 'POST', monitor)
  }

  async updateMonitor(monitor: MonitorIdentity): Promise<Monitor> {
    return await this.postMonitorInfo(
      `http://127.0.0.1:8000/api/v1/monitors/${monitor.monitor_id}`,
      'PATCH',
      monitor
    )
  }

  async deleteMonitor(monitor: MonitorIdentity): Promise<void> {
    await fetch(`http://127.0.0.1:8000/api/v1/monitors/${monitor.monitor_id}`, { method: 'DELETE' })
  }

  private async postMonitorInfo(
    url: string,
    method: string,
    monitor: MonitorSummary
  ): Promise<Monitor> {
    const rawResp = await fetch(url, {
      method: method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: monitor.name,
        expected_duration: monitor.expected_duration,
        grace_duration: monitor.grace_duration
      })
    })
    const resp: MonitorResp = await rawResp.json()

    return resp.data
  }
}
