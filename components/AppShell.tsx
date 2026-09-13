/**
 * components/AppShell.tsx
 * Shell ERP: Autentikasi Posko + Sidebar + Topbar + Konten Halaman (termasuk Chat Realtime).
 */
"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { getSessionPosko, supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ToastContainer } from "@/components/ui/Toast";

import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import PoskoPage from "@/features/posko/PoskoPage";
import LogPage from "@/features/log/LogPage";
import AuditPage from "@/features/audit/AuditPage";
import DataBermasalahPage from "@/features/bermasalah/DataBermasalahPage";
import PanduanPage from "@/features/panduan/PanduanPage";
import ChatPage from "@/features/chat/ChatPage";

export default function AppShell() {
  const activeTab        = useAppStore((s) => s.activeTab);
  const muatDataDariDB   = useAppStore((s) => s.muatDataDariDB);
  const sessionPosko     = useAppStore((s) => s.sessionPosko);
  const setSessionPosko  = useAppStore((s) => s.setSessionPosko);
  const setPoskoAktif     = useAppStore((s) => s.setPoskoAktif);

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    muatDataDariDB();
  }, [muatDataDariDB]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const session = await getSessionPosko();
        if (isMounted) {
          if (session) {
            setSessionPosko(session);
            setPoskoAktif(session.namaPosko);
          }
        }
      } catch (err) {
        console.warn("Belum mengonfigurasi Supabase URL/Key:", err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const session = await getSessionPosko();
        if (session) {
          setSessionPosko(session);
          setPoskoAktif(session.namaPosko);
        }
      } else if (event === "SIGNED_OUT") {
        setSessionPosko(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [setPoskoAktif, setSessionPosko]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3 font-sans">
        <div className="w-10 h-10 border-4 border-bulog-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Memeriksa Akses Posko Bulog...
        </p>
      </div>
    );
  }

  if (!sessionPosko || !sessionPosko.isLoggedIn) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          <div key={activeTab} className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 animate-fade-in-up">
            {activeTab === "dashboard"  && <DashboardPage />}
            {activeTab === "posko"      && <PoskoPage />}
            {activeTab === "log"        && <LogPage />}
            {activeTab === "audit"      && <AuditPage />}
            {activeTab === "bermasalah" && <DataBermasalahPage />}
            {activeTab === "panduan"    && <PanduanPage />}
            {activeTab === "chat"       && <ChatPage />}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
