import { getSection, type SectionId } from './navigation';

export interface SectionPlaceholderProps {
  sectionId: Exclude<SectionId, 'taskCompletion'>;
}

export function SectionPlaceholder({ sectionId }: SectionPlaceholderProps) {
  const section = getSection(sectionId);
  const Icon = section.icon;

  return (
    <section className="card flex flex-col items-center gap-2 px-5 py-10 text-center">
      <span className="text-accent" aria-hidden="true">
        <Icon size={20} />
      </span>
      <h2 className="text-sm font-semibold text-ink">{section.label}</h2>
      <p className="max-w-xs text-xs leading-relaxed text-muted">
        {section.description} This view arrives in a later sprint — Task Completion is ready to use
        now.
      </p>
    </section>
  );
}
