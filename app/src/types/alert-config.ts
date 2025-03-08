export type AlertConfig = {
    alert_config_id: string
    name: string
    active: boolean
    on_late: boolean
    on_error: boolean
    monitors: Array<{
        monitor_id: string
        name: string
    }>
    type: Record<string, SlackAlertType>
}

export type SlackAlertType = {
    token: string
    channel: string
}
