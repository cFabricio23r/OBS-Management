import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useObsStore } from "../../store/useObsStore";
import { Button } from "../ui/Button";

export const StatusBar = () => {
  const { connected, state, refreshState } = useObsStore();
  const addLog = useAppStore((store) => store.addLog);
  const refresh = async () => {
    try {
      await refreshState();
      addLog("success", "OBS state refreshed");
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Refresh failed");
    }
  };

  return (
    <section className="grid gap-2 rounded-2xl border border-white/[0.08] bg-slate-900/72 p-2 shadow-[0_18px_54px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl md:grid-cols-[auto_1fr_1fr] xl:grid-cols-[auto_1fr_1fr_auto_auto]">
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${connected ? "bg-emerald-400/13 text-emerald-100" : "bg-rose-500/12 text-rose-100"}`}>
        {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        {connected ? "Connected" : "Offline"}
      </div>
      <div className="rounded-xl border border-rose-300/28 bg-white/[0.045] px-3 py-2">
        <div className="text-[10px] font-black uppercase text-rose-200">Program</div>
        <div className="truncate text-lg font-black text-white">{state.programScene ?? "Unknown"}</div>
      </div>
      <div className="rounded-xl border border-cyan-200/28 bg-white/[0.045] px-3 py-2">
        <div className="text-[10px] font-black uppercase text-cyan-200">Preview</div>
        <div className="truncate text-lg font-black text-white">{state.previewScene ?? "Unknown"}</div>
      </div>
      <div className={`rounded-xl px-3 py-2 text-sm font-bold md:col-span-2 xl:col-span-1 ${state.studioModeEnabled ? "bg-cyan-300/12 text-cyan-100" : "bg-amber-400/12 text-amber-100"}`}>
        Studio Mode: {state.studioModeEnabled ? "On" : "Off"}
      </div>
      <Button icon={<RefreshCw className="h-4 w-4" />} shortcut="R" onClick={refresh}>Refresh</Button>
    </section>
  );
};
