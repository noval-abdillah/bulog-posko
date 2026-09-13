/**
 * features/auth/LoginPage.tsx
 * Halaman Login Resmi Posko Bulog Jakarta Utara.
 * Autentikasi email + password via Supabase Auth dengan auto-mapping ke nama posko & kecamatan.
 */
"use client";

import { useState } from "react";
import { loginPosko } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const setSessionPosko = useAppStore((s) => s.setSessionPosko);
  const setPoskoAktif   = useAppStore((s) => s.setPoskoAktif);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { session, error } = await loginPosko(email.trim(), password);
      if (error || !session) {
        setErrorMsg(error || "Login gagal. Periksa kembali email dan password.");
      } else {
        setSessionPosko(session);
        setPoskoAktif(session.namaPosko);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan atau server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 animate-zoom-in-95">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-bulog-dark to-bulog-blue p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10 space-y-2">
            <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-3xl">🏛️</span>
            </div>
            <h1 className="text-xl font-black tracking-tight">PERUM BULOG</h1>
            <p className="text-xs font-semibold text-sky-200 uppercase tracking-widest">
              Sistem Posko Verifikasi Bansos PBP
            </p>
            <p className="text-[11px] text-slate-300">Wilayah Operasional Kota Jakarta Utara</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-slate-700">
              Email Akun Posko / Kelurahan:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kelurahan.rawabadakutara@bulog-jakut.id"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bulog-blue transition"
            />
            <p className="text-[10px] text-slate-400">Gunakan email resmi kelurahan/supervisor yang terdaftar.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-slate-700">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bulog-blue transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-bulog-blue hover:bg-bulog-dark active:bg-bulog-dark text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md touch-manipulation min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <span>Masuk ke Sistem Posko</span>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Belum punya akses akun? Hubungi <b className="text-slate-600">Supervisor Bulog Jakarta Utara</b> untuk mendapatkan kredensial login kelurahan Anda.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
