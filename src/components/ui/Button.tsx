import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
  shortcut?: string;
  icon?: ReactNode;
};

const variants = {
  primary: "border-transparent bg-cyan-300 text-slate-950 shadow-[0_12px_28px_rgba(103,232,249,0.18)] hover:bg-cyan-200",
  secondary: "border-white/10 bg-white/[0.07] text-slate-100 hover:border-white/18 hover:bg-white/[0.11]",
  danger: "border-transparent bg-rose-500 text-white shadow-[0_12px_28px_rgba(244,63,94,0.16)] hover:bg-rose-400",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.08] hover:text-white",
  success: "border-transparent bg-emerald-400 text-slate-950 shadow-[0_12px_28px_rgba(52,211,153,0.14)] hover:bg-emerald-300",
  warning: "border-transparent bg-amber-300 text-slate-950 shadow-[0_12px_28px_rgba(252,211,77,0.13)] hover:bg-amber-200",
};

export const Button = ({ variant = "secondary", shortcut, icon, className = "", children, ...props }: Props) => (
  <button
    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-200/70 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    {...props}
  >
    {icon}
    <span className="truncate">{children}</span>
    {shortcut ? <kbd className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-black text-current/80">{shortcut}</kbd> : null}
  </button>
);
