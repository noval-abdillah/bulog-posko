/**
 * components/ui/Badge.tsx
 * Komponen badge/pill status reusable dengan varian semantik konsisten.
 */

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "blue";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger:  "bg-rose-100 text-rose-800 border-rose-200",
  info:    "bg-blue-100 text-bulog-blue border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  blue:    "bg-bulog-blue/10 text-bulog-blue border-bulog-blue/20",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
