/**
 * Factual accuracy domain, shared by World Fact Correctness and Account
 * Factuality. Pure TypeScript only — no React, DOM or browser APIs.
 */
import { type RatingOption, ratingOptionLabel, ratingOptions } from './ratingOptions';

export type FactualityRating = '1/5' | '2/5' | '3/5' | '4/5' | '5/5';

/** Stored value → output text. The (x/5) prefix is never printed. */
export const FACTUALITY_RATINGS: Record<FactualityRating, string> = {
  '5/5': 'Completely Accurate',
  '4/5': 'Mostly Accurate',
  '3/5': 'Mixed Accuracy',
  '2/5': 'Inaccurate',
  '1/5': 'Cannot Confidently Assess',
};

const FACTUALITY_ORDER: readonly FactualityRating[] = ['5/5', '4/5', '3/5', '2/5', '1/5'];

export const FACTUALITY_OPTIONS: readonly RatingOption<FactualityRating>[] = ratingOptions(
  FACTUALITY_RATINGS,
  FACTUALITY_ORDER,
);

export type ClaimClassification = 'Objective' | 'Subjective' | '';

export const CLAIM_CLASSIFICATIONS: readonly Exclude<ClaimClassification, ''>[] = [
  'Objective',
  'Subjective',
];

export type ClaimAccuracy =
  | 'Inaccurate'
  | 'Unsupported'
  | 'Disputed'
  | 'Accurate'
  | "Can't confidently assess"
  | '';

/** Accuracy choices in rising order, from least to most supportable. */
export const CLAIM_ACCURACIES: readonly Exclude<ClaimAccuracy, ''>[] = [
  'Inaccurate',
  'Unsupported',
  'Disputed',
  'Accurate',
  "Can't confidently assess",
];

export type FactualitySectionKind = 'worldFactCorrectness' | 'accountFactuality';

/** Accuracy value that rules out any checkable justification. */
export const CANNOT_ASSESS_ACCURACY: Exclude<ClaimAccuracy, ''> = "Can't confidently assess";

/**
 * Fixed justification openers offered by the Predefined dropdown, in the order
 * they are listed. Picking one replaces the claim's justification verbatim.
 */
export const CLAIM_JUSTIFICATION_PRESETS: readonly string[] = [
  "Agent's log confirms it.",
  "Agent's log and a screenshot in it confirm it.",
  "Agent's logs and screenshots in them confirm it.",
  "Agent's log and the content in it confirm it.",
  "Agent's logs and the content in them confirm it.",
];

/** Claim justification written when nothing checkable exists in the section. */
export const CLAIM_CANNOT_ASSESS_JUSTIFICATIONS: Record<FactualitySectionKind, string> = {
  worldFactCorrectness: 'No world fact can be checked for this claim.',
  accountFactuality: 'No tool call can be checked for this claim.',
};

/** Final justification written when the section cannot be confidently assessed. */
export const FINAL_CANNOT_ASSESS_JUSTIFICATIONS: Record<FactualitySectionKind, string> = {
  worldFactCorrectness: 'No world fact to check here.',
  accountFactuality: 'No tool call to check here.',
};

export interface ClaimSource {
  text: string;
}

export interface Claim {
  text: string;
  classification: ClaimClassification;
  accuracy: ClaimAccuracy;
  justification: string;
  sources: ClaimSource[];
}

export interface FactualAccuracyState {
  claims: Claim[];
  finalRating: FactualityRating | '';
  finalJustification: string;
}

export function createEmptyClaim(): Claim {
  return {
    text: '',
    classification: '',
    accuracy: '',
    justification: '',
    sources: [],
  };
}

export function createEmptyClaimSource(): ClaimSource {
  return { text: '' };
}

export function factualityRatingLabel(rating: FactualityRating | ''): string {
  return ratingOptionLabel(FACTUALITY_RATINGS, rating);
}

/**
 * Justification to write when a claim's accuracy is picked, or `null` when the
 * existing text should be left alone.
 */
export function claimJustificationForAccuracy(
  accuracy: ClaimAccuracy,
  section: FactualitySectionKind,
): string | null {
  return accuracy === CANNOT_ASSESS_ACCURACY ? CLAIM_CANNOT_ASSESS_JUSTIFICATIONS[section] : null;
}

/**
 * Final justification to write when the section rating is picked, or `null`
 * when the existing text should be left alone.
 */
export function finalJustificationForRating(
  rating: FactualityRating | '',
  section: FactualitySectionKind,
): string | null {
  return rating === '1/5' ? FINAL_CANNOT_ASSESS_JUSTIFICATIONS[section] : null;
}

function normalizeSingleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function classificationLine(claim: Claim): string {
  return [claim.classification, claim.accuracy].filter((part) => part !== '').join(' - ');
}

/**
 * Claim tally printed after the claim blocks. Every accuracy is listed, in
 * rising order, even when its count is zero.
 */
export function formatClaimSummary(claims: readonly Claim[]): string {
  const counts = CLAIM_ACCURACIES.map((accuracy) => {
    const count = claims.filter((claim) => claim.accuracy === accuracy).length;

    return `- ${count} ${accuracy}`;
  });

  return [`The response contains ${claims.length} claim(s):`, ...counts].join('\n');
}

/**
 * Compiles one justification builder section. Claims and their sources are
 * numbered from their array indexes, the claim tally follows them, and the
 * section rating and justification close the block.
 */
export function formatJustificationBuilder(state: FactualAccuracyState): string {
  const claimBlocks = state.claims.map((claim, index) => {
    const lines: string[] = [`Claim ${index + 1}: ${claim.text}`, ''];

    const ratingLine = classificationLine(claim);

    if (ratingLine !== '') {
      lines.push(ratingLine);
    }

    lines.push(`Justification: ${claim.justification}`);

    claim.sources.forEach((source, sourceIndex) => {
      lines.push(`Source ${sourceIndex + 1}: ${source.text}`);
    });

    return lines.join('\n');
  });

  const finalBlock = [
    `Final Rating: ${factualityRatingLabel(state.finalRating)}`,
    `Final Justification: ${state.finalJustification}`,
  ].join('\n');

  const summaryBlocks =
    state.claims.length > 0 ? [formatClaimSummary(state.claims)] : [];

  return [...claimBlocks, ...summaryBlocks, finalBlock].join('\n\n');
}

/**
 * Objective, non-blank claims numbered from 1, one blank line apart, so each
 * claim can be copied out on its own.
 */
export function formatObjectiveClaimsList(claims: readonly Claim[]): string {
  return claims
    .filter((claim) => claim.classification === 'Objective' && claim.text.trim() !== '')
    .map((claim, index) => `Claim ${index + 1}: ${normalizeSingleLine(claim.text)}`)
    .join('\n\n');
}
