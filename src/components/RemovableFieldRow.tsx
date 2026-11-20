import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface RemovableFieldRowProps {
  /** Human name of the field group, used in the close button's label. */
  label: string;
  /** One-based position, used in the close button's label. */
  index: number;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * Shared row for every repeatable input in the app (conditions, sources,
 * expected bullets, actual bullets, completed tasks). The close button is
 * always right-aligned and never part of the field itself.
 */
export function RemovableFieldRow({ label, index, onRemove, children }: RemovableFieldRowProps) {
  return (
    <li className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="icon-button mt-0.5"
        aria-label={`Remove ${label} ${index}`}
        title={`Remove ${label.toLowerCase()} ${index}`}
      >
        <X aria-hidden="true" size={14} strokeWidth={2.5} />
      </button>
    </li>
  );
}
