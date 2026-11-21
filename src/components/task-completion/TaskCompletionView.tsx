import { Sparkles } from 'lucide-react';
import { pluralize } from '../../domain/format';
import {
  taskCompletionRatingLabel,
  type TaskCompletionCondition,
} from '../../domain/taskCompletion';
import { evaluationStore, useEvaluationStore } from '../../state/useEvaluationStore';
import { RemovableFieldRow } from '../RemovableFieldRow';
import { FinalRatingTrack } from './FinalRatingTrack';
import { InfrastructureIssuesSection } from './InfrastructureIssuesSection';
import { StatusPills } from './StatusPills';
import { TaskCompletionPreview } from './TaskCompletionPreview';

export function TaskCompletionView() {
  const { taskCompletion } = useEvaluationStore();
  const conditions = taskCompletion.conditions;
  // The justification is plain text. With no separate list it is the only place
  // the issues are described, so Add Issue writes the template straight into it
  // and nothing has to be composed or parsed back.
  const justificationValue = taskCompletion.justification;

  function addCondition(): void {
    evaluationStore.updateTaskCompletion({
      conditions: [...conditions, { text: '', status: '' }],
    });
  }

  function updateCondition(index: number, patch: Partial<TaskCompletionCondition>): void {
    evaluationStore.updateTaskCompletion({
      conditions: conditions.map((condition, position) =>
        position === index ? { ...condition, ...patch } : condition,
      ),
    });
  }

  function removeCondition(index: number): void {
    evaluationStore.updateTaskCompletion({
      conditions: conditions.filter((_condition, position) => position !== index),
    });
  }

  function insertStarter(): void {
    if (taskCompletion.finalRating === '') {
      return;
    }

    const starter = `I have rated the response as ${taskCompletionRatingLabel(taskCompletion.finalRating)} as the agent has `;
    const existing = taskCompletion.justification;
    evaluationStore.updateTaskCompletion({
      justification:
        existing.trim() === '' ? starter : `${existing.replace(/\s+$/, '')} ${starter}`,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="card min-w-0 p-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="task-main-goal" className="field-label">
            Main Goal
          </label>
          <span className="text-[11px] text-muted">
            {pluralize(conditions.length, 'condition')}
          </span>
        </div>

        <div className="mt-1.5 flex items-stretch gap-2">
          <textarea
            id="task-main-goal"
            rows={1}
            className="field-input min-w-0 flex-1 resize-none"
            placeholder="What was the agent asked to do?"
            value={taskCompletion.mainGoal}
            onChange={(event) =>
              evaluationStore.updateTaskCompletion({ mainGoal: event.target.value })
            }
          />
          <button
            type="button"
            onClick={addCondition}
            className="add-button shrink-0 whitespace-nowrap"
          >
            + Add Condition
          </button>
        </div>

        <div className="mt-2.5">
          <StatusPills
            label="Main goal status"
            value={taskCompletion.mainGoalStatus}
            onChange={(mainGoalStatus) =>
              evaluationStore.updateTaskCompletion({ mainGoalStatus })
            }
          />
        </div>
      </section>

      <section className="card min-w-0 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="field-label">Conditions</h2>
          <span className="text-[11px] text-muted">
            {conditions.length === 0 ? 'None yet' : 'Numbered automatically'}
          </span>
        </div>

        {conditions.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
            No conditions yet. Use Add Condition beside the main goal.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {conditions.map((condition, index) => (
              <RemovableFieldRow
                key={index}
                label="condition"
                index={index + 1}
                onRemove={() => removeCondition(index)}
              >
                <div className="min-w-0 space-y-2 rounded-lg border border-line bg-canvas p-2.5">
                  <span className="field-label">Condition {index + 1}</span>
                  <textarea
                    rows={1}
                    className="field-input resize-none"
                    aria-label={`Condition ${index + 1} text`}
                    placeholder="What needed to be true?"
                    value={condition.text}
                    onChange={(event) => updateCondition(index, { text: event.target.value })}
                  />
                  <StatusPills
                    label={`Condition ${index + 1} status`}
                    value={condition.status}
                    onChange={(status) => updateCondition(index, { status })}
                  />
                </div>
              </RemovableFieldRow>
            ))}
          </ul>
        )}
      </section>

      <InfrastructureIssuesSection
        issues={taskCompletion.infrastructureIssues}
        justification={taskCompletion.justification}
        separateList={taskCompletion.separateInfrastructureList}
      />

      <section className="card min-w-0 space-y-3 p-4">
        <h2 className="field-label">Final Rating</h2>
        <FinalRatingTrack
          value={taskCompletion.finalRating}
          onChange={(finalRating) => evaluationStore.updateTaskCompletion({ finalRating })}
        />

        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="task-justification" className="field-label">
              Justification
            </label>
            <button
              type="button"
              onClick={insertStarter}
              disabled={taskCompletion.finalRating === ''}
              title={
                taskCompletion.finalRating === ''
                  ? 'Select a final rating first'
                  : `I have rated the response as ${taskCompletionRatingLabel(taskCompletion.finalRating)} as the agent has `
              }
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel-raised px-2 py-1 text-[10px] font-medium text-muted transition hover:border-accent/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles aria-hidden="true" size={11} />
              Starter
            </button>
          </div>
          <textarea
            id="task-justification"
            className="field-input resize-none"
            rows={3}
            placeholder="Why did the response earn this rating?"
            value={justificationValue}
            onChange={(event) =>
              evaluationStore.updateTaskCompletion({ justification: event.target.value })
            }
          />
        </div>
      </section>

      <TaskCompletionPreview state={taskCompletion} />
    </div>
  );
}
