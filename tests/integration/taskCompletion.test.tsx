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

describe('Task Completion status pills', () => {
  it('prints Yes and No for the goal and condition pills', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Main Goal'), 'Close all Q3 tickets');
    await user.click(screen.getByRole('button', { name: '+ Add Condition' }));
    await user.type(screen.getByLabelText('Condition 1 text'), 'Check revenue');

    const goalStatus = screen.getByRole('group', { name: 'Main goal status' });
    const conditionStatus = screen.getByRole('group', { name: 'Condition 1 status' });

    await user.click(within(goalStatus).getByRole('button', { name: 'Yes' }));
    await user.click(within(conditionStatus).getByRole('button', { name: 'No' }));

    const output = screen.getByTestId('task-completion-output').textContent ?? '';
    expect(output).toContain('Main Goal fulfilled? (Close all Q3 tickets): Yes');
    expect(output).toContain('Condition 1 (Check revenue): No');
    expect(output).not.toContain('Fully Complete');
    expect(output).not.toContain('Not at all Complete');

    await user.click(within(goalStatus).getByRole('button', { name: 'No' }));
    await user.click(within(conditionStatus).getByRole('button', { name: 'Yes' }));

    const updated = screen.getByTestId('task-completion-output').textContent ?? '';
    expect(updated).toContain('Main Goal fulfilled? (Close all Q3 tickets): No');
    expect(updated).toContain('Condition 1 (Check revenue): Yes');
  });
});

describe('Infrastructure issues', () => {
  it('records an issue with two fields and prints it in the requested template', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByLabelText('Infrastructure issue 1 attempted action')).toBeNull();

    await user.click(screen.getByRole('button', { name: '+ Add Issue' }));
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 attempted action'),
      'open the CRM ticket',
    );
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 failure'),
      'the tool returned a 403',
    );

    expect(screen.getByTestId('task-completion-output').textContent).toContain(
      'Agent tries to open the CRM ticket but the tool returned a 403',
    );
  });

  it('moves the issues between the separate list and the justification', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '+ Add Issue' }));
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 attempted action'),
      'open the CRM ticket',
    );
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 failure'),
      'the tool returned a 403',
    );

    const output = () => screen.getByTestId('task-completion-output').textContent ?? '';
    const separateList = screen.getByRole('group', { name: 'Separate infrastructure list' });

    expect(output()).toContain('Justification: Agent tries to open the CRM ticket but the tool returned a 403');
    expect(output()).not.toContain('Infrastructure/tool call issues:');

    await user.click(within(separateList).getByRole('button', { name: 'Yes' }));

    expect(output()).toContain('Infrastructure/tool call issues:');
    expect(output()).toContain('• Agent tries to open the CRM ticket but the tool returned a 403');

    await user.click(within(separateList).getByRole('button', { name: 'No' }));

    expect(output()).not.toContain('Infrastructure/tool call issues:');
    expect(output()).toContain('Justification: Agent tries to open the CRM ticket but the tool returned a 403');
  });

  it('shows the folded issues above the justification text and prints them first', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '+ Add Issue' }));
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 attempted action'),
      'open the CRM ticket',
    );
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 failure'),
      'the tool returned a 403',
    );

    expect(screen.getByTestId('justification-issue-prefix').textContent).toContain(
      'Agent tries to open the CRM ticket but the tool returned a 403',
    );

    await user.type(screen.getByLabelText('Justification'), 'Tickets stayed open.');

    const output = screen.getByTestId('task-completion-output').textContent ?? '';
    const issueAt = output.indexOf('Agent tries to open the CRM ticket');
    const textAt = output.indexOf('Tickets stayed open.');

    expect(issueAt).toBeGreaterThan(-1);
    expect(textAt).toBeGreaterThan(issueAt);

    await user.click(
      within(screen.getByRole('group', { name: 'Separate infrastructure list' })).getByRole(
        'button',
        { name: 'Yes' },
      ),
    );

    expect(screen.queryByTestId('justification-issue-prefix')).toBeNull();
  });

  it('persists the issues and the separate-list answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '+ Add Issue' }));
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 attempted action'),
      'open the CRM ticket',
    );
    await user.type(
      screen.getByLabelText('Infrastructure issue 1 failure'),
      'the tool returned a 403',
    );
    await user.click(
      within(screen.getByRole('group', { name: 'Separate infrastructure list' })).getByRole(
        'button',
        { name: 'Yes' },
      ),
    );

    const stored = JSON.parse(localStorage.getItem('ba.evaluation.v1') ?? '{}') as {
      taskCompletion?: {
        separateInfrastructureList?: boolean;
        infrastructureIssues?: { action: string; failure: string }[];
      };
    };

    expect(stored.taskCompletion?.separateInfrastructureList).toBe(true);
    expect(stored.taskCompletion?.infrastructureIssues).toEqual([
      { action: 'open the CRM ticket', failure: 'the tool returned a 403' },
    ]);
  });

  it('removes an issue row and keeps the remaining rows numbered', async () => {
    const user = userEvent.setup();
    render(<App />);

    const addIssue = screen.getByRole('button', { name: '+ Add Issue' });
    await user.click(addIssue);
    await user.click(addIssue);
    await user.type(
      screen.getByLabelText('Infrastructure issue 2 attempted action'),
      'read the attached spreadsheet',
    );
    await user.type(
      screen.getByLabelText('Infrastructure issue 2 failure'),
      'the file did not load',
    );

    await user.click(screen.getByRole('button', { name: 'Remove infrastructure issue 1' }));

    expect(screen.queryByLabelText('Infrastructure issue 2 attempted action')).toBeNull();
    expect(fieldValue('Infrastructure issue 1 attempted action')).toBe(
      'read the attached spreadsheet',
    );
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
        name: 'No',
      }),
    );
    await user.click(screen.getByRole('radio', { name: '5/5 Fully Complete' }));
    await user.type(screen.getByLabelText('Justification'), 'All conditions met.');

    const output = screen.getByTestId('task-completion-output').textContent ?? '';
    expect(output).toContain('Main Goal fulfilled? (Close all Q3 tickets): Yes');
    expect(output).toContain('Condition 1 (Check revenue): No');

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
    expect(screen.getByTestId('task-completion-output').textContent).toContain(
      'Main Goal fulfilled? (Close all Q3 tickets): Yes',
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
