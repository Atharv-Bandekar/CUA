import {
  appendInfrastructureTemplate,
  INFRASTRUCTURE_ISSUE_TEMPLATE,
  type InfrastructureIssue,
} from '../../domain/taskCompletion';
import { evaluationStore } from '../../state/useEvaluationStore';
import { RemovableFieldRow } from '../RemovableFieldRow';

export interface InfrastructureIssuesSectionProps {
  issues: InfrastructureIssue[];
  /** Current justification text; Add Issue writes the template into it. */
  justification: string;
  /** true → the issues are their own list, entered as action / failure rows. */
  separateList: boolean;
}

const SEPARATE_LIST_CHOICES: readonly { label: string; value: boolean }[] = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

/**
 * Infrastructure / tool call issues for the Task Completion tab. The
 * separate-list answer picks the shape: with No, Add Issue writes
 * `Agent tries to but` into the justification field; with Yes, the issues are
 * recorded as rows and printed as their own bulleted block.
 */
export function InfrastructureIssuesSection({
  issues,
  justification,
  separateList,
}: InfrastructureIssuesSectionProps) {
  function addIssue(): void {
    if (!separateList) {
      evaluationStore.updateTaskCompletion({
        justification: appendInfrastructureTemplate(justification),
      });
      return;
    }

    evaluationStore.updateTaskCompletion({
      infrastructureIssues: [...issues, { action: '', failure: '' }],
    });
  }

  function updateIssue(index: number, patch: Partial<InfrastructureIssue>): void {
    evaluationStore.updateTaskCompletion({
      infrastructureIssues: issues.map((issue, position) =>
        position === index ? { ...issue, ...patch } : issue,
      ),
    });
  }

  function removeIssue(index: number): void {
    evaluationStore.updateTaskCompletion({
      infrastructureIssues: issues.filter((_issue, position) => position !== index),
    });
  }

  return (
    <section className="card min-w-0 space-y-2.5 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="field-label min-w-0">Infrastructure / tool call issues</h2>

        {/* ml-auto + justify-end keeps the question, its pills and Add Issue flush
            with the right edge of the issue rows below them, even when they wrap. */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
          <span className="text-[11px] text-muted">Want a separate Infrastructure list?</span>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Separate infrastructure list"
          >
            {SEPARATE_LIST_CHOICES.map((choice) => {
              const selected = separateList === choice.value;

              return (
                <button
                  key={choice.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    evaluationStore.updateTaskCompletion({
                      separateInfrastructureList: choice.value,
                    })
                  }
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                    selected
                      ? 'border-accent bg-accent-soft text-ink'
                      : 'border-line bg-canvas text-muted hover:border-accent/50 hover:text-ink'
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={addIssue} className="add-button ml-1 shrink-0 whitespace-nowrap">
            + Add Issue
          </button>
        </div>
      </div>

      {!separateList ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
          With no separate list, Add Issue writes{' '}
          <span className="text-ink">{INFRASTRUCTURE_ISSUE_TEMPLATE}</span> into the Justification
          field, right after the text already there.
        </p>
      ) : issues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
          No issues recorded. Use Add Issue and describe each one as{' '}
          <span className="text-ink">Agent tries to [action + target] but [what failed]</span>.
        </p>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue, index) => (
            <RemovableFieldRow
              key={index}
              label="infrastructure issue"
              index={index + 1}
              onRemove={() => removeIssue(index)}
            >
              <div className="rounded-lg border border-line bg-canvas p-2.5">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <span className="shrink-0 text-[11px] font-medium text-muted">Agent tries to</span>
                  <input
                    type="text"
                    className="field-input min-w-0 flex-1"
                    aria-label={`Infrastructure issue ${index + 1} attempted action`}
                    placeholder="action + target / details"
                    value={issue.action}
                    onChange={(event) => updateIssue(index, { action: event.target.value })}
                  />
                  <span className="shrink-0 text-[11px] font-medium text-muted">but</span>
                  <input
                    type="text"
                    className="field-input min-w-0 flex-1"
                    aria-label={`Infrastructure issue ${index + 1} failure`}
                    placeholder="what failed / what did not change"
                    value={issue.failure}
                    onChange={(event) => updateIssue(index, { failure: event.target.value })}
                  />
                </div>
              </div>
            </RemovableFieldRow>
          ))}
        </ul>
      )}
    </section>
  );
}
