import { setupServer } from 'msw/node'
import type { SetupServer } from 'msw/node'
import { HttpResponse, http, type StrictRequest, type JsonBodyType } from 'msw'
import { v4 as uuidv4 } from 'uuid'

import type { MonitorSummary } from '@/types/monitor'

export function setupTestAPI(expectedToken: string): SetupServer {
  let monitors = [
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

  function assertAuth(request: StrictRequest<JsonBodyType>): HttpResponse | void {
    const token = request.headers.get('Authorization')
    return token === `Bearer ${expectedToken}`
      ? undefined
      : HttpResponse.json(
          {
            error: {
              code: 401,
              reason: 'Unauthorized',
              description: 'The request requires user authentication.'
            }
          },
          { status: 401 }
        )
  }

  return setupServer(
    ...[
      http.get('http://127.0.0.1:8000/api/v1/docs/openapi.yaml', () => {
        return new HttpResponse('openapi: 3.0.0', {
          status: 201,
          headers: { 'Content-Type': 'application/yaml' }
        })
      }),
      http.get('http://127.0.0.1:8000/api/v1/monitors', ({ request }) => {
        return (
          assertAuth(request) ||
          HttpResponse.json({
            data: monitors.map((monitor) => {
              return {
                monitor_id: monitor.monitor_id,
                name: monitor.name,
                expected_duration: monitor.expected_duration,
                grace_duration: monitor.grace_duration,
                last_started_job: monitor.last_started_job,
                last_finished_job: monitor.last_finished_job
              }
            }),
            paging: { total: monitors.length }
          })
        )
      }),
      http.get('http://127.0.0.1:8000/api/v1/monitors/:monitorId', ({ request, params }) => {
        const authErroResponse = assertAuth(request)
        if (authErroResponse) {
          return authErroResponse
        }

        const { monitorId } = params
        const monitor = monitors.find((m) => m.monitor_id === monitorId)

        if (!monitor) {
          return HttpResponse.json(
            {
              error: {
                code: 404,
                reason: 'Monitor Not Found',
                description: `Failed to find monitor with id '${monitorId}'`
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
        const authErroResponse = assertAuth(request)
        if (authErroResponse) {
          return authErroResponse
        }

        const body = (await request.json()) as MonitorSummary
        const monitor = {
          monitor_id: uuidv4(),
          name: body.name,
          expected_duration: body.expected_duration,
          grace_duration: body.grace_duration,
          last_started_job: null,
          last_finished_job: null,
          jobs: []
        }
        monitors.push(monitor)

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
      http.patch(
        'http://127.0.0.1:8000/api/v1/monitors/:monitorId',
        async ({ params, request }) => {
          const authErroResponse = assertAuth(request)
          if (authErroResponse) {
            return authErroResponse
          }

          const { monitorId } = params
          const monitor = monitors.find((m) => m.monitor_id === monitorId)

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
      http.delete('http://127.0.0.1:8000/api/v1/monitors/:monitorId', ({ request, params }) => {
        const authErroResponse = assertAuth(request)
        if (authErroResponse) {
          return authErroResponse
        }

        const { monitorId } = params
        const monitor = monitors.find((m) => m.monitor_id === monitorId)

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

        monitors = monitors.filter((m) => m.monitor_id !== monitorId)

        return new HttpResponse(null, { status: 200 })
      })
    ]
  )
}
