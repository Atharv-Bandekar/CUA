import { useState } from 'react';
import { formatFinalSummary, type ResponseLabel } from '../../domain/finalSummary';
import { factualityRatingLabel } from '../../domain/factualAccuracy';
import { responseExperienceRatingLabel } from '../../domain/responseExperience';
import { taskCompletionRatingLabel } from '../../domain/taskCompletion';
import { useEvaluationStore } from '../../state/useEvaluationStore';
import { CopyButton } from '../CopyButton';

interface SummaryRow {
  id: string;
  name: string;
  label: string;
}

export function FinalSummaryView() {
  const state = useEvaluationStore();
  const [responseLabel, setResponseLabel] = useState<ResponseLabel>('A');

  const rows: SummaryRow[] = [
    {
      id: 'taskCompletion',
      name: 'Task Completion',
      label: taskCompletionRatingLabel(state.taskCompletion.finalRating),
    },
    {
      id: 'worldFactCorrectness',
      name: 'World Fact Correctness',
      label: factualityRatingLabel(state.worldFactCorrectness.finalRating),
    },
    {
      id: 'accountFactuality',
      name: 'Account Factuality',
      label: factualityRatingLabel(state.accountFactuality.finalRating),
    },
    {
      id: 'responseExperience',
      name: 'Response Experience',
      label: responseExperienceRatingLabel(state.responseExperience.rating),
    },
  ];

  const output = formatFinalSummary(state, responseLabel);

  return (
    <div className="flex flex-col gap-3">
      <section className="card min-w-0 p-4">
        <h2 className="field-label">Nudge response</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Which response of the pair are you scoring? This only changes the copied heading.
        </p>

        <div
          className="mt-2 inline-flex overflow-hidden rounded-lg border border-line bg-canvas"
          role="group"
          aria-label="Response being scored"
        >
          {(['A', 'B'] as const).map((label) => (
            <button
              key={label}
              type="button"
              aria-pressed={responseLabel === label}
              onClick={() => setResponseLabel(label)}
              className={`min-w-[56px] px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                responseLabel === label
                  ? 'bg-accent-soft text-ink'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Response {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card min-w-0 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="field-label">Response {responseLabel} Scores:</h2>
          <CopyButton text={output} label="Copy Final Summary" />
        </div>

        <ul className="mt-2 space-y-1.5">
          {rows.map((row) => {
            const missing = row.label === '[Not Rated]';

            return (
              <li
                key={row.id}
                data-testid={`summary-row-${row.id}`}
                data-missing={missing ? 'true' : 'false'}
                className={`flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                  missing ? 'border-warn/60 bg-warn/10' : 'border-line bg-canvas'
                }`}
              >
                <span className="min-w-0 break-words text-muted">{row.name}</span>
                <span
                  className={`shrink-0 text-right font-medium ${
                    missing ? 'text-warn' : 'text-ink'
                  }`}
                >
                  {row.label}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 text-[11px] text-muted">
          Ratings sync live from the four scoring tabs. Highlighted rows still need a rating.
        </p>
      </section>

      <section className="card min-w-0 p-4">
        <h2 className="field-label">Live output</h2>
        <pre
          data-testid="final-summary-output"
          className="mt-2 overflow-auto rounded-lg border border-line bg-canvas p-3 font-sans text-[11px] leading-relaxed break-words whitespace-pre-wrap text-ink"
        >
          {output}
        </pre>
      </section>
    </div>
  );
}
