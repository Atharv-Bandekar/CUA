// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { evaluationStore } from '../../src/state/useEvaluationStore';

type User = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  cleanup();
  localStorage.clear();
  evaluationStore.reset();
});

afterEach(() => {
  cleanup();
  evaluationStore.reset();
});

async function openSection(user: User, name: string): Promise<void> {
  await user.click(screen.getAllByRole('button', { name })[0]!);
}

describe('final summary', () => {
  it('compiles live scores from every scoring tab and highlights missing ones', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'Task Completion');
    await user.click(screen.getByRole('radio', { name: '4/5 Mostly Complete' }));

    await openSection(user, 'World Fact Correctness');
    await user.click(screen.getByRole('radio', { name: '5/5 Completely Accurate' }));

    await openSection(user, 'Final Summary');

    expect(screen.getByTestId('summary-row-taskCompletion').textContent).toContain(
      'Mostly Complete',
    );
    expect(screen.getByTestId('summary-row-worldFactCorrectness').textContent).toContain(
      'Completely Accurate',
    );
    expect(
      screen.getByTestId('summary-row-taskCompletion').getAttribute('data-missing'),
    ).toBe('false');
    expect(
      screen.getByTestId('summary-row-accountFactuality').getAttribute('data-missing'),
    ).toBe('true');

    const output = screen.getByTestId('final-summary-output').textContent ?? '';
    expect(output).toContain('Response A Scores:');
    expect(output).toContain('- Task Completion: Mostly Complete');
    expect(output).toContain('- Account Factuality: [Not Rated]');
    expect(screen.getByRole('button', { name: 'Copy Final Summary' })).not.toBeNull();

    await openSection(user, 'Account Factuality');
    await user.click(screen.getByRole('radio', { name: '3/5 Mixed Accuracy' }));

    await openSection(user, 'Final Summary');

    expect(screen.getByTestId('summary-row-accountFactuality').textContent).toContain(
      'Mixed Accuracy',
    );
    expect(
      screen.getByTestId('summary-row-accountFactuality').getAttribute('data-missing'),
    ).toBe('false');
    expect(screen.getByTestId('final-summary-output').textContent).toContain(
      '- Account Factuality: Mixed Accuracy',
    );
  });

  it('defaults to response A and switches the compiled heading to B', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'Final Summary');

    expect(screen.getByTestId('final-summary-output').textContent).toContain(
      'Response A Scores:',
    );
    expect(
      screen.getByRole('button', { name: 'Response A' }).getAttribute('aria-pressed'),
    ).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Response B' }));

    expect(
      screen.getByRole('button', { name: 'Response B' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByTestId('final-summary-output').textContent).toContain(
      'Response B Scores:',
    );
    expect(screen.getByTestId('final-summary-output').textContent).not.toContain(
      'Response A Scores:',
    );
  });
});
