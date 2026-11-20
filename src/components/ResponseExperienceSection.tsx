import { MessageSquareText } from 'lucide-react';
import { RESPONSE_EXPERIENCE_SCALE } from '../domain/ratings';
import type { ResponseExperienceSlice } from '../domain/types';
import { RatingSelector } from './RatingSelector';
import { SectionCard } from './SectionCard';

export interface ResponseExperienceSectionProps {
  value: ResponseExperienceSlice;
  onChange: (patch: Partial<ResponseExperienceSlice>) => void;
}

export function ResponseExperienceSection({ value, onChange }: ResponseExperienceSectionProps) {
  return (
    <SectionCard
      icon={<MessageSquareText size={16} />}
      title="Response Experience"
      description="Clarity, structure and tone of the written response."
    >
      <RatingSelector
        label="Rating"
        value={value.rating}
        scale={RESPONSE_EXPERIENCE_SCALE}
        onChange={(rating) => onChange({ rating })}
      />

      <div className="min-w-0 space-y-1.5">
        <label className="field-label block" htmlFor="response-comment">
          Comment
        </label>
        <textarea
          id="response-comment"
          className="field-input resize-y"
          rows={3}
          value={value.comment}
          placeholder="What worked, what should change next time?"
          onChange={(event) => onChange({ comment: event.target.value })}
        />
      </div>
    </SectionCard>
  );
}
