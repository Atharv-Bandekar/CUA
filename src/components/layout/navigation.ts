import {
  Building2,
  ClipboardCheck,
  FileText,
  Globe2,
  MessageSquareText,
  type LucideIcon,
} from 'lucide-react';

export type SectionId =
  | 'taskCompletion'
  | 'worldFactCorrectness'
  | 'accountFactuality'
  | 'responseExperience'
  | 'finalSummary';

export interface SectionDefinition {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SECTIONS: readonly SectionDefinition[] = [
  {
    id: 'taskCompletion',
    label: 'Task Completion',
    description: 'Main goal, conditions and final completion rating.',
    icon: ClipboardCheck,
  },
  {
    id: 'worldFactCorrectness',
    label: 'World Fact Correctness',
    description: 'Claims checked against the real world.',
    icon: Globe2,
  },
  {
    id: 'accountFactuality',
    label: 'Account Factuality',
    description: 'Claims checked against the account record.',
    icon: Building2,
  },
  {
    id: 'responseExperience',
    label: 'Response Experience',
    description: 'Clarity, structure and tone of the response.',
    icon: MessageSquareText,
  },
  {
    id: 'finalSummary',
    label: 'Final Summary',
    description: 'The compiled scores for this response.',
    icon: FileText,
  },
];

export function getSection(id: SectionId): SectionDefinition {
  const section = SECTIONS.find((entry) => entry.id === id);

  if (section === undefined) {
    throw new Error(`Unknown section: ${id}`);
  }

  return section;
}
