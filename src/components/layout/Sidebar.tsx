import { ClipboardList } from 'lucide-react';
import { SECTIONS, type SectionId } from './navigation';

export interface SidebarProps {
  activeSection: SectionId;
  onSelect: (section: SectionId) => void;
}

export function Sidebar({ activeSection, onSelect }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-panel/40 px-3 py-4 md:flex">
      <div className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent-soft text-accent">
          <ClipboardList aria-hidden="true" size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">CUA Evaluation</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1" aria-label="Sections">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                active
                  ? 'bg-accent-soft text-ink'
                  : 'text-muted hover:bg-panel-raised hover:text-ink'
              }`}
            >
              <Icon
                aria-hidden="true"
                size={15}
                className={active ? 'text-accent' : 'text-muted'}
              />
              <span className="min-w-0 truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <p className="mt-auto px-2 text-[11px] leading-relaxed text-muted">
        Every edit is kept on this device until you clear the worksheet.
      </p>
    </aside>
  );
}
