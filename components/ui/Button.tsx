/**
 * components/ui/Button.tsx
 * Komponen button reusable dengan varian dan ukuran tap target minimal 44px (Mobile-Friendly).
 */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:   "bg-bulog-blue hover:bg-bulog-dark active:bg-bulog-dark text-white shadow-xs",
  secondary: "bg-slate-100 hover:bg-slate-200 active:bg-slate-200 text-slate-800 border border-slate-200",
  danger:    "bg-rose-50 hover:bg-rose-100 active:bg-rose-100 text-rose-700 border border-rose-200",
  ghost:     "hover:bg-slate-100 active:bg-slate-100 text-slate-700",
  success:   "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-700 text-white shadow-xs",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs gap-1.5 min-h-[40px] sm:min-h-[38px]",
  md: "px-4.5 py-2.5 text-sm gap-2 min-h-[44px]",
  lg: "px-6 py-3.5 text-base gap-2.5 min-h-[48px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 ease-out active:scale-[0.96] hover:-translate-y-0.5 hover:shadow-sm touch-manipulation select-none whitespace-nowrap
        ${variantClass[variant]} ${sizeClass[size]} ${className}
        ${disabled || loading ? "opacity-50 cursor-not-allowed pointer-events-none active:scale-100 hover:translate-y-0 hover:shadow-none" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}
