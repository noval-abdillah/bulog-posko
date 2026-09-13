/**
 * components/Sidebar.tsx
 * Sidebar navigasi persisten ERP-style dengan logo Bulog, menu utama, badge chat real-time, & logout.
 */
"use client";

import { useAppStore } from "@/store/appStore";
import { logoutPosko } from "@/lib/supabase";
import type { ActiveTab } from "@/types";

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const KELURAHAN_OPTIONS = [
  "Rawa Badak Utara","Tugu Utara","Tugu Selatan","Rawa Badak Selatan","Koja","Lagoa",
  "Pejagalan","Penjaringan","Pluit","Pademangan Barat","Pademangan Timur","Ancol",
  "Kalibaru","Semper Barat","Semper Timur","Cilincing","Sukapura","Rorotan","Marunda",
  "Sungai Bambu","Kebon Bawang","Papanggo","Warakas","Tanjung Priok",
  "Kelapa Gading Barat","Kelapa Gading Timur","Pegangsaan Dua",
  "Kamal Muara","Kapuk Muara","Sunter Agung","Sunter Jaya",
];

export default function Sidebar() {
  const activeTab            = useAppStore((s) => s.activeTab);
  const setActiveTab         = useAppStore((s) => s.setActiveTab);
  const sidebarOpen          = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen       = useAppStore((s) => s.setSidebarOpen);
  const logPenggantiTertolak = useAppStore((s) => s.logPenggantiTertolak);
  const logBermasalah        = useAppStore((s) => s.logBermasalah);
  const poskoAktif           = useAppStore((s) => s.poskoAktif);
  const setPoskoAktif        = useAppStore((s) => s.setPoskoAktif);
  const sessionPosko         = useAppStore((s) => s.sessionPosko);
  const setSessionPosko      = useAppStore((s) => s.setSessionPosko);
  const unreadChatCount      = useAppStore((s) => s.unreadChatCount);

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      id: "posko",
      label: "Meja Posko",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>
        </svg>
      ),
    },
    {
      id: "chat",
      label: "Chat Posko",
      badge: unreadChatCount,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      id: "log",
      label: "Pengganti Tertolak",
      badge: logPenggantiTertolak.length,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
    },
    {
      id: "audit",
      label: "Audit Ekspor",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
        </svg>
      ),
    },
    {
      id: "bermasalah",
      label: "Data Bermasalah",
      badge: logBermasalah.length,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
    {
      id: "panduan",
      label: "Panduan Penggunaan",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <path d="M12 6h4M12 10h4M12 14h4"/>
        </svg>
      ),
    },
  ];

  async function handleLogout() {
    await logoutPosko();
    setSessionPosko(null);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Logo Bulog" className="w-full h-full object-contain" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-white font-black text-sm leading-tight truncate">Sistem Posko</p>
            <p className="text-white/50 text-[10px] font-medium truncate">Bansos PBP · Bulog</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(window.innerWidth >= 1024 ? sidebarOpen : false); }}
              aria-label={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${isActive
                  ? "bg-white text-bulog-blue shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
            >
              <span className={`flex-shrink-0 ${isActive ? "text-bulog-blue" : ""}`}>{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {sidebarOpen && item.badge != null && item.badge > 0 && (
                <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${item.id === "bermasalah"
                    ? "bg-rose-500 text-white"
                    : item.id === "chat"
                    ? "bg-emerald-500 text-white"
                    : isActive ? "bg-bulog-blue text-white" : "bg-white/20 text-white"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Posko & Session Info */}
      {sidebarOpen && (
        <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">
              {sessionPosko?.isSuper ? "Pilih Posko Aktif (Super)" : "Posko Aktif Anda"}
            </p>
            {sessionPosko?.isSuper && (
              <span className="text-[9px] font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded">Super</span>
            )}
          </div>

          {sessionPosko?.isSuper ? (
            <select
              value={poskoAktif}
              onChange={(e) => setPoskoAktif(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {KELURAHAN_OPTIONS.map((k) => (
                <option key={k} value={k} className="text-slate-900 bg-white">{k}</option>
              ))}
            </select>
          ) : (
            <div className="w-full px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/20 flex items-center justify-between">
              <span className="truncate">{poskoAktif}</span>
              <span className="text-[9px] text-white/50">{sessionPosko?.kecamatan}</span>
            </div>
          )}

          {/* User & Logout Button */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">
                {sessionPosko?.namaPosko || "Petugas"}
              </p>
              <p className="text-[9px] text-white/50 truncate">
                {sessionPosko?.email || ""}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar dari Akun Posko"
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Developer credit */}
      {sidebarOpen && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-[10px] text-white/30 font-medium leading-snug">
            Dikembangkan oleh<br/>
            <span className="text-white/60 font-bold">Noval Abdillah</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-bulog-blue transition-all duration-200 ease-in-out h-screen sticky top-0
          ${sidebarOpen ? "w-56" : "w-16"}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {!sidebarOpen ? null : (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-bulog-blue flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-white font-black text-sm">Menu Navigasi</p>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/60 hover:text-white p-1"
            aria-label="Tutup menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
