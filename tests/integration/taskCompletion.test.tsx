// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { evaluationStore } from '../../src/state/useEvaluationStore';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  evaluationStore.reset();
});

afterEach(() => {
  cleanup();
  evaluationStore.reset();
});

function fieldValue(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

describe('Task Completion conditions', () => {
  it('adds condition rows and re-numbers them after a delete', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryAllByLabelText(/^Condition \d+ text$/)).toHaveLength(0);

    const addCondition = screen.getByRole('button', { name: '+ Add Condition' });
    await user.click(addCondition);
    await user.click(addCondition);

    expect(screen.getByLabelText('Condition 1 text')).not.toBeNull();
    expect(screen.getByLabelText('Condition 2 text')).not.toBeNull();

    await user.type(screen.getByLabelText('Condition 1 text'), 'Check revenue');
    await user.type(screen.getByLabelText('Condition 2 text'), 'Review churn');

    expect(screen.getByTestId('task-completion-output').textContent).toContain(
      'Condition 1 (Check revenue)',
    );
    expect(screen.getByTestId('task-completion-output').textContent).toContain(
      'Condition 2 (Review churn)',
    );

    await user.click(screen.getByRole('button', { name: 'Remove condition 1' }));

    expect(screen.queryByLabelText('Condition 2 text')).toBeNull();
    expect(fieldValue('Condition 1 text')).toBe('Review churn');

    const output = screen.getByTestId('task-completion-output').textContent ?? '';
    expect(output).toContain('Condition 1 (Review churn)');
    expect(output).not.toContain('Condition 2 (');
  });

  it('keeps the conditions count in sync with the rows', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '+ Add Condition' }));
    await user.click(screen.getByRole('button', { name: '+ Add Condition' }));
    await user.click(screen.getByRole('button', { name: '+ Add Condition' }));

    expect(screen.getByText('3 conditions')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Remove condition 2' }));

    expect(screen.getByText('2 conditions')).not.toBeNull();
    expect(fieldValue('Condition 1 text')).toBe('');
    expect(fieldValue('Condition 2 text')).toBe('');
  });
});

describe('Clear All', () => {
  it('resets every section and restores it through the Undo toast', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Main Goal'), 'Close all Q3 tickets');
    await user.click(
      within(screen.getByRole('group', { name: 'Main goal status' })).getByRole('button', {
        name: 'Yes',
      }),
    );
    await user.click(screen.getByRole('button', { name: '+ Add Condition' }));
    await user.type(screen.getByLabelText('Condition 1 text'), 'Check revenue');
    await user.click(
      within(screen.getByRole('group', { name: 'Condition 1 status' })).getByRole('button', {
        name: 'Partial',
      }),
    );
    await user.click(screen.getByRole('radio', { name: '5/5 Fully Complete' }));
    await user.type(screen.getByLabelText('Justification'), 'All conditions met.');

    const output = screen.getByTestId('task-completion-output').textContent ?? '';
    expect(output).toContain('Main Goal fulfilled? (Close all Q3 tickets): Fully Complete');
    expect(output).toContain('Condition 1 (Check revenue): Partially Complete');

    await user.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(fieldValue('Main Goal')).toBe('');
    expect(screen.queryByLabelText('Condition 1 text')).toBeNull();
    expect(screen.getByText('Worksheet cleared.')).not.toBeNull();
    expect(evaluationStore.getState().taskCompletion.finalRating).toBe('');
    expect(evaluationStore.getState().taskCompletion.justification).toBe('');

    await user.click(screen.getByRole('button', { name: /Undo/ }));

    expect(fieldValue('Main Goal')).toBe('Close all Q3 tickets');
    expect(fieldValue('Condition 1 text')).toBe('Check revenue');
    expect(screen.queryByText('Worksheet cleared.')).toBeNull();
    expect(screen.getByTestId('task-completion-output').textContent).toContain(
      'Final Rating: Fully Complete',
    );
  });

  it('persists the cleared worksheet to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Main Goal'), 'Temporary goal');
    await user.click(screen.getByRole('button', { name: 'Clear All' }));

    const stored = localStorage.getItem('ba.evaluation.v1');
    expect(stored).not.toBeNull();
    expect(stored).toContain('"mainGoal":""');
  });
});
