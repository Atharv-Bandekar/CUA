import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { getSection, type SectionId } from './components/layout/navigation';
import { FinalSummaryView } from './components/final-summary/FinalSummaryView';
import { JustificationBuilderView } from './components/factual-accuracy/JustificationBuilderView';
import { ResponseExperienceView } from './components/response-experience/ResponseExperienceView';
import { TaskCompletionView } from './components/task-completion/TaskCompletionView';

function renderSection(section: SectionId) {
  switch (section) {
    case 'taskCompletion':
      return <TaskCompletionView />;
    case 'worldFactCorrectness':
    case 'accountFactuality': {
      const meta = getSection(section);
      return (
        <JustificationBuilderView
          section={section}
          title={meta.label}
          description={meta.description}
        />
      );
    }
    case 'responseExperience':
      return <ResponseExperienceView />;
    case 'finalSummary':
      return <FinalSummaryView />;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('taskCompletion');

  return (
    <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection(activeSection)}
    </AppShell>
  );
}
