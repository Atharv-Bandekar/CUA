import { Check, Copy, Plus, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatJustificationSummary } from '../domain/format';
import type {
  JustificationSlice,
  RatingScaleLabels,
  RepeatableItem,
  SourceItem,
} from '../domain/types';
import { createRepeatableItem, createSourceItem, removeItem, updateItem } from '../state/items';
import { RatingSelector } from './RatingSelector';
import { RemovableFieldRow } from './RemovableFieldRow';
import { SectionCard } from './SectionCard';

export type CopyStatus = 'idle' | 'copied' | 'failed';

export interface JustificationBuilderViewProps {
  title: string;
  description: string;
  icon: ReactNode;
  scale: RatingScaleLabels;
  draft: JustificationSlice;
  onChange: (draft: JustificationSlice) => void;
  onCopy: (text: string) => void;
  copyStatus: CopyStatus;
}

interface ItemGroupProps {
  legend: string;
  addLabel: string;
  placeholder: string;
  items: RepeatableItem[];
  onChange: (items: RepeatableItem[]) => void;
}

function ItemGroup({ legend, addLabel, placeholder, items, onChange }: ItemGroupProps) {
  return (
    <fieldset className="min-w-0 space-y-1.5">
      <legend className="field-label">{legend}</legend>

      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <RemovableFieldRow
            key={item.id}
            label={legend}
            index={index + 1}
            onRemove={() => onChange(removeItem(items, item.id))}
          >
            <input
              type="text"
              className="field-input"
              value={item.value}
              placeholder={placeholder}
              aria-label={`${legend} ${index + 1}`}
              onChange={(event) => onChange(updateItem(items, item.id, { value: event.target.value }))}
            />
          </RemovableFieldRow>
        ))}
      </ul>

      <button type="button" className="add-button" onClick={() => onChange([...items, createRepeatableItem()])}>
        <Plus aria-hidden="true" size={12} />
        {addLabel}
      </button>
    </fieldset>
  );
}

interface SourceGroupProps {
  sources: SourceItem[];
  onChange: (sources: SourceItem[]) => void;
}

function SourceGroup({ sources, onChange }: SourceGroupProps) {
  return (
    <fieldset className="min-w-0 space-y-1.5">
      <legend className="field-label">Sources</legend>

      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <RemovableFieldRow
            key={source.id}
            label="source"
            index={index + 1}
            onRemove={() => onChange(removeItem(sources, source.id))}
          >
            <div className="grid min-w-0 grid-cols-1 gap-1.5">
              <input
                type="text"
                className="field-input"
                value={source.label}
                placeholder="Source name"
                aria-label={`Source ${index + 1} name`}
                onChange={(event) =>
                  onChange(updateItem(sources, source.id, { label: event.target.value }))
                }
              />
              <input
                type="url"
                className="field-input break-all"
                value={source.url}
                placeholder="https://…"
                aria-label={`Source ${index + 1} URL`}
                onChange={(event) =>
                  onChange(updateItem(sources, source.id, { url: event.target.value }))
                }
              />
            </div>
          </RemovableFieldRow>
        ))}
      </ul>

      <button type="button" className="add-button" onClick={() => onChange([...sources, createSourceItem()])}>
        <Plus aria-hidden="true" size={12} />
        Add source
      </button>
    </fieldset>
  );
}

const copyButtonClass =
  'inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted transition hover:border-accent/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none';

function CopyAction({ status, onClick }: { status: CopyStatus; onClick: () => void }) {
  return (
    <button type="button" className={copyButtonClass} onClick={onClick} aria-live="polite">
      {status === 'copied' ? (
        <Check aria-hidden="true" size={12} className="text-accent" />
      ) : status === 'failed' ? (
        <TriangleAlert aria-hidden="true" size={12} className="text-warn" />
      ) : (
        <Copy aria-hidden="true" size={12} />
      )}
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy'}
    </button>
  );
}

/**
 * Shared, parameterised builder for World Fact Correctness and Account
 * Factuality. Both sections reuse this component — there is no duplicated UI.
 */
export function JustificationBuilderView({
  title,
  description,
  icon,
  scale,
  draft,
  onChange,
  onCopy,
  copyStatus,
}: JustificationBuilderViewProps) {
  return (
    <SectionCard
      icon={icon}
      title={title}
      description={description}
      actions={
        <CopyAction
          status={copyStatus}
          onClick={() => onCopy(formatJustificationSummary(title, draft, scale))}
        />
      }
    >
      <RatingSelector
        label="Rating"
        value={draft.rating}
        scale={scale}
        onChange={(rating) => onChange({ ...draft, rating })}
      />

      <div className="h-px bg-line" role="presentation" />

      <ItemGroup
        legend="Conditions"
        addLabel="Add condition"
        placeholder="e.g. Public filing from Q3"
        items={draft.conditions}
        onChange={(conditions) => onChange({ ...draft, conditions })}
      />

      <SourceGroup
        sources={draft.sources}
        onChange={(sources) => onChange({ ...draft, sources })}
      />

      <ItemGroup
        legend="Expected"
        addLabel="Add expected"
        placeholder="e.g. Revenue grows 12%"
        items={draft.expected}
        onChange={(expected) => onChange({ ...draft, expected })}
      />

      <ItemGroup
        legend="Actual"
        addLabel="Add actual"
        placeholder="e.g. Revenue grows 9%"
        items={draft.actual}
        onChange={(actual) => onChange({ ...draft, actual })}
      />
    </SectionCard>
  );
}
