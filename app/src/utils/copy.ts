export async function copyToClipboard(text: string, clipboard: Clipboard = navigator.clipboard) {
  await clipboard.writeText(text)
}
