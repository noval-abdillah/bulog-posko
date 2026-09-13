/**
 * components/ui/Toast.tsx
 * Sistem notifikasi toast non-blocking — menggantikan semua alert() browser.
 */
"use client";

import { useAppStore } from "@/store/appStore";
import type { ActiveTab } from "@/types";

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const hapusToast = useAppStore((s) => s.hapusToast);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const styles = {
    success: "bg-emerald-600 text-white",
    error:   "bg-rose-600 text-white",
    warning: "bg-amber-500 text-white",
    info:    "bg-bulog-blue text-white",
  };

  const icons = {
    success: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />,
    error:   <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
    warning: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    info:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => {
            if (t.onClickTab) {
              setActiveTab(t.onClickTab);
              hapusToast(t.id);
            }
          }}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto animate-toast-slide ${
            styles[t.type]
          } ${t.onClickTab ? "cursor-pointer hover:opacity-95" : ""}`}
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {icons[t.type]}
          </svg>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapusToast(t.id);
            }}
            className="flex-shrink-0 opacity-70 hover:opacity-100 p-0.5"
            aria-label="Tutup notifikasi"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const tambahToast = useAppStore((s) => s.tambahToast);
  return {
    sukses: (msg: string, onClickTab?: ActiveTab) => tambahToast("success", msg, onClickTab),
    error:  (msg: string, onClickTab?: ActiveTab) => tambahToast("error", msg, onClickTab),
    peringatan: (msg: string, onClickTab?: ActiveTab) => tambahToast("warning", msg, onClickTab),
    info:   (msg: string, onClickTab?: ActiveTab) => tambahToast("info", msg, onClickTab),
  };
}
