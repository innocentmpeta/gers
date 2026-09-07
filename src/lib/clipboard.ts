// Best-effort only — navigator.clipboard.writeText can fail (or succeed)
// without any reliable signal either way across browsers, so this silently
// swallows errors. Callers should pair this with a visible, manually
// selectable fallback (see CopyableMessageBox) rather than depend on this
// working or on the user noticing whether it did.
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // No visible fallback here on purpose — see CopyableMessageBox.
  }
}
