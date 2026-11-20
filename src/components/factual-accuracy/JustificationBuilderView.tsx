import { Plus } from 'lucide-react';
import {
  CLAIM_ACCURACIES,
  CLAIM_CLASSIFICATIONS,
  FACTUALITY_OPTIONS,
  createEmptyClaim,
  createEmptyClaimSource,
  formatJustificationBuilder,
  formatObjectiveClaimsList,
  type Claim,
  type FactualAccuracyState,
} from '../../domain/factualAccuracy';
import {
  evaluationStore,
  useEvaluationStore,
  type FactualitySectionKey,
} from '../../state/useEvaluationStore';
import { CopyButton } from '../CopyButton';
import { RemovableFieldRow } from '../RemovableFieldRow';
import { ScaleTrack } from '../ScaleTrack';

export interface JustificationBuilderViewProps {
  section: FactualitySectionKey;
  title: string;
  description: string;
}

const pillClass = (selected: boolean): string =>
  `rounded-full border px-2 py-1 text-[10px] font-medium transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
    selected
      ? 'border-accent bg-accent-soft text-ink'
      : 'border-line bg-panel text-muted hover:border-accent/50 hover:text-ink'
  }`;

/**
 * Shared, parameterised builder for World Fact Correctness and Account
 * Factuality. Both sections mount this one component — there is no duplicated
 * claim, source or output UI.
 */
export function JustificationBuilderView({
  section,
  title,
  description,
}: JustificationBuilderViewProps) {
  const factuality = useEvaluationStore()[section];
  const claims = factuality.claims;
  const justificationOutput = formatJustificationBuilder(factuality);
  const objectiveClaimsOutput = formatObjectiveClaimsList(claims);
  const justificationMissing = factuality.finalJustification.trim() === '';

  function update(patch: Partial<FactualAccuracyState>): void {
    evaluationStore.updateFactuality(section, patch);
  }

  function updateClaim(index: number, patch: Partial<Claim>): void {
    update({
      claims: claims.map((claim, position) =>
        position === index ? { ...claim, ...patch } : claim,
      ),
    });
  }

  function removeClaim(index: number): void {
    update({ claims: claims.filter((_claim, position) => position !== index) });
  }

  function addSource(index: number): void {
    const claim = claims[index];

    if (claim === undefined) {
      return;
    }

    updateClaim(index, { sources: [...claim.sources, createEmptyClaimSource()] });
  }

  function removeSource(claimIndex: number, sourceIndex: number): void {
    const claim = claims[claimIndex];

    if (claim === undefined) {
      return;
    }

    updateClaim(claimIndex, {
      sources: claim.sources.filter((_source, position) => position !== sourceIndex),
    });
  }

  function updateSource(claimIndex: number, sourceIndex: number, text: string): void {
    const claim = claims[claimIndex];

    if (claim === undefined) {
      return;
    }

    updateClaim(claimIndex, {
      sources: claim.sources.map((source, position) =>
        position === sourceIndex ? { text } : source,
      ),
    });
  }

  const addClaimButton = (
    <button type="button" className="add-button" onClick={() => update({ claims: [...claims, createEmptyClaim()] })}>
      <Plus aria-hidden="true" size={12} />
      Add Claim
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <section className="card min-w-0 p-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted">
            {claims.length === 1 ? '1 claim' : `${claims.length} claims`}
          </span>
          {addClaimButton}
        </div>
      </section>

      <section className="card min-w-0 p-4">
        <h2 className="field-label">Claims</h2>

        {claims.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
            No claims yet. Add one claim at a time and rate how it holds up.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {claims.map((claim, index) => (
              <RemovableFieldRow
                key={index}
                label="claim"
                index={index + 1}
                onRemove={() => removeClaim(index)}
              >
                <div className="min-w-0 space-y-2 rounded-lg border border-line bg-canvas p-2.5">
                  <span className="field-label">Claim {index + 1}</span>

                  <textarea
                    className="field-input resize-y"
                    rows={2}
                    aria-label={`Claim ${index + 1} text`}
                    placeholder="What did the response claim?"
                    value={claim.text}
                    onChange={(event) => updateClaim(index, { text: event.target.value })}
                  />

                  <div className="space-y-1">
                    <span className="field-label">Accuracy</span>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={`Claim ${index + 1} accuracy`}
                    >
                      {CLAIM_ACCURACIES.map((accuracy) => (
                        <button
                          key={accuracy}
                          type="button"
                          aria-pressed={claim.accuracy === accuracy}
                          onClick={() => updateClaim(index, { accuracy })}
                          className={pillClass(claim.accuracy === accuracy)}
                        >
                          {accuracy}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label">Classification</span>
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={`Claim ${index + 1} classification`}
                    >
                      {CLAIM_CLASSIFICATIONS.map((classification) => (
                        <button
                          key={classification}
                          type="button"
                          aria-pressed={claim.classification === classification}
                          onClick={() => updateClaim(index, { classification })}
                          className={pillClass(claim.classification === classification)}
                        >
                          {classification}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="field-input resize-y"
                    rows={2}
                    aria-label={`Claim ${index + 1} justification`}
                    placeholder="Why does this claim earn its accuracy?"
                    value={claim.justification}
                    onChange={(event) => updateClaim(index, { justification: event.target.value })}
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="field-label">Sources</span>
                      <button
                        type="button"
                        className="add-button"
                        onClick={() => addSource(index)}
                      >
                        <Plus aria-hidden="true" size={12} />
                        Add Source
                      </button>
                    </div>

                    {claim.sources.length > 0 && (
                      <ul className="space-y-1.5">
                        {claim.sources.map((source, sourceIndex) => (
                          <RemovableFieldRow
                            key={sourceIndex}
                            label="source"
                            index={sourceIndex + 1}
                            onRemove={() => removeSource(index, sourceIndex)}
                          >
                            <input
                              type="text"
                              className="field-input break-all"
                              aria-label={`Claim ${index + 1} source ${sourceIndex + 1}`}
                              placeholder="Source name or URL"
                              value={source.text}
                              onChange={(event) =>
                                updateSource(index, sourceIndex, event.target.value)
                              }
                            />
                          </RemovableFieldRow>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </RemovableFieldRow>
            ))}
          </ul>
        )}

        <div className="mt-2">{addClaimButton}</div>
      </section>

      <section className="card min-w-0 space-y-3 p-4">
        <h2 className="field-label">Final Rating</h2>
        <ScaleTrack
          label="Final rating"
          options={FACTUALITY_OPTIONS}
          value={factuality.finalRating}
          onChange={(finalRating) => update({ finalRating })}
        />

        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${section}-final-justification`} className="field-label">
              Final Justification
            </label>
            <span className="rounded-full border border-warn/50 bg-warn/10 px-1.5 py-0.5 text-[10px] font-semibold text-warn">
              Required
            </span>
          </div>
          <textarea
            id={`${section}-final-justification`}
            aria-invalid={justificationMissing}
            className={`field-input resize-y ${
              justificationMissing ? 'border-warn/70 focus:border-warn focus:ring-warn/20' : ''
            }`}
            rows={3}
            placeholder="Summarise the factuality of the response."
            value={factuality.finalJustification}
            onChange={(event) => update({ finalJustification: event.target.value })}
          />
          {justificationMissing && (
            <p className="text-[11px] text-warn">
              A final justification is required before this section is complete.
            </p>
          )}
        </div>
      </section>

      <section className="card min-w-0 space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="field-label">Justification output</h2>
          <CopyButton text={justificationOutput} label="Copy justification" />
        </div>
        <pre
          data-testid="factuality-output"
          className="max-h-80 overflow-auto rounded-lg border border-line bg-canvas p-3 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink"
        >
          {justificationOutput}
        </pre>

        <div className="flex items-center justify-between gap-2">
          <h2 className="field-label">Objective claims</h2>
          <CopyButton text={objectiveClaimsOutput} label="Copy objective claims" />
        </div>
        <pre
          data-testid="objective-claims-output"
          className="max-h-60 overflow-auto rounded-lg border border-line bg-canvas p-3 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink"
        >
          {objectiveClaimsOutput === '' ? 'No objective claims yet.' : objectiveClaimsOutput}
        </pre>
      </section>
    </div>
  );
}
