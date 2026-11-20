import { describe, expect, it } from 'vitest';
import {
  TASK_COMPLETION_OPTIONS,
  TASK_COMPLETION_RATINGS,
  TASK_COMPLETION_STATUSES,
  TASK_COMPLETION_STATUS_RATINGS,
  formatInfrastructureIssue,
  formatTaskCompletion,
  infrastructureIssueLines,
  justificationDraft,
  justificationFieldText,
  taskCompletionRatingLabel,
  taskCompletionStatusLabel,
} from '../../src/domain/taskCompletion';
import type { InfrastructureIssue, TaskCompletionState } from '../../src/domain/taskCompletion';

const state: TaskCompletionState = {
  mainGoal: 'Close all Q3 tickets',
  mainGoalStatus: '5/5',
  conditions: [
    { text: 'Check revenue figures', status: '5/5' },
    { text: 'Review churn notes', status: '1/5' },
  ],
  finalRating: '5/5',
  justification: 'All tickets closed and verified.',
  separateInfrastructureList: false,
  infrastructureIssues: [],
};

const infrastructureIssues: InfrastructureIssue[] = [
  { action: 'open the CRM ticket', failure: 'the tool returned a 403', at: 0 },
  { action: 'read the attached spreadsheet', failure: 'the file did not load', at: 0 },
];

describe('task completion rating options', () => {
  it('maps every scale position to its output text', () => {
    expect(TASK_COMPLETION_RATINGS).toEqual({
      '5/5': 'Fully Complete',
      '4/5': 'Mostly Complete',
      '3/5': 'Partially Complete',
      '2/5': 'Minimally Complete',
      '1/5': 'Not at all Complete',
    });
  });

  it('exposes options best-first for the UI', () => {
    expect(TASK_COMPLETION_OPTIONS).toEqual([
      { value: '5/5', label: 'Fully Complete' },
      { value: '4/5', label: 'Mostly Complete' },
      { value: '3/5', label: 'Partially Complete' },
      { value: '2/5', label: 'Minimally Complete' },
      { value: '1/5', label: 'Not at all Complete' },
    ]);
  });

  it('renders an explicit fallback for an unselected rating', () => {
    expect(taskCompletionRatingLabel('')).toBe('[Not Rated]');
    expect(taskCompletionRatingLabel('2/5')).toBe('Minimally Complete');
  });

  it('maps the goal and condition statuses to Yes / No text', () => {
    expect(TASK_COMPLETION_STATUS_RATINGS).toEqual({
      '5/5': 'Yes',
      '4/5': 'Yes',
      '3/5': 'Partial',
      '2/5': 'No',
      '1/5': 'No',
    });
    expect(TASK_COMPLETION_STATUSES).toEqual([
      { value: '5/5', label: 'Yes' },
      { value: '1/5', label: 'No' },
    ]);
  });

  it('labels statuses with Yes / No instead of the completion scale', () => {
    expect(taskCompletionStatusLabel('5/5')).toBe('Yes');
    expect(taskCompletionStatusLabel('1/5')).toBe('No');
    expect(taskCompletionStatusLabel('')).toBe('[Not Rated]');
  });
});

describe('formatTaskCompletion', () => {
  it('compiles the main goal, numbered conditions, rating and justification', () => {
    expect(formatTaskCompletion(state)).toBe(
      [
        'Main Goal fulfilled? (Close all Q3 tickets): Yes',
        '',
        'Condition 1 (Check revenue figures): Yes',
        '',
        'Condition 2 (Review churn notes): No',
        '',
        'Final Rating: Fully Complete',
        'Justification: All tickets closed and verified.',
      ].join('\n'),
    );
  });

  it('re-numbers conditions from the array index', () => {
    const output = formatTaskCompletion({
      ...state,
      conditions: [
        { text: 'First', status: '5/5' },
        { text: 'Second', status: '1/5' },
        { text: 'Third', status: '5/5' },
      ],
    });

    expect(output).toContain('Condition 1 (First): Yes');
    expect(output).toContain('Condition 2 (Second): No');
    expect(output).toContain('Condition 3 (Third): Yes');
    expect(output).not.toContain('Condition 4');
  });

  it('never outputs the numeric (x/5) rating prefix', () => {
    const output = formatTaskCompletion(state);
    expect(output).not.toMatch(/\d\/5/);
  });

  it('renders unselected statuses and rating as [Not Rated]', () => {
    const output = formatTaskCompletion({
      mainGoal: 'Draft the summary',
      mainGoalStatus: '',
      conditions: [{ text: 'Gather inputs', status: '' }],
      finalRating: '',
      justification: '',
      separateInfrastructureList: false,
      infrastructureIssues: [],
    });

    expect(output).toBe(
      [
        'Main Goal fulfilled? (Draft the summary): [Not Rated]',
        '',
        'Condition 1 (Gather inputs): [Not Rated]',
        '',
        'Final Rating: [Not Rated]',
        'Justification: ',
      ].join('\n'),
    );
  });
});

describe('infrastructure issues', () => {
  it('formats one issue as "Agent tries to … but …"', () => {
    expect(formatInfrastructureIssue(infrastructureIssues[0])).toBe(
      'Agent tries to open the CRM ticket but the tool returned a 403',
    );
  });

  it('collapses blank slots instead of printing doubled spaces', () => {
    expect(formatInfrastructureIssue({ action: 'open the CRM ticket', failure: '  ', at: 0 })).toBe(
      'Agent tries to open the CRM ticket but',
    );
    expect(formatInfrastructureIssue({ action: '', failure: 'the file did not load', at: 0 })).toBe(
      'Agent tries to but the file did not load',
    );
  });

  it('returns an empty string for a row that has not been filled in', () => {
    expect(formatInfrastructureIssue({ action: '   ', failure: '', at: 0 })).toBe('');
  });

  it('adds a separate bulleted block below the justification when the list is separate', () => {
    const output = formatTaskCompletion({
      ...state,
      separateInfrastructureList: true,
      infrastructureIssues,
    });

    expect(
      output.endsWith(
        [
          'Final Rating: Fully Complete',
          'Justification: All tickets closed and verified.',
          '',
          'Infrastructure/tool call issues:',
          '• Agent tries to open the CRM ticket but the tool returned a 403',
          '• Agent tries to read the attached spreadsheet but the file did not load',
        ].join('\n'),
      ),
    ).toBe(true);
  });

  it('folds the issues above the justification text when the list is not separate', () => {
    const output = formatTaskCompletion({ ...state, infrastructureIssues });

    expect(
      output.endsWith(
        [
          'Final Rating: Fully Complete',
          'Justification: Agent tries to open the CRM ticket but the tool returned a 403 ' +
            'Agent tries to read the attached spreadsheet but the file did not load ' +
            'All tickets closed and verified.',
        ].join('\n'),
      ),
    ).toBe(true);
    expect(output).not.toContain('Infrastructure/tool call issues:');
  });

  it('keeps the issues first when the justification is typed after them', () => {
    const output = formatTaskCompletion({
      ...state,
      justification: '  I rated this Fully Complete because every ticket was closed.  ',
      infrastructureIssues,
    });

    const issueAt = output.indexOf('Agent tries to open the CRM ticket');
    const textAt = output.indexOf('I rated this Fully Complete');

    expect(issueAt).toBeGreaterThan(-1);
    expect(textAt).toBeGreaterThan(issueAt);
    expect(output).toContain(
      'Justification: Agent tries to open the CRM ticket but the tool returned a 403',
    );
  });

  it('returns the printable issue lines for the justification field', () => {
    expect(infrastructureIssueLines(infrastructureIssues)).toEqual([
      'Agent tries to open the CRM ticket but the tool returned a 403',
      'Agent tries to read the attached spreadsheet but the file did not load',
    ]);
    expect(infrastructureIssueLines([{ action: '', failure: ' ', at: 0 }])).toEqual([]);
  });

  it('shows the folded issues at the top of the justification field value', () => {
    expect(justificationFieldText(infrastructureIssues, '', false)).toBe(
      'Agent tries to open the CRM ticket but the tool returned a 403 ' +
        'Agent tries to read the attached spreadsheet but the file did not load ',
    );
    expect(justificationFieldText(infrastructureIssues, 'All tickets closed.', false)).toBe(
      'Agent tries to open the CRM ticket but the tool returned a 403 ' +
        'Agent tries to read the attached spreadsheet but the file did not load ' +
        'All tickets closed.',
    );
    expect(justificationFieldText(infrastructureIssues, 'All tickets closed.', true)).toBe(
      'All tickets closed.',
    );
    expect(justificationFieldText([], 'All tickets closed.', false)).toBe('All tickets closed.');
  });

  it('keeps a new issue below the justification text already written', () => {
    const typed = 'Tickets stayed open.';
    const issue = { ...infrastructureIssues[0], at: typed.length };

    expect(justificationFieldText([issue], typed, false)).toBe(
      `${typed} Agent tries to open the CRM ticket but the tool returned a 403 `,
    );
  });

  it('splices the issues around the typed text in the order they were added', () => {
    const typed = 'Tickets stayed open.';
    const issues = [
      { ...infrastructureIssues[0], at: 0 },
      { ...infrastructureIssues[1], at: typed.length },
    ];

    expect(justificationFieldText(issues, typed, false)).toBe(
      'Agent tries to open the CRM ticket but the tool returned a 403 ' +
        'Tickets stayed open. ' +
        'Agent tries to read the attached spreadsheet but the file did not load ',
    );
  });

  it('keeps text typed after a generated line apart from the text before it', () => {
    const issue = { ...infrastructureIssues[0], at: 'First.'.length };
    const field = justificationFieldText([issue], 'First. Second.', false);
    const draft = justificationDraft(field, [issue], false);

    expect(field).toBe('First. Agent tries to open the CRM ticket but the tool returned a 403 Second.');
    expect(draft.typed).toBe('First. Second.');
    expect(draft.issues).toEqual([issue]);
  });

  it('recovers the typed text and the issue positions from the field value', () => {
    const typed = 'Tickets stayed open.';
    const issues = [
      { ...infrastructureIssues[0], at: 0 },
      { ...infrastructureIssues[1], at: typed.length },
    ];
    const field = justificationFieldText(issues, typed, false);
    const draft = justificationDraft(field, issues, false);

    expect(draft.typed).toBe(typed);
    expect(draft.issues.map((issue) => issue.at)).toEqual([0, typed.length]);
    expect(justificationFieldText(draft.issues, draft.typed, false)).toBe(field);
  });

  it('reads an empty field back as untouched typed text', () => {
    const folded = justificationFieldText(infrastructureIssues, 'All tickets closed.', false);

    expect(justificationDraft(folded, infrastructureIssues, false).typed).toBe(
      'All tickets closed.',
    );
    expect(
      justificationDraft(justificationFieldText(infrastructureIssues, '', false), infrastructureIssues, false)
        .typed,
    ).toBe('');
    expect(justificationDraft(folded, infrastructureIssues, true).typed).toBe(folded);
    expect(justificationDraft('Only my text.', [], false)).toEqual({
      typed: 'Only my text.',
      issues: [],
    });
  });

  it('prints the issues on the justification line when no justification was typed', () => {
    const output = formatTaskCompletion({
      ...state,
      justification: '',
      infrastructureIssues: [infrastructureIssues[0]],
    });

    expect(output).toContain('Justification: Agent tries to open the CRM ticket but the tool returned a 403');
  });

  it('leaves the output untouched when every issue row is empty', () => {
    const output = formatTaskCompletion({
      ...state,
      separateInfrastructureList: true,
      infrastructureIssues: [{ action: '', failure: ' ', at: 0 }],
    });

    expect(output).toBe(formatTaskCompletion(state));
    expect(output).not.toContain('Infrastructure/tool call issues:');
  });
});
