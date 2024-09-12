import type { MonitorSummary, MonitorIdentity, Monitor, MonitorInformation } from '@/types/monitor'

export interface MonitorRepoInterface {
  getMonitorInfos(): Promise<Array<MonitorInformation>>
  getMonitor(monitorId: string): Promise<Monitor>
  addMonitor(monitor: MonitorSummary): Promise<Monitor>
  updateMonitor(monitor: MonitorIdentity): Promise<Monitor>
  deleteMonitor(monitor: MonitorIdentity): Promise<void>
}

type ApiResponse = {
  data: any
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

export class MonitorRepository implements MonitorRepoInterface {
  // TODO: Put API URL in env.
  private readonly baseUrl = 'http://127.0.0.1:8000'
  private readonly getAuthToken: () => string

  constructor(getAuthToken: () => string) {
    this.getAuthToken = getAuthToken
  }

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

  private async sendRequest(
    route: string,
    method: string,
    body: Record<string, any> | undefined = undefined
  ): Promise<ApiResponse | undefined> {
    const opts: Record<string, any> = {
      method: method,
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`
      }
    }
    if (body !== undefined) {
      opts.headers.Accept = 'application/json'
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(body)
    }

    let response: Response | null = null
    try {
      response = await fetch(this.baseUrl + route, opts)
    } catch (e) {
      console.error('Failed to connect to the CronMon API:', e)
      throw new Error('Failed to connect to the CronMon API.')
    }

    if (response.ok) {
      const length = Number(response.headers.get('Content-Length'))
      return length > 0 ? await response.json() : undefined
    } else {
      // We always want the JSON out of errors to get the description.
      const json = await response.json()
      throw new Error(json.error.description)
    }
  }
}
