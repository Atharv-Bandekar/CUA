import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { SectionPlaceholder } from './components/layout/SectionPlaceholder';
import { type SectionId } from './components/layout/navigation';
import { TaskCompletionView } from './components/task-completion/TaskCompletionView';

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('taskCompletion');

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === 'taskCompletion' ? (
        <TaskCompletionView />
      ) : (
        <SectionPlaceholder sectionId={activeSection} />
      )}
    </AppShell>
  );
}
