export async function copyToClipboard(text: string, clipboard: Clipboard | undefined = undefined) {
  clipboard = clipboard || navigator.clipboard
  await clipboard.writeText(text)
}
