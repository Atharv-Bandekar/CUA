import { Check, ClipboardCopy, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyText } from '../adapters/clipboard';

type CopyStatus = 'idle' | 'copied' | 'failed';

export interface CopyButtonProps {
  /** Text handed to the clipboard adapter. */
  text: string;
  /** Label shown before the first copy attempt. */
  label: string;
}

const RESET_MS = 1_800;

/** Copy action with idle/copied/failed feedback, shared by every output card. */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (status === 'idle') {
      return;
    }

    const handle = window.setTimeout(() => setStatus('idle'), RESET_MS);
    return () => window.clearTimeout(handle);
  }, [status]);

  async function handleCopy(): Promise<void> {
    const copied = await copyText(text);
    setStatus(copied ? 'copied' : 'failed');
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-panel-raised px-2.5 py-1.5 text-[11px] font-medium text-ink transition hover:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
    >
      {status === 'copied' ? (
        <Check aria-hidden="true" size={12} className="text-accent" />
      ) : status === 'failed' ? (
        <TriangleAlert aria-hidden="true" size={12} className="text-warn" />
      ) : (
        <ClipboardCopy aria-hidden="true" size={12} />
      )}
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
    </button>
  );
}
