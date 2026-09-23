/**
 * features/auth/LoginPage.tsx
 * Halaman Login Resmi Posko Bulog Jakarta Utara.
 * Autentikasi email + password via Supabase Auth dengan auto-mapping ke nama posko & kecamatan.
 */
"use client";

import { useState } from "react";
import { loginPosko } from "@/lib/supabase";
import { useAppStore } from "@/store/appStore";
import StarfieldBackground from "@/components/StarfieldBackground";

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      <StarfieldBackground />

      <div className="w-full max-w-5xl relative z-10 animate-zoom-in-95 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 grid lg:grid-cols-2">

        {/* ── KOLOM KIRI: Image Panel (hidden di mobile) ── */}
        <div className="hidden lg:block relative">
          {/* TODO: ganti URL berikut dengan asset gambar Anda sendiri */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80&auto=format&fit=crop"
            alt="Distribusi Bansos PBP"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay gelap keseluruhan agar teks terbaca */}
          <div className="absolute inset-0 bg-bulog-dark/70" />

          {/* Overlay gradient bawah yang lebih pekat */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Logo pojok kiri atas */}
          <div className="absolute top-6 left-6 flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 p-1.5 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="Logo Bulog" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-sm tracking-tight drop-shadow">PERUM BULOG</span>
          </div>

          {/* Tagline + dots di bagian bawah */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
            <p className="text-[10px] font-semibold text-sky-300 uppercase tracking-widest mb-2">
              Sistem Operasional Lapangan
            </p>
            <h2 className="text-white text-2xl font-black leading-tight drop-shadow-lg">
              Verifikasi &amp; Rekonsiliasi<br />Bansos PBP Jakarta Utara
            </h2>
            <p className="text-slate-300 text-xs mt-2 leading-relaxed">
              Platform terpadu untuk 31 kelurahan &amp; 6 kecamatan<br />wilayah operasional Kota Jakarta Utara.
            </p>

            {/* Dots dekoratif */}
            <div className="flex items-center gap-1.5 mt-5" aria-hidden="true">
              <span className="w-5 h-1.5 rounded-full bg-white/90" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* ── KOLOM KANAN: Form Panel ── */}
        <div className="bg-slate-900 flex flex-col justify-center px-8 py-10 sm:px-12">

          {/* Logo mobile (hanya muncul saat kolom kiri hidden) */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="Logo Bulog" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">PERUM BULOG</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-white text-2xl font-black tracking-tight leading-tight">
              Masuk ke Sistem Posko
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Gunakan kredensial akun kelurahan atau supervisor Anda.
            </p>
          </div>

          {/* Form — semua logic identik, hanya styling diubah */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="p-3 bg-rose-950/60 border border-rose-700/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-rose-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold uppercase text-slate-400 tracking-wide">
                Email Akun Posko / Kelurahan
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kelurahan.rawabadakutara@bulog-jakut.id"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-bulog-blue transition"
              />
              <p className="text-[10px] text-slate-500">Gunakan email resmi kelurahan/supervisor yang terdaftar.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase text-slate-400 tracking-wide">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-bulog-blue transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-bulog-blue hover:bg-bulog-dark active:bg-bulog-dark text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-lg touch-manipulation min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bulog-blue"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <span>Masuk ke Sistem Posko</span>
              )}
            </button>

            <div className="pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Belum punya akses akun? Hubungi{" "}
                <span className="text-slate-300 font-semibold">Supervisor Bulog Jakarta Utara</span>{" "}
                untuk mendapatkan kredensial login kelurahan Anda.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
