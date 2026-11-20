import { Check, ClipboardCopy, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyText } from '../../adapters/clipboard';
import { formatTaskCompletion, type TaskCompletionState } from '../../domain/taskCompletion';

type CopyStatus = 'idle' | 'copied' | 'failed';

export interface TaskCompletionPreviewProps {
  state: TaskCompletionState;
}

export function TaskCompletionPreview({ state }: TaskCompletionPreviewProps) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const output = formatTaskCompletion(state);

  useEffect(() => {
    if (status === 'idle') {
      return;
    }

    const handle = window.setTimeout(() => setStatus('idle'), 1_800);
    return () => window.clearTimeout(handle);
  }, [status]);

  async function handleCopy(): Promise<void> {
    const copied = await copyText(output);
    setStatus(copied ? 'copied' : 'failed');
  }

  return (
    <section className="card min-w-0 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="field-label">Live output</h2>
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
          {status === 'copied'
            ? 'Copied'
            : status === 'failed'
              ? 'Copy failed'
              : 'Copy Task Completion'}
        </button>
      </div>

      <pre
        data-testid="task-completion-output"
        className="mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-canvas p-3 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink"
      >
        {output}
      </pre>
    </section>
  );
}
