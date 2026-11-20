import { RATING_VALUES } from '../domain/ratings';
import type { Rating, RatingScaleLabels } from '../domain/types';

export interface RatingSelectorProps {
  label: string;
  value: Rating | null;
  scale: RatingScaleLabels;
  onChange: (rating: Rating) => void;
}

export function RatingSelector({ label, value, scale, onChange }: RatingSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="field-label">{label}</span>
        <span className="text-right text-[11px] text-muted">
          {value === null ? 'Not rated' : scale[value]}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {RATING_VALUES.map((rating) => {
          const selected = value === rating;

          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${rating} of 5, ${scale[rating]}`}
              title={scale[rating]}
              onClick={() => onChange(rating)}
              className={`flex h-9 min-w-0 items-center justify-center rounded-lg border text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                selected
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-line bg-canvas text-muted hover:border-accent/50 hover:text-ink'
              }`}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}
