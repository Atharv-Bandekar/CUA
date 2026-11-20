import { TASK_COMPLETION_STATUSES, type TaskCompletionRating } from '../../domain/taskCompletion';

export interface StatusPillsProps {
  label: string;
  value: TaskCompletionRating | '';
  onChange: (rating: TaskCompletionRating) => void;
}

export function StatusPills({ label, value, onChange }: StatusPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      {TASK_COMPLETION_STATUSES.map((pill) => {
        const selected = value === pill.value;

        return (
          <button
            key={pill.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(pill.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
              selected
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line bg-canvas text-muted hover:border-accent/50 hover:text-ink'
            }`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
