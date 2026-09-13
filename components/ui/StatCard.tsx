/**
 * components/ui/StatCard.tsx
 * Kartu KPI / statistik untuk halaman Dashboard — angka besar + label + ikon.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "blue";
  sub?: string;
}

const variantStyles = {
  default: { wrap: "bg-white border-slate-200", icon: "bg-slate-100 text-slate-500", val: "text-slate-900" },
  success: { wrap: "bg-white border-emerald-200", icon: "bg-emerald-100 text-emerald-600", val: "text-emerald-700" },
  warning: { wrap: "bg-white border-amber-200",   icon: "bg-amber-100 text-amber-600",   val: "text-amber-700"   },
  danger:  { wrap: "bg-white border-rose-200",    icon: "bg-rose-100 text-rose-600",     val: "text-rose-700"   },
  blue:    { wrap: "bg-white border-bulog-blue/20", icon: "bg-bulog-blue/10 text-bulog-blue", val: "text-bulog-blue" },
};

export function StatCard({ label, value, icon, variant = "default", sub }: StatCardProps) {
  const s = variantStyles[variant];
  return (
    <div className={`border rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${s.wrap}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className={`text-2xl font-black leading-tight ${s.val}`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
