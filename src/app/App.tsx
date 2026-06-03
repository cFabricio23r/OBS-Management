import { useEffect } from "react";
import { Shell } from "../components/layout/Shell";
import { OperatorView } from "../components/operator/OperatorView";
import { VisualBuilder } from "../components/builder/VisualBuilder";
import { SettingsView } from "../components/settings/SettingsView";
import { Toast } from "../components/ui/Toast";
import { useGlobalShortcuts } from "../lib/shortcuts/useGlobalShortcuts";
import { useAppStore } from "../store/useAppStore";
import { useObsStore } from "../store/useObsStore";

export const App = () => {
  const { view, hydrate, hydrated } = useAppStore();
  const hydrateSettings = useObsStore((store) => store.hydrateSettings);
  useGlobalShortcuts();

  useEffect(() => {
    hydrate();
    hydrateSettings();
  }, [hydrate, hydrateSettings]);

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-obs-950 text-sm font-bold text-slate-300">Loading control surface...</div>;
  }

  return (
    <Shell>
      {view === "operator" ? <OperatorView /> : null}
      {view === "builder" ? <VisualBuilder /> : null}
      {view === "settings" ? <SettingsView /> : null}
      <Toast />
    </Shell>
  );
};
