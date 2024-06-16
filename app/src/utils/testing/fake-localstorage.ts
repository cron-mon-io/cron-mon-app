export class FakeLocalStorage {
  private data: Record<string, any> = {}

  constructor(data: Record<string, any> = {}) {
    this.data = data
  }

  getItem(key: string) {
    return this.data[key]
  }

  setItem(key: string, value: any) {
    this.data[key] = value
  }

  clear() {
    this.data = {}
  }
}
