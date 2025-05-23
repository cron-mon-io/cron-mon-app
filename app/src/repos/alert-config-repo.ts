import type {
  AlertConfig,
  AlertConfigIdentity,
  AlertConfigSummary,
  BasicAlertConfig
} from '@/types/alert-config'
import { ApiClient } from '@/utils/client'

export interface AlertConfigRepoInterface {
  getAlertConfigs(): Promise<Array<AlertConfigSummary>>
  getAlertConfig(alertConfigId: string): Promise<AlertConfig>
  addAlertConfig(alertConfig: BasicAlertConfig): Promise<AlertConfig>
  updateAlertConfig(alertConfig: AlertConfigIdentity): Promise<AlertConfig>
  deleteAlertConfig(alertConfig: AlertConfig): Promise<void>
}

type AlertConfigResp = {
  data: AlertConfig
}

type AlertConfigList = {
  data: Array<AlertConfigSummary>
  paging: {
    total: number
  }
}

export class AlertConfigRepository extends ApiClient implements AlertConfigRepoInterface {
  async getAlertConfigs(): Promise<Array<AlertConfigSummary>> {
    const resp = await this.sendRequest(`/api/v1/alert-configs`, 'GET')
    return (resp as AlertConfigList).data
  }

  async getAlertConfig(alertConfigId: string): Promise<AlertConfig> {
    const resp = await this.sendRequest(`/api/v1/alert-configs/${alertConfigId}`, 'GET')
    return (resp as AlertConfigResp).data
  }

  async addAlertConfig(alertConfig: BasicAlertConfig): Promise<AlertConfig> {
    return await this.postAlertConfigInfo(`/api/v1/alert-configs`, 'POST', alertConfig)
  }

  async updateAlertConfig(alertConfig: AlertConfigIdentity): Promise<AlertConfig> {
    return await this.postAlertConfigInfo(
      `/api/v1/alert-configs/${alertConfig.alert_config_id}`,
      'PATCH',
      alertConfig
    )
  }

  async deleteAlertConfig(alertConfig: AlertConfig): Promise<void> {
    await this.sendRequest(`/api/v1/alert-configs/${alertConfig.alert_config_id}`, 'DELETE')
  }

  private async postAlertConfigInfo(
    route: string,
    method: string,
    alertConfig: BasicAlertConfig
  ): Promise<AlertConfig> {
    const resp = await this.sendRequest(route, method, {
      name: alertConfig.name,
      active: alertConfig.active,
      on_late: alertConfig.on_late,
      on_error: alertConfig.on_error,
      type: alertConfig.type
    })

    return (resp as AlertConfigResp).data
  }
}
