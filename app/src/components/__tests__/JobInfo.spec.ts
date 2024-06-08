import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import JobInfo from '@/components/JobInfo.vue'

const vuetify = createVuetify({ components, directives })

describe('JobInfo component', () => {
  it('renders in progress jobs as expected', () => {
    const wrapper = mount(JobInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        job: {
          job_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          start_time: '2024-06-08T21:24:00',
          end_time: null,
          in_progress: true,
          duration: null,
          late: false,
          succeeded: null,
          output: null
        }
      }
    })

    // The title should be the Job ID.
    const title = wrapper.find('.v-card-title > code').text()
    expect(title).toBe('7230f35b-5f0a-4ce6-878a-4b29b11f7574')

    // We should indicate that the job is in progress.
    const chips = wrapper.findAll('.v-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].text()).toBe('In progress')

    // We should display the Job stats.
    const stats = wrapper.findAll('.v-card-text > .job-stats > span').map((span) => span.text())
    expect(stats).toHaveLength(1)
    expect(stats[0]).toBe('Started at: 2024-06-08T21:24:00')
  })

  it.each([
    {
      output: 'Job completed successfully',
      outputStat: 'Output: Job completed successfully',
      totalStats: 4
    },
    { output: null, outputStat: undefined, totalStats: 3 }
  ])('renders succeeded jobs as expected', ({ output, outputStat, totalStats }) => {
    const wrapper = mount(JobInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        job: {
          job_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          start_time: '2024-06-08T21:24:00',
          end_time: '2024-06-08T21:34:00',
          in_progress: false,
          duration: 600,
          late: false,
          succeeded: true,
          output: output
        }
      }
    })

    // The title should be the Job ID.
    const title = wrapper.find('.v-card-title > code').text()
    expect(title).toBe('7230f35b-5f0a-4ce6-878a-4b29b11f7574')

    // We should indicate that the job has succeeded.
    const chips = wrapper.findAll('.v-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].text()).toBe('Succeeded')

    // We should display the Job stats.
    const stats = wrapper.findAll('.v-card-text > .job-stats > span').map((span) => span.text())
    expect(stats).toHaveLength(totalStats)
    expect(stats.slice(0, 3)).toEqual([
      'Started at: 2024-06-08T21:24:00',
      'Ended at: 2024-06-08T21:34:00',
      'Duration: 00:10:00'
    ])

    expect(stats[3]).toBe(outputStat)
  })

  it.each([
    {
      endTime: '2024-06-08T21:34:00',
      inProgress: false,
      duration: 600,
      succeeded: true,
      status: 'Succeeded'
    },
    {
      endTime: '2024-06-08T21:34:00',
      inProgress: false,
      duration: 600,
      succeeded: false,
      status: 'Failed'
    },
    { endTime: null, inProgress: true, duration: null, succeeded: null, status: 'In progress' }
  ])('renders late jobs as expected', ({ endTime, inProgress, duration, succeeded, status }) => {
    const wrapper = mount(JobInfo, {
      global: {
        plugins: [vuetify]
      },
      props: {
        job: {
          job_id: '7230f35b-5f0a-4ce6-878a-4b29b11f7574',
          start_time: '2024-06-08T21:24:00',
          end_time: endTime,
          in_progress: inProgress,
          duration: duration,
          late: true,
          succeeded: succeeded,
          output: null
        }
      }
    })

    // The title should be the Job ID.
    const title = wrapper.find('.v-card-title > code').text()
    expect(title).toBe('7230f35b-5f0a-4ce6-878a-4b29b11f7574')

    // We should indicate that the job is late.
    const chips = wrapper.findAll('.v-chip')
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toBe(status)
    expect(chips[1].text()).toBe('Late')
  })
})
