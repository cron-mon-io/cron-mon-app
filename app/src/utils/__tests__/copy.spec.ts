import { test, expect } from 'vitest'

import { copyToClipboard } from '../copy'

class FakeClipboard {
  private text = ''

  writeText(text: string): Promise<void> {
    this.text = text
    return Promise.resolve()
  }

  readText(): Promise<string> {
    return Promise.resolve(this.text)
  }

  // In order for FakeClipboard to be a valid Clipboard object, it must have the
  // following methods, so we stub them out to keep TypeScript happy.
  read(): Promise<ClipboardItems> {
    throw new Error('Not implemented')
  }
  write(): Promise<void> {
    throw new Error('Not implemented')
  }
  addEventListener(): void {
    throw new Error('Not implemented')
  }
  removeEventListener(): void {
    throw new Error('Not implemented')
  }
  dispatchEvent(): boolean {
    throw new Error('Not implemented')
  }
}

test('copyToClipboard works as expected', async () => {
  const fakeClipboard = new FakeClipboard()
  await copyToClipboard('test', fakeClipboard)

  const copied = await fakeClipboard.readText()
  expect(copied).toBe('test')
})
