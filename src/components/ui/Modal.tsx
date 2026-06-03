import type { ReactNode } from "react";

export const Modal = ({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900 p-5 shadow-glow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white" onClick={onClose}>Esc</button>
      </div>
      {children}
    </div>
  </div>
);
