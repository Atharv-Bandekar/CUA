import type { ReactNode } from 'react';
import { AppShellFrame } from './AppShellFrame';
import { getSection, type SectionId } from './navigation';

export interface AppShellProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  children: ReactNode;
}

export function AppShell({ activeSection, onSectionChange, children }: AppShellProps) {
  const section = getSection(activeSection);

  return (
    <AppShellFrame
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      title={section.label}
    >
      {children}
    </AppShellFrame>
  );
}
