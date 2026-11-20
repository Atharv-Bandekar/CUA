// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
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

describe('factuality justification builder', () => {
  it('compiles claims, sources and dual outputs for a section', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'World Fact Correctness');
    expect(screen.getByText('0 claims')).not.toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'Add Claim' })[0]!);
    await user.type(screen.getByLabelText('Claim 1 text'), 'Q3 revenue grew 12%');
    await user.click(
      within(screen.getByRole('group', { name: 'Claim 1 accuracy' })).getByRole('button', {
        name: 'Accurate',
      }),
    );
    await user.click(
      within(screen.getByRole('group', { name: 'Claim 1 classification' })).getByRole('button', {
        name: 'Objective',
      }),
    );
    await user.type(screen.getByLabelText('Claim 1 justification'), 'Matches the 10-K.');
    await user.click(screen.getByRole('button', { name: 'Add Source' }));
    await user.type(screen.getByLabelText('Claim 1 source 1'), '10-K filing');

    await user.click(screen.getByRole('radio', { name: '5/5 Completely Accurate' }));
    await user.type(screen.getByLabelText('Final Justification'), 'All claims verified.');

    const output = screen.getByTestId('factuality-output').textContent ?? '';
    expect(output).toContain('Claim 1: Q3 revenue grew 12%');
    expect(output).toContain('Objective - Accurate');
    expect(output).toContain('Source 1: 10-K filing');
    expect(output).toContain('Final Rating: Completely Accurate');
    expect(output).toContain('Final Justification: All claims verified.');

    expect(screen.getByTestId('objective-claims-output').textContent).toBe(
      '• Q3 revenue grew 12%',
    );
    expect(screen.getByRole('button', { name: 'Copy justification' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Copy objective claims' })).not.toBeNull();
  });

  it('keeps the two factuality sections independent', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'World Fact Correctness');
    await user.click(screen.getAllByRole('button', { name: 'Add Claim' })[0]!);
    await user.type(screen.getByLabelText('Claim 1 text'), 'World claim');
    await user.click(screen.getByRole('radio', { name: '4/5 Mostly Accurate' }));

    await openSection(user, 'Account Factuality');
    expect(screen.queryByLabelText('Claim 1 text')).toBeNull();
    expect(screen.getByText('0 claims')).not.toBeNull();
    expect(
      screen.getByRole('radio', { name: '4/5 Mostly Accurate' }).getAttribute('aria-checked'),
    ).toBe('false');

    await openSection(user, 'World Fact Correctness');
    expect((screen.getByLabelText('Claim 1 text') as HTMLTextAreaElement).value).toBe(
      'World claim',
    );
    expect(
      screen.getByRole('radio', { name: '4/5 Mostly Accurate' }).getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('fills a claim justification from the Predefined dropdown', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'Account Factuality');
    await user.click(screen.getAllByRole('button', { name: 'Add Claim' })[0]!);

    const select = screen.getByLabelText('Claim 1 predefined justification') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.options[0]?.textContent).toBe('Predefined');
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '',
      "Agent's log confirms it.",
      "Agent's log and a screenshot in it confirm it.",
      "Agent's logs and screenshots in them confirm it.",
      "Agent's log and the content in it confirm it.",
      "Agent's logs and the content in them confirm it.",
    ]);

    await user.selectOptions(select, "Agent's logs and screenshots in them confirm it.");

    expect(
      (screen.getByLabelText('Claim 1 justification') as HTMLTextAreaElement).value,
    ).toBe("Agent's logs and screenshots in them confirm it.");
    expect(screen.getByTestId('factuality-output').textContent).toContain(
      "Justification: Agent's logs and screenshots in them confirm it.",
    );
    expect((select as HTMLSelectElement).value).toBe('');
  });

  it('seeds the cannot-assess justifications for each section', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'World Fact Correctness');
    await user.click(screen.getAllByRole('button', { name: 'Add Claim' })[0]!);
    await user.click(
      within(screen.getByRole('group', { name: 'Claim 1 accuracy' })).getByRole('button', {
        name: "Can't confidently assess",
      }),
    );
    expect(
      (screen.getByLabelText('Claim 1 justification') as HTMLTextAreaElement).value,
    ).toBe('No world fact can be checked for this claim.');

    await user.click(screen.getByRole('radio', { name: '1/5 Cannot Confidently Assess' }));
    expect((screen.getByLabelText('Final Justification') as HTMLTextAreaElement).value).toBe(
      'No world fact to check here.',
    );

    await openSection(user, 'Account Factuality');
    await user.click(screen.getAllByRole('button', { name: 'Add Claim' })[0]!);
    await user.click(
      within(screen.getByRole('group', { name: 'Claim 1 accuracy' })).getByRole('button', {
        name: "Can't confidently assess",
      }),
    );
    expect(
      (screen.getByLabelText('Claim 1 justification') as HTMLTextAreaElement).value,
    ).toBe('No tool call can be checked for this claim.');

    await user.click(screen.getByRole('radio', { name: '1/5 Cannot Confidently Assess' }));
    expect((screen.getByLabelText('Final Justification') as HTMLTextAreaElement).value).toBe(
      'No tool call to check here.',
    );
  });

  it('flags an empty final justification as required until it is written', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'World Fact Correctness');

    expect(screen.getByText('Required')).not.toBeNull();

    const textarea = screen.getByLabelText('Final Justification');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.className).toContain('border-warn/70');
    expect(
      screen.getByText('A final justification is required before this section is complete.'),
    ).not.toBeNull();

    await user.type(textarea, 'Verified against the filings.');

    expect(textarea.getAttribute('aria-invalid')).toBe('false');
    expect(textarea.className).not.toContain('border-warn/70');
    expect(
      screen.queryByText('A final justification is required before this section is complete.'),
    ).toBeNull();
  });
});

describe('response experience', () => {
  it('shows expected and actual lists unless the score is perfect', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openSection(user, 'Response Experience');

    expect(screen.getByRole('button', { name: 'Add Expected' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add Actual' })).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Add Expected' }));
    await user.type(screen.getByLabelText('Expected point 1'), 'Lead with the answer');

    expect(screen.getByTestId('response-experience-output').textContent).toContain(
      'Expected:\n• Lead with the answer',
    );

    await user.click(screen.getByRole('radio', { name: '5/5 Cannot be improved' }));

    expect(screen.queryByRole('button', { name: 'Add Expected' })).toBeNull();
    expect(screen.getByLabelText('Justification')).not.toBeNull();

    expect((screen.getByLabelText('Justification') as HTMLTextAreaElement).value).toBe(
      'I have rated the response as Cannot be improved as the agent has used concise language by conveying about [placeholder] without unnecessary details. It has no redundant content in its response & The language used is natural as there is use of the pronoun "I". The content is well-formatted using bullet points.',
    );

    await user.clear(screen.getByLabelText('Justification'));
    await user.type(screen.getByLabelText('Justification'), 'Nothing to add.');
    expect(screen.getByTestId('response-experience-output').textContent).toBe(
      ['Rating: Cannot be improved', 'Justification: Nothing to add.'].join('\n'),
    );
    expect(
      screen.getByRole('button', { name: 'Copy Response Experience' }),
    ).not.toBeNull();
  });
});
