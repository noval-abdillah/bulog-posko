/**
 * components/ui/Card.tsx
 * Container card standar dengan padding, border, shadow konsisten.
 */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${noPadding ? "" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon, actions }: CardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-bulog-blue/10 flex items-center justify-center text-bulog-blue flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
