export class FakeLocalStorage {
  private data: Record<string, unknown> = {}

  constructor(data: Record<string, unknown> = {}) {
    this.data = data
  }

  getItem(key: string) {
    return this.data[key]
  }

  setItem(key: string, value: unknown) {
    this.data[key] = value
  }

  clear() {
    this.data = {}
  }
}
