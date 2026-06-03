import { useAppStore } from "../../store/useAppStore";

const tones = {
  info: "border-cyan-200 bg-cyan-300/15 text-cyan-100",
  success: "border-emerald-400 bg-emerald-500/15 text-emerald-100",
  warning: "border-amber-400 bg-amber-500/15 text-amber-100",
  error: "border-rose-400 bg-rose-500/15 text-rose-100",
};

export const Toast = () => {
  const toast = useAppStore((state) => state.toast);
  if (!toast) return null;
  return <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-glow backdrop-blur-xl ${tones[toast.level]}`}>{toast.message}</div>;
};
