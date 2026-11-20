import { Building2, ClipboardCheck, Globe2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyText } from './adapters/clipboard';
import { JustificationBuilderView, type CopyStatus } from './components/JustificationBuilderView';
import { ResponseExperienceSection } from './components/ResponseExperienceSection';
import { TaskCompletionSection } from './components/TaskCompletionSection';
import { UndoBanner } from './components/UndoBanner';
import { useAppState } from './components/useAppStore';
import { formatPercent } from './domain/format';
import {
  ACCOUNT_FACTUALITY_SCALE,
  WORLD_FACT_CORRECTNESS_SCALE,
  averageRating,
  clampRating,
  ratingToPercent,
} from './domain/ratings';
import type { JustificationSliceKey } from './domain/types';
import { appStore } from './state/appStore';

interface CopyResult {
  key: JustificationSliceKey;
  ok: boolean;
}

function copyStatusFor(result: CopyResult | null, key: JustificationSliceKey): CopyStatus {
  if (result === null || result.key !== key) {
    return 'idle';
  }

  return result.ok ? 'copied' : 'failed';
}

export default function App() {
  const state = useAppState();
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null);

  useEffect(() => {
    if (copyResult === null) {
      return;
    }

    const handle = window.setTimeout(() => setCopyResult(null), 1_800);
    return () => window.clearTimeout(handle);
  }, [copyResult]);

  const overall = averageRating([
    state.taskCompletion.rating,
    state.worldFactCorrectness.rating,
    state.accountFactuality.rating,
    state.responseExperience.rating,
  ]);
  const percent = overall === null ? 0 : ratingToPercent(clampRating(overall));

  async function handleCopy(key: JustificationSliceKey, text: string): Promise<void> {
    const ok = await copyText(text);
    setCopyResult({ key, ok });
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[420px] items-center gap-2.5 px-4 py-3">
          <span className="text-accent" aria-hidden="true">
            <ClipboardCheck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-ink">Business Analyst Review</h1>
            <p className="truncate text-[11px] text-muted">Turing task evaluation</p>
          </div>
          <button
            type="button"
            onClick={() => {
              appStore.clearAll();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[11px] font-medium text-muted transition hover:border-danger/50 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            <Trash2 aria-hidden="true" size={12} />
            Clear all
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[420px] flex-col gap-3 px-4 pt-3 pb-10">
        <UndoBanner />

        <div className="card min-w-0 p-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="field-label">Overall progress</span>
            <span className="text-xs text-muted">
              {overall === null ? 'No ratings yet' : `${overall} / 5`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-raised"
            role="progressbar"
            aria-label="Overall progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: formatPercent(percent) }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">Average of the four section ratings.</p>
        </div>

        <TaskCompletionSection
          value={state.taskCompletion}
          onChange={(patch) => appStore.updateTaskCompletion(patch)}
        />

        <JustificationBuilderView
          title="World Fact Correctness"
          description="Do the claims hold up against the real world?"
          icon={<Globe2 size={16} />}
          scale={WORLD_FACT_CORRECTNESS_SCALE}
          draft={state.worldFactCorrectness}
          onChange={(draft) => appStore.updateJustification('worldFactCorrectness', draft)}
          onCopy={(text) => {
            void handleCopy('worldFactCorrectness', text);
          }}
          copyStatus={copyStatusFor(copyResult, 'worldFactCorrectness')}
        />

        <JustificationBuilderView
          title="Account Factuality"
          description="Do the claims match the customer account record?"
          icon={<Building2 size={16} />}
          scale={ACCOUNT_FACTUALITY_SCALE}
          draft={state.accountFactuality}
          onChange={(draft) => appStore.updateJustification('accountFactuality', draft)}
          onCopy={(text) => {
            void handleCopy('accountFactuality', text);
          }}
          copyStatus={copyStatusFor(copyResult, 'accountFactuality')}
        />

        <ResponseExperienceSection
          value={state.responseExperience}
          onChange={(patch) => appStore.updateResponseExperience(patch)}
        />

        <p className="px-1 pt-1 text-center text-[11px] leading-relaxed text-muted">
          Autosaved to this browser. Clearing starts a 5-second undo window.
        </p>
      </main>
    </div>
  );
}
