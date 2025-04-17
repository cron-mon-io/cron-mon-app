export type BasicAlertConfig = {
  name: string
  active: boolean
  on_late: boolean
  on_error: boolean
  type: SlackAlertType
}

export type AlertConfigIdentity = BasicAlertConfig & {
  alert_config_id: string
}

export type AlertConfigSummary = AlertConfigIdentity & {
  monitors: number
}

export type AlertConfig = AlertConfigIdentity & {
  monitors: Array<{
    monitor_id: string
    name: string
  }>
}

export type SlackAlertType = {
  slack: {
    token: string
    channel: string
  }
}
