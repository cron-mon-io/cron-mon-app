export type AlertConfigSummary = {
  name: string
  active: boolean
  on_late: boolean
  on_error: boolean
  type: SlackAlertType
}

export type AlertConfigIdentity = AlertConfigSummary & {
  alert_config_id: string
}

export type AlertConfig = AlertConfigIdentity & {
  monitors: Array<{
    monitor_id: string
    name: string
  }>
}

export type SlackAlertType = {
  Slack: {
    token: string
    channel: string
  }
}
