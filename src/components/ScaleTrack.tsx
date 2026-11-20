import type { RatingOption } from '../domain/ratingOptions';

export interface ScaleTrackProps<T extends string> {
  /** Accessible name for the radio group. */
  label: string;
  options: readonly RatingOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
}

/** Five-node rating track shared by the factuality and response sections. */
export function ScaleTrack<T extends string>({
  label,
  options,
  value,
  onChange,
}: ScaleTrackProps<T>) {
  return (
    <div
      className="grid grid-cols-5 divide-x divide-line overflow-hidden rounded-xl border border-line bg-canvas"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
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
              selected ? 'bg-accent-soft text-ink' : 'text-muted hover:bg-panel-raised hover:text-ink'
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
