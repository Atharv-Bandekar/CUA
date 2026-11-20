/**
 * Response experience domain: rating options and the compiled output block.
 * Pure TypeScript only — no React, DOM or browser APIs.
 */
import { type RatingOption, ratingOptionLabel, ratingOptions } from './ratingOptions';

export type ResponseExperienceRating = '1/5' | '2/5' | '3/5' | '4/5' | '5/5';

/** Stored value → output text. The (x/5) prefix is never printed. */
export const RESPONSE_EXPERIENCE_RATINGS: Record<ResponseExperienceRating, string> = {
  '5/5': 'Cannot be improved',
  '4/5': 'Minor room for improvement',
  '3/5': 'Okay',
  '2/5': 'Pretty Bad',
  '1/5': 'Horrible',
};

const RESPONSE_EXPERIENCE_ORDER: readonly ResponseExperienceRating[] = [
  '5/5',
  '4/5',
  '3/5',
  '2/5',
  '1/5',
];

export const RESPONSE_EXPERIENCE_OPTIONS: readonly RatingOption<ResponseExperienceRating>[] =
  ratingOptions(RESPONSE_EXPERIENCE_RATINGS, RESPONSE_EXPERIENCE_ORDER);

/**
 * Justification seeded when the response is rated Cannot be improved. The
 * `[placeholder]` is left for the reviewer to replace with the subject.
 */
export const RESPONSE_EXPERIENCE_CANNOT_IMPROVE_JUSTIFICATION =
  'I have rated the response as Cannot be improved as the agent has used concise language by conveying about [placeholder] without unnecessary details. It has no redundant content in its response & The language used is natural as there is use of the pronoun "I". The content is well-formatted using bullet points.';

export interface ResponseExperiencePoint {
  text: string;
}

export interface ResponseExperienceState {
  rating: ResponseExperienceRating | '';
  justification: string;
  expectedPoints: ResponseExperiencePoint[];
  actualPoints: ResponseExperiencePoint[];
}

export function responseExperienceRatingLabel(rating: ResponseExperienceRating | ''): string {
  return ratingOptionLabel(RESPONSE_EXPERIENCE_RATINGS, rating);
}

/**
 * Justification to write when a rating is picked, or `null` when the existing
 * text should be left alone.
 */
export function responseExperienceJustificationForRating(
  rating: ResponseExperienceRating | '',
): string | null {
  return rating === '5/5' ? RESPONSE_EXPERIENCE_CANNOT_IMPROVE_JUSTIFICATION : null;
}

function bullet(point: ResponseExperiencePoint): string {
  return `• ${point.text.trim()}`;
}

/**
 * A perfect score needs no improvement notes, so it compiles to the rating and
 * justification only. Every other rating compiles expected/actual bullets.
 */
export function formatResponseExperience(state: ResponseExperienceState): string {
  const ratingLine = `Rating: ${responseExperienceRatingLabel(state.rating)}`;

  if (state.rating === '5/5') {
    return [ratingLine, `Justification: ${state.justification}`].join('\n');
  }

  return [
    ratingLine,
    'Expected:',
    ...state.expectedPoints.map(bullet),
    '',
    'Actual:',
    ...state.actualPoints.map(bullet),
  ].join('\n');
}
