import type { AlertConfig } from '@/types/alert-config'
import { ApiClient } from '@/utils/client'

export interface AlertServiceInterface {
  sendTestAlert(alertConfig: AlertConfig): Promise<void>
}

export class AlertConfigService extends ApiClient implements AlertServiceInterface {
  async sendTestAlert(alertConfig: AlertConfig): Promise<void> {
    await this.sendRequest(`/api/v1/alert-configs/${alertConfig.alert_config_id}/test`, 'POST')
  }
}
