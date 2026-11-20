import { TASK_COMPLETION_OPTIONS, type TaskCompletionRating } from '../../domain/taskCompletion';

export interface FinalRatingTrackProps {
  value: TaskCompletionRating | '';
  onChange: (rating: TaskCompletionRating) => void;
}

export function FinalRatingTrack({ value, onChange }: FinalRatingTrackProps) {
  return (
    <div
      className="grid grid-cols-5 divide-x divide-line overflow-hidden rounded-xl border border-line bg-canvas"
      role="radiogroup"
      aria-label="Final rating"
    >
      {TASK_COMPLETION_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option.value} ${option.label}`}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[64px] min-w-0 flex-col items-center justify-start px-1 py-2 text-center transition focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none ${
              selected
                ? 'bg-accent-soft text-ink'
                : 'text-muted hover:bg-panel-raised hover:text-ink'
            }`}
          >
            <span className={`text-[11px] font-semibold ${selected ? 'text-accent' : ''}`}>
              {option.value}
            </span>
            <span className="mt-1 text-[10px] leading-tight break-words">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
