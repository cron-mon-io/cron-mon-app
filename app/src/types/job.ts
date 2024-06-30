export type Job = {
  job_id: string
  start_time: string
  end_time: string | null
  in_progress: boolean
  late: boolean
  duration: number | null
  succeeded: boolean | null
  output: string | null
}
