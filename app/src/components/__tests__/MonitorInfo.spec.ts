import { describe, it, expect, vi } from 'vitest'
import type { Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useRouter } from 'vue-router'

import MonitorInfo from '@/components/MonitorInfo.vue'

describe('MonitorInfo component', () => {
  const vuetify = createVuetify({ components, directives })
  vi.mock('vue-router', () => ({
    useRoute: vi.fn(),
    useRouter: vi.fn(() => ({
      push: () => {}
    }))
  }))

  it('renders Monitor without any jobs as expected', async () => {
    const wrapper = mount(MonitorInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        monitor: {
          monitor_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          name: 'Test Monitor',
          expected_duration: 5430,
          grace_duration: 600,
          last_started_job: null,
          last_finished_job: null
        },
        isNew: true
      }
    })

    // We already test this in the MonitorSummary tests, so we just want to a quick sanity check here.
    const title = wrapper.find('.v-card-title')
    expect(title.text()).toBe('Test Monitor')
    expect(title.find('.mdi-new-box')).toBeTruthy()

    // The monitor doesn't have any finished jobs, so we should have an indicator of this.
    const chips = wrapper.findAll('.v-chip').map((chip) => chip.text())
    expect(chips).toEqual(['No finished jobs'])

    // We should have a button to view the Monitor.
    const viewButton = wrapper.find('.v-card-actions > .v-btn')
    expect(viewButton.text()).toBe('View')
  })

  it.each([
    { late: false, expectedChips: ['No finished jobs', 'In progress'] },
    { late: true, expectedChips: ['No finished jobs', 'Late', 'In progress'] }
  ])('renders Monitor with latest job in progress as expected', async ({ late, expectedChips }) => {
    const wrapper = mount(MonitorInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        monitor: {
          monitor_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          name: 'Test Monitor',
          expected_duration: 5430,
          grace_duration: 600,
          last_started_job: {
            job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
            start_time: '2021-09-01T12:00:00Z',
            end_time: null,
            in_progress: true,
            duration: null,
            late: late,
            succeeded: null,
            output: null
          },
          last_finished_job: null
        },
        isNew: true
      }
    })

    const chips = wrapper.findAll('.v-chip').map((chip) => chip.text())
    expect(chips).toEqual(expectedChips)
  })

  it.each([
    { succeeded: false, late: false, expectedChips: ['Failed'] },
    { succeeded: false, late: true, expectedChips: ['Failed', 'Late'] },
    { succeeded: true, late: false, expectedChips: ['Succeeded'] },
    { succeeded: true, late: true, expectedChips: ['Succeeded', 'Late'] }
  ])(
    'renders Monitor with latest job finished as expected',
    async ({ succeeded, late, expectedChips }) => {
      const wrapper = mount(MonitorInfo, {
        global: {
          plugins: [vuetify]
        },
        props: {
          monitor: {
            monitor_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
            name: 'Test Monitor',
            expected_duration: 5430,
            grace_duration: 600,
            last_started_job: {
              job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
              start_time: '2021-09-01T12:00:00Z',
              end_time: '2021-09-01T12:30:00Z',
              in_progress: false,
              duration: 1800,
              late: late,
              succeeded: succeeded,
              output: null
            },
            last_finished_job: {
              job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
              start_time: '2021-09-01T12:00:00Z',
              end_time: '2021-09-01T12:30:00Z',
              in_progress: false,
              duration: 1800,
              late: late,
              succeeded: succeeded,
              output: null
            }
          },
          isNew: true
        }
      })

      const chips = wrapper.findAll('.v-chip').map((chip) => chip.text())
      expect(chips).toEqual(expectedChips)
    }
  )

  it.each([
    {
      finishedSucceeded: false,
      finishedLate: false,
      startedLate: false,
      expectedChips: ['Failed', 'In progress']
    },
    {
      finishedSucceeded: true,
      finishedLate: false,
      startedLate: false,
      expectedChips: ['Succeeded', 'In progress']
    },
    {
      finishedSucceeded: false,
      finishedLate: true,
      startedLate: false,
      expectedChips: ['Failed', 'Late', 'In progress']
    },
    {
      finishedSucceeded: false,
      finishedLate: false,
      startedLate: true,
      expectedChips: ['Failed', 'Late', 'In progress']
    },
    {
      finishedSucceeded: true,
      finishedLate: true,
      startedLate: false,
      expectedChips: ['Succeeded', 'Late', 'In progress']
    },
    {
      finishedSucceeded: false,
      finishedLate: true,
      startedLate: true,
      expectedChips: ['Failed', 'Late', 'In progress']
    },
    {
      finishedSucceeded: true,
      finishedLate: true,
      startedLate: true,
      expectedChips: ['Succeeded', 'Late', 'In progress']
    }
  ])(
    'render Monitor with multiple jobs as expected',
    async ({ finishedSucceeded, finishedLate, startedLate, expectedChips }) => {
      const wrapper = mount(MonitorInfo, {
        global: {
          plugins: [vuetify]
        },
        props: {
          monitor: {
            monitor_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
            name: 'Test Monitor',
            expected_duration: 5430,
            grace_duration: 600,
            last_started_job: {
              job_id: '2da768ba-2bdc-4d52-938e-237596298317',
              start_time: '2021-09-02T12:00:00Z',
              end_time: null,
              in_progress: true,
              duration: null,
              late: startedLate,
              succeeded: null,
              output: null
            },
            last_finished_job: {
              job_id: 'f7d2f35b-5f0a-4ce6-878a-4b29b11f7574',
              start_time: '2021-09-01T12:00:00Z',
              end_time: '2021-09-01T12:30:00Z',
              in_progress: false,
              duration: 1800,
              late: finishedLate,
              succeeded: finishedSucceeded,
              output: null
            }
          },
          isNew: true
        }
      })

      const chips = wrapper.findAll('.v-chip').map((chip) => chip.text())
      expect(chips).toEqual(expectedChips)
    }
  )

  it('naviates to specific monitor page as expected', async () => {
    const push = vi.fn()
    ;(useRouter as Mock).mockImplementationOnce(() => ({
      push
    }))

    const wrapper = mount(MonitorInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        monitor: {
          monitor_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          name: 'Test Monitor',
          expected_duration: 5430,
          grace_duration: 600,
          last_started_job: null,
          last_finished_job: null
        },
        isNew: true
      }
    })

    const viewButton = wrapper.find('.v-card-actions > .v-btn')
    await viewButton.trigger('click')

    expect(push).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith({
      name: 'monitor',
      params: {
        id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574'
      }
    })
  })
})
