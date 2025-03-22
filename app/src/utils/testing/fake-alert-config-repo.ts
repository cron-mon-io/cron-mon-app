import { v4 as uuidv4 } from 'uuid'

import type { AlertConfigRepoInterface } from '@/repos/alert-config-repo'
import type {
  AlertConfig,
  AlertConfigIdentity,
  AlertConfigSummary,
  BasicAlertConfig
} from '@/types/alert-config'

export class FakeAlertConfigRepo implements AlertConfigRepoInterface {
  private data: Record<string, AlertConfig> = {}
  private errors: Array<string> = []

  constructor(data: Array<AlertConfig> = [], errors: Array<string> = []) {
    this.data = Object.fromEntries(
      data.map((alertConfig) => [alertConfig.alert_config_id, alertConfig])
    )
    this.errors = errors
  }

  async getAlertConfigs(): Promise<Array<AlertConfigSummary>> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    return Promise.resolve(
      Object.entries(this.data).map(([_key, alertConfig]) => ({
        alert_config_id: alertConfig.alert_config_id,
        name: alertConfig.name,
        active: alertConfig.active,
        on_late: alertConfig.on_late,
        on_error: alertConfig.on_error,
        monitors: alertConfig.monitors.length,
        type: alertConfig.type
      }))
    )
  }

  getAlertConfig(alertConfigId: string): Promise<AlertConfig> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    const alertConfig = this.data[alertConfigId]
    return alertConfig !== undefined
      ? Promise.resolve(alertConfig)
      : Promise.reject(new Error(`Failed to find alert config with id '${alertConfigId}'`))
  }

  addAlertConfig(alertConfig: BasicAlertConfig): Promise<AlertConfig> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    const fullAlertConfig = {
      ...alertConfig,
      alert_config_id: uuidv4(),
      monitors: []
    }
    this.data[fullAlertConfig.alert_config_id] = fullAlertConfig
    return Promise.resolve(fullAlertConfig)
  }

  updateAlertConfig(alertConfig: AlertConfigIdentity): Promise<AlertConfig> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    const fullAlertConfig = this.data[alertConfig.alert_config_id]
    fullAlertConfig.name = alertConfig.name
    fullAlertConfig.active = alertConfig.active
    fullAlertConfig.on_late = alertConfig.on_late
    fullAlertConfig.on_error = alertConfig.on_error

    return Promise.resolve(fullAlertConfig)
  }

  deleteAlertConfig(alertConfig: AlertConfig): Promise<void> {
    const error = this.errors.shift()
    if (error !== undefined) {
      return Promise.reject(new Error(error))
    }

    delete this.data[alertConfig.alert_config_id]
    return Promise.resolve()
  }

  // Not part of the interface, but required for testing.
  addError(error: string) {
    this.errors.push(error)
  }
}
