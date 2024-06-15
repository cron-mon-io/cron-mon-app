import { test, expect } from 'vitest'

import { copyToClipboard } from '../copy'

import { FakeClipboard } from '@/utils/testing/fake-clipboard'

test('copyToClipboard works as expected', async () => {
  const fakeClipboard = new FakeClipboard()
  await copyToClipboard('test', fakeClipboard)

  const copied = await fakeClipboard.readText()
  expect(copied).toBe('test')
})
