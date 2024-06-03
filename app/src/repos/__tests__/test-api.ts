import { setupServer } from 'msw/node'
import type { SetupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'

import type { MonitorSummary } from '@/models/monitor'

export function setupTestAPI(): SetupServer {
  const MONITORS = [
    {
      monitor_id: 'cfe88463-5c04-4b43-b10f-1f508963cc5d',
      name: 'foo-backup.sh',
      expected_duration: 1320,
      grace_duration: 300,
      last_started_job: {
        job_id: 'c72be737-1089-4e10-9da3-0076f4d4123d',
        start_time: '2024-03-31T20:54:00',
        end_time: null,
        succeeded: null,
        output: null,
        duration: null,
        late: false,
        in_progress: true
      },
      last_finished_job: null,
      jobs: [
        {
          job_id: 'c72be737-1089-4e10-9da3-0076f4d4123d',
          start_time: '2024-03-31T20:54:00',
          end_time: null,
          succeeded: null,
          output: null,
          duration: null,
          late: false,
          in_progress: true
        }
      ]
    },
    {
      monitor_id: 'e534a01a-4efe-4b8e-9b04-44a3c76b0462',
      name: 'analyse-bar.py',
      expected_duration: 21600,
      grace_duration: 1800,
      last_started_job: {
        job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
        start_time: '2024-03-31T12:35:00',
        end_time: '2024-03-31T12:59:00',
        succeeded: true,
        output: null,
        duration: 1440,
        late: false,
        in_progress: false
      },
      last_finished_job: {
        job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
        start_time: '2024-03-31T12:35:00',
        end_time: '2024-03-31T12:59:00',
        succeeded: true,
        output: null,
        duration: 1440,
        late: false,
        in_progress: false
      },
      jobs: [
        {
          job_id: '68c71e5a-932f-4443-9b32-dd2e66381499',
          start_time: '2024-03-31T12:35:00',
          end_time: '2024-03-31T12:59:00',
          succeeded: true,
          output: null,
          duration: 1440,
          late: false,
          in_progress: false
        },
        {
          job_id: '34061949-1a39-4b37-afd0-324f9bbc7697',
          start_time: '2024-03-30T10:30:00',
          end_time: '2024-03-30T18:55:00',
          succeeded: false,
          output: 'Timed out',
          duration: 30300,
          late: true,
          in_progress: false
        },
        {
          job_id: '68483bae-3206-45f0-a358-1cf9d7c22975',
          start_time: '2024-03-29T10:30:00',
          end_time: '2024-03-29T16:35:00',
          succeeded: false,
          output: 'Timed out',
          duration: 21900,
          late: false,
          in_progress: false
        }
      ]
    },
    {
      monitor_id: '96ef2054-715b-4686-a155-a146ae9dec29',
      name: 'analyse-bar.py',
      expected_duration: 21600,
      grace_duration: 1800,
      last_started_job: null,
      last_finished_job: null,
      jobs: []
    }
  ]

  return setupServer(
    ...[
      http.get('http://127.0.0.1:8000/api/v1/monitors', () => {
        return HttpResponse.json({
          data: MONITORS.map((monitor) => {
            return {
              monitor_id: monitor.monitor_id,
              name: monitor.name,
              expected_duration: monitor.expected_duration,
              grace_duration: monitor.grace_duration,
              last_started_job: monitor.last_started_job,
              last_finished_job: monitor.last_finished_job
            }
          }),
          paging: { total: MONITORS.length }
        })
      }),
      http.get('http://127.0.0.1:8000/api/v1/monitors/:monitorId', ({ params }) => {
        const { monitorId } = params
        const monitor = MONITORS.find((m) => m.monitor_id === monitorId)

        if (!monitor) {
          return HttpResponse.json(
            {
              error: {
                code: 404,
                reason: 'Not Found',
                description: 'The requested resource could not be found.'
              }
            },
            { status: 404 }
          )
        }

        return HttpResponse.json({
          data: {
            monitor_id: monitor.monitor_id,
            name: monitor.name,
            expected_duration: monitor.expected_duration,
            grace_duration: monitor.grace_duration,
            jobs: monitor.jobs
          }
        })
      }),
      http.post('http://127.0.0.1:8000/api/v1/monitors', async ({ request }) => {
        const body = (await request.json()) as MonitorSummary

        return HttpResponse.json({
          data: {
            monitor_id: '6d7897e3-720a-4602-b5ee-116e752e6b63',
            name: body.name,
            expected_duration: body.expected_duration,
            grace_duration: body.grace_duration,
            jobs: []
          }
        })
      }),
      http.patch(
        'http://127.0.0.1:8000/api/v1/monitors/:monitorId',
        async ({ params, request }) => {
          const { monitorId } = params
          const monitor = MONITORS.find((m) => m.monitor_id === monitorId)

          if (!monitor) {
            return HttpResponse.json(
              {
                error: {
                  code: 404,
                  reason: 'Not Found',
                  description: 'The requested resource could not be found.'
                }
              },
              { status: 404 }
            )
          }

          const body = (await request.json()) as MonitorSummary

          return HttpResponse.json({
            data: {
              monitor_id: monitor.monitor_id,
              name: body.name,
              expected_duration: body.expected_duration,
              grace_duration: body.grace_duration,
              jobs: monitor.jobs
            }
          })
        }
      ),
      http.delete('http://127.0.0.1:8000/api/v1/monitors/:monitorId', ({ params }) => {
        const { monitorId } = params
        const monitor = MONITORS.find((m) => m.monitor_id === monitorId)

        if (!monitor) {
          return HttpResponse.json(
            {
              error: {
                code: 404,
                reason: 'Not Found',
                description: 'The requested resource could not be found.'
              }
            },
            { status: 404 }
          )
        }

        return new HttpResponse(null, { status: 200 })
      })
    ]
  )
}
