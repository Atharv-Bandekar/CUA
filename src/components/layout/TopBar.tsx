import { Trash2 } from 'lucide-react';
import { evaluationStore } from '../../state/useEvaluationStore';

export interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Evaluation
          </p>
          <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
        </div>

        <button
          type="button"
          onClick={() => {
            evaluationStore.clearAll();
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-danger/50 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          <Trash2 aria-hidden="true" size={13} />
          Clear All
        </button>
      </div>
    </header>
  );
}
