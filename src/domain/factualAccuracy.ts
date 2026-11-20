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

export type ClaimAccuracy =
  | 'Accurate'
  | 'Inaccurate'
  | 'Partially Accurate'
  | 'Cannot Confidently Assess'
  | '';

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

export function factualityRatingLabel(rating: FactualityRating | ''): string {
  return ratingOptionLabel(FACTUALITY_RATINGS, rating);
}

function normalizeSingleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function classificationLine(claim: Claim): string {
  if (claim.classification === '' && claim.accuracy === '') {
    return '';
  }

  return `${claim.classification} - ${claim.accuracy}`;
}

/**
 * Compiles one justification builder section. Claims and per-claim sources are
 * numbered from their array indexes; the section rating and justification close
 * the block.
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

  return [...claimBlocks, finalBlock].join('\n\n');
}

/** Bulleted list of objective, non-blank claims, each squeezed to one line. */
export function formatObjectiveClaimsList(claims: readonly Claim[]): string {
  return claims
    .filter((claim) => claim.classification === 'Objective' && claim.text.trim() !== '')
    .map((claim) => `• ${normalizeSingleLine(claim.text)}`)
    .join('\n');
}
