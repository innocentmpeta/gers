// navigator.clipboard.writeText can fail without any visible error in some
// browser/security contexts — window.prompt is a blunt but universally
// reliable fallback: the browser pre-selects the text in the dialog, so
// Cmd/Ctrl+C always works from there regardless of Clipboard API support.
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    window.prompt('Clipboard access was blocked — copy this manually:', text)
  }
}
