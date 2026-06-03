import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
    <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

export const inputClass = "min-h-10 rounded-xl border border-white/[0.08] bg-slate-950/58 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-200/15";

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input className={inputClass} {...props} />;
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={`${inputClass} min-h-20 resize-y`} {...props} />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select className={inputClass} {...props} />;
