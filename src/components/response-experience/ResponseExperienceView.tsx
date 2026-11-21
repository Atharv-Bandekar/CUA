import { Plus } from 'lucide-react';
import {
  RESPONSE_EXPERIENCE_OPTIONS,
  formatResponseExperience,
  responseExperienceJustificationForRating,
  type ResponseExperiencePoint,
  type ResponseExperienceState,
} from '../../domain/responseExperience';
import { evaluationStore, useEvaluationStore } from '../../state/useEvaluationStore';
import { CopyButton } from '../CopyButton';
import { RemovableFieldRow } from '../RemovableFieldRow';
import { ScaleTrack } from '../ScaleTrack';

interface PointListProps {
  legend: string;
  addLabel: string;
  placeholder: string;
  ariaPrefix: string;
  points: ResponseExperiencePoint[];
  onChange: (points: ResponseExperiencePoint[]) => void;
}

function PointList({
  legend,
  addLabel,
  placeholder,
  ariaPrefix,
  points,
  onChange,
}: PointListProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="field-label">{legend}</h2>
        <button
          type="button"
          className="add-button"
          onClick={() => onChange([...points, { text: '' }])}
        >
          <Plus aria-hidden="true" size={12} />
          {addLabel}
        </button>
      </div>

      {points.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[11px] leading-relaxed text-muted">
          Nothing listed yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {points.map((point, index) => (
            <RemovableFieldRow
              key={index}
              label={ariaPrefix}
              index={index + 1}
              onRemove={() => onChange(points.filter((_point, position) => position !== index))}
            >
              <textarea
                rows={1}
                className="field-input resize-none"
                aria-label={`${ariaPrefix} ${index + 1}`}
                placeholder={placeholder}
                value={point.text}
                onChange={(event) =>
                  onChange(
                    points.map((entry, position) =>
                      position === index ? { text: event.target.value } : entry,
                    ),
                  )
                }
              />
            </RemovableFieldRow>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResponseExperienceView() {
  const { responseExperience } = useEvaluationStore();
  const perfect = responseExperience.rating === '5/5';
  const output = formatResponseExperience(responseExperience);

  function update(patch: Partial<ResponseExperienceState>): void {
    evaluationStore.updateResponseExperience(patch);
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card min-w-0 space-y-3 p-4">
        <h2 className="field-label">Response Experience</h2>
        <ScaleTrack
          label="Response experience rating"
          options={RESPONSE_EXPERIENCE_OPTIONS}
          value={responseExperience.rating}
          onChange={(rating) => {
            const seeded = responseExperienceJustificationForRating(rating);

            update(seeded === null ? { rating } : { rating, justification: seeded });
          }}
        />

        {perfect ? (
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="response-experience-justification" className="field-label">
              Justification
            </label>
            <textarea
              id="response-experience-justification"
              className="field-input resize-none"
              rows={3}
              placeholder="Why can this response not be improved?"
              value={responseExperience.justification}
              onChange={(event) => update({ justification: event.target.value })}
            />
          </div>
        ) : (
          <>
            <PointList
              legend="Expected"
              addLabel="Add Expected"
              ariaPrefix="Expected point"
              placeholder="What should the response have done?"
              points={responseExperience.expectedPoints}
              onChange={(expectedPoints) => update({ expectedPoints })}
            />
            <PointList
              legend="Actual"
              addLabel="Add Actual"
              ariaPrefix="Actual point"
              placeholder="What did the response actually do?"
              points={responseExperience.actualPoints}
              onChange={(actualPoints) => update({ actualPoints })}
            />
          </>
        )}
      </section>

      <section className="card min-w-0 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="field-label">Live output</h2>
          <CopyButton text={output} label="Copy Response Experience" />
        </div>

        <pre
          data-testid="response-experience-output"
          className="mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-canvas p-3 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink"
        >
          {output}
        </pre>
      </section>
    </div>
  );
}
