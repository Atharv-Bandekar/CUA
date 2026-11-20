import { ListChecks, Plus } from 'lucide-react';
import type { TaskCompletionSlice } from '../domain/types';
import { TASK_COMPLETION_SCALE } from '../domain/ratings';
import { createRepeatableItem, removeItem, updateItem } from '../state/items';
import { RatingSelector } from './RatingSelector';
import { RemovableFieldRow } from './RemovableFieldRow';
import { SectionCard } from './SectionCard';

export interface TaskCompletionSectionProps {
  value: TaskCompletionSlice;
  onChange: (patch: Partial<TaskCompletionSlice>) => void;
}

export function TaskCompletionSection({ value, onChange }: TaskCompletionSectionProps) {
  return (
    <SectionCard
      icon={<ListChecks size={16} />}
      title="Task Completion"
      description="How much of the assigned task set was delivered."
    >
      <RatingSelector
        label="Rating"
        value={value.rating}
        scale={TASK_COMPLETION_SCALE}
        onChange={(rating) => onChange({ rating })}
      />

      <div className="h-px bg-line" role="presentation" />

      <fieldset className="min-w-0 space-y-1.5">
        <legend className="field-label">Completed tasks</legend>

        <ul className="space-y-1.5">
          {value.completedTasks.map((item, index) => (
            <RemovableFieldRow
              key={item.id}
              label="completed task"
              index={index + 1}
              onRemove={() => onChange({ completedTasks: removeItem(value.completedTasks, item.id) })}
            >
              <input
                type="text"
                className="field-input"
                value={item.value}
                placeholder="e.g. Rebuilt the Q3 comparison"
                aria-label={`Completed task ${index + 1}`}
                onChange={(event) =>
                  onChange({
                    completedTasks: updateItem(value.completedTasks, item.id, {
                      value: event.target.value,
                    }),
                  })
                }
              />
            </RemovableFieldRow>
          ))}
        </ul>

        <button
          type="button"
          className="add-button"
          onClick={() => onChange({ completedTasks: [...value.completedTasks, createRepeatableItem()] })}
        >
          <Plus aria-hidden="true" size={12} />
          Add task
        </button>
      </fieldset>

      <div className="min-w-0 space-y-1.5">
        <label className="field-label block" htmlFor="task-notes">
          Notes
        </label>
        <textarea
          id="task-notes"
          className="field-input resize-y"
          rows={3}
          value={value.notes}
          placeholder="Anything missed or blocked?"
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>
    </SectionCard>
  );
}
