/**
 * Clipboard adapter. The only place in the app that may call the Clipboard API.
 */

export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

function getClipboard(): ClipboardWriter | null {
  try {
    const navigatorValue: unknown = globalThis.navigator;

    if (typeof navigatorValue !== 'object' || navigatorValue === null) {
      return null;
    }

    const clipboard: unknown = (navigatorValue as { clipboard?: unknown }).clipboard;

    if (
      typeof clipboard === 'object' &&
      clipboard !== null &&
      typeof (clipboard as ClipboardWriter).writeText === 'function'
    ) {
      return clipboard as ClipboardWriter;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Copies text to the clipboard. Never throws: resolves to false when the
 * Clipboard API is missing (insecure context, unsupported browser) or denied.
 */
export async function copyText(
  text: string,
  clipboard: ClipboardWriter | null = getClipboard(),
): Promise<boolean> {
  if (clipboard === null) {
    return false;
  }

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
