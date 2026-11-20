import { Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatSecondsRemaining } from '../../domain/format';
import { evaluationStore, useUndoState } from '../../state/useEvaluationStore';

export function UndoToast() {
  const undo = useUndoState();
  const [remainingMs, setRemainingMs] = useState(0);

  const active = undo.active && undo.expiresAt !== null;
  const expiresAt = undo.expiresAt;

  useEffect(() => {
    if (!active || expiresAt === null) {
      return;
    }

    const update = () => setRemainingMs(expiresAt - Date.now());
    update();
    const handle = window.setInterval(update, 250);

    return () => window.clearInterval(handle);
  }, [active, expiresAt]);

  if (!active || expiresAt === null) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex min-w-0 items-center gap-3 rounded-xl border border-warn/40 bg-panel px-3 py-2 shadow-lg shadow-black/30"
      >
        <span className="min-w-0 text-xs text-ink">Worksheet cleared.</span>
        <button
          type="button"
          onClick={() => {
            evaluationStore.undoClear();
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-warn/50 px-2 py-1 text-xs font-semibold text-warn transition hover:bg-warn/15 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          <Undo2 aria-hidden="true" size={13} />
          Undo ({formatSecondsRemaining(remainingMs)})
        </button>
      </div>
    </div>
  );
}
