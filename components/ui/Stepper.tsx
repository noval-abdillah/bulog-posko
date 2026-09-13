/**
 * components/ui/Stepper.tsx
 * Stepper horizontal alur konfigurasi (1→4 langkah).
 */

interface StepItem {
  id: number;
  label: string;
  description: string;
  done: boolean;
  active: boolean;
}

interface StepperProps {
  steps: StepItem[];
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-start flex-1 min-w-0">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-center w-full">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black border-2 transition-all
                  ${step.done
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : step.active
                    ? "bg-bulog-blue border-bulog-blue text-white"
                    : "bg-white border-slate-300 text-slate-400"}`}
              >
                {step.done ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${step.done ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="mt-2 text-left w-full pr-4">
              <p className={`text-[11px] font-bold truncate ${step.done ? "text-emerald-700" : step.active ? "text-bulog-blue" : "text-slate-400"}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{step.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
