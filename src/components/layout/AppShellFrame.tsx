import type { ReactNode } from 'react';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UndoToast } from './UndoToast';
import type { SectionId } from './navigation';

export interface AppShellFrameProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  title: string;
  children: ReactNode;
}

export function AppShellFrame({
  activeSection,
  onSectionChange,
  title,
  children,
}: AppShellFrameProps) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <Sidebar activeSection={activeSection} onSelect={onSectionChange} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <MobileNav activeSection={activeSection} onSelect={onSectionChange} />

          <main className="mx-auto w-full max-w-[520px] flex-1 px-3 pt-3 pb-28 sm:px-5 md:max-w-[760px] md:pt-5 md:pb-10">
            {children}
          </main>
        </div>
      </div>

      <UndoToast />
    </div>
  );
}
