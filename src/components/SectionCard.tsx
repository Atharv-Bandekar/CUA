import type { ReactNode } from 'react';

export interface SectionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ icon, title, description, actions, children }: SectionCardProps) {
  return (
    <section className="card min-w-0 p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-accent" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{description}</p>
        </div>
        {actions === undefined ? null : <div className="shrink-0">{actions}</div>}
      </div>

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
