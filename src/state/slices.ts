import type {
  AppState,
  JustificationSlice,
  ResponseExperienceSlice,
  TaskCompletionSlice,
} from '../domain/types';

export function createEmptyJustification(): JustificationSlice {
  return {
    rating: null,
    conditions: [],
    sources: [],
    expected: [],
    actual: [],
  };
}

export function createEmptyTaskCompletion(): TaskCompletionSlice {
  return {
    rating: null,
    completedTasks: [],
    notes: '',
  };
}

export function createEmptyResponseExperience(): ResponseExperienceSlice {
  return {
    rating: null,
    comment: '',
  };
}

export function createEmptyAppState(): AppState {
  return {
    taskCompletion: createEmptyTaskCompletion(),
    worldFactCorrectness: createEmptyJustification(),
    accountFactuality: createEmptyJustification(),
    responseExperience: createEmptyResponseExperience(),
  };
}
