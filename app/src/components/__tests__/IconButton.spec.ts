import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import IconButton from '../IconButton.vue'

describe('IconButton component', () => {
  const vuetify = createVuetify({ components, directives })

  it('emits click when clicked', () => {
    const wrapper = mount(IconButton, {
      global: {
        plugins: [vuetify]
      },
      props: {
        icon: 'test-tube',
        tooltip: 'Test tooltip'
      }
    })
    expect(wrapper.emitted('click')).toBeUndefined()

    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
