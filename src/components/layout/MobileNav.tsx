import { SECTIONS, type SectionId } from './navigation';

export interface MobileNavProps {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
}

export function MobileNav({ activeSection, onSelect }: MobileNavProps) {
  return (
    <nav
      className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-line bg-panel/60 px-2 py-2 md:hidden"
      aria-label="Sections"
    >
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const active = section.id === activeSection;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
              active
                ? 'bg-accent-soft text-ink'
                : 'text-muted hover:bg-panel-raised hover:text-ink'
            }`}
          >
            <Icon
              aria-hidden="true"
              size={12}
              className={active ? 'text-accent' : 'text-muted'}
            />
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
