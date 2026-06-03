import { Activity, Cable, Languages, Settings, Wand2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useT } from "../../lib/i18n/translations";

const nav = [
  { id: "operator", label: "Operator", shortLabel: "Live", icon: Activity },
  { id: "builder", label: "Visual Builder", shortLabel: "Builder", icon: Wand2 },
  { id: "settings", label: "Settings", shortLabel: "Settings", icon: Settings },
] as const;

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const { view, language, setView, toggleLanguage } = useAppStore();
  const t = useT();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-slate-950/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
          <div className="mr-auto flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-200/18 bg-cyan-200/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Cable className="h-5 w-5 text-cyan-100" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white sm:text-base">{t("appName")}</div>
              <div className="hidden text-xs font-semibold text-slate-500 sm:block">{t("workspace")}</div>
            </div>
          </div>
          <nav className="flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-black transition sm:px-3 sm:text-sm ${
                    active ? "bg-white text-slate-950 shadow-[0_12px_28px_rgba(0,0,0,0.22)]" : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
                  }`}
                  onClick={() => setView(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sm:hidden">{t(item.id === "operator" ? "live" : item.id === "builder" ? "builder" : "settings")}</span>
                  <span className="hidden sm:inline">{t(item.id === "operator" ? "operator" : item.id === "builder" ? "visualBuilder" : "settings")}</span>
                </button>
              );
            })}
          </nav>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-xs font-black text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            onClick={toggleLanguage}
            title={t("language")}
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "ES" : "EN"}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1560px] p-3 sm:p-4 lg:p-5">{children}</main>
    </div>
  );
};
