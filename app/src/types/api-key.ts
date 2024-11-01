export type ApiKey = {
  api_key_id: string
  name: string
  masked: string
  created: string
  last_used: LastUsed | null
}

type LastUsed = {
  time: string
  monitor_id: string
  monitor_name: string
}
