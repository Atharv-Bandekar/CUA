/**
 * Final summary across all four sections. Pure TypeScript only — no React, DOM
 * or browser APIs.
 */
import { type FactualityRating, factualityRatingLabel } from './factualAccuracy';
import { type ResponseExperienceRating, responseExperienceRatingLabel } from './responseExperience';
import { type TaskCompletionRating, taskCompletionRatingLabel } from './taskCompletion';

export type ResponseLabel = 'A' | 'B';

export interface FinalSummaryInput {
  taskCompletion: { finalRating: TaskCompletionRating | '' };
  worldFactCorrectness: { finalRating: FactualityRating | '' };
  accountFactuality: { finalRating: FactualityRating | '' };
  responseExperience: { rating: ResponseExperienceRating | '' };
}

/** Compiles the four output rating labels for the A/B response being scored. */
export function formatFinalSummary(
  input: FinalSummaryInput,
  responseLabel: ResponseLabel = 'A',
): string {
  return [
    `Response ${responseLabel} Scores:`,
    `- Task Completion: ${taskCompletionRatingLabel(input.taskCompletion.finalRating)}`,
    `- World Fact Correctness: ${factualityRatingLabel(input.worldFactCorrectness.finalRating)}`,
    `- Account Factuality: ${factualityRatingLabel(input.accountFactuality.finalRating)}`,
    `- Response Experience: ${responseExperienceRatingLabel(input.responseExperience.rating)}`,
  ].join('\n');
}
