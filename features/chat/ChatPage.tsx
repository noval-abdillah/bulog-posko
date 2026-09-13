/**
 * features/chat/ChatPage.tsx
 * Halaman Chat Koordinasi Antar Posko Real-time via Supabase.
 * Mendukung filter per Kecamatan, penanda tipe pesan (Normal/Peringatan/Info),
 * auto-scroll, dan visual badge per kecamatan.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import {
  kirimPesanChat,
  ambilRiwayatChat,
  subscribeChat,
  KECAMATAN_LIST,
  POSKO_WARNA_MAP,
} from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ChatPoskoItem } from "@/types";

export default function ChatPage() {
  const sessionPosko    = useAppStore((s) => s.sessionPosko);
  const poskoAktif      = useAppStore((s) => s.poskoAktif);
  const chatMessages    = useAppStore((s) => s.chatMessages);
  const setChatMessages = useAppStore((s) => s.setChatMessages);
  const tambahChatMessage = useAppStore((s) => s.tambahChatMessage);
  const resetUnreadCount = useAppStore((s) => s.resetUnreadCount);
  const toast = useToast();

  const [pesanInput, setPesanInput]   = useState("");
  const [namaPetugas, setNamaPetugas] = useState("");
  const [tipePesan, setTipePesan]     = useState<ChatPoskoItem["tipe"]>("normal");
  const [filterKec, setFilterKec]     = useState<string>("SEMUA");
  const [filterTipe, setFilterTipe]   = useState<string>("SEMUA");
  const [kirimLoading, setKirimLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentPoskoName = sessionPosko?.namaPosko || poskoAktif;

  // Inisialisasi nama petugas khusus posko ini dari localStorage atau default session
  useEffect(() => {
    resetUnreadCount();
    const storageKey = `namaPetugasChat_${currentPoskoName}`;
    const savedName = localStorage.getItem(storageKey) ?? "";
    if (savedName) {
      setNamaPetugas(savedName);
    } else {
      setNamaPetugas(`Petugas ${currentPoskoName}`);
    }
  }, [resetUnreadCount, currentPoskoName]);

  // Auto-scroll ke paling bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function handleSaveNama(val: string) {
    setNamaPetugas(val);
    const storageKey = `namaPetugasChat_${currentPoskoName}`;
    localStorage.setItem(storageKey, val);
  }

  async function handleKirimPesan(e: React.FormEvent) {
    e.preventDefault();
    const text = pesanInput.trim();
    if (!text) return;

    const currentPosko = currentPoskoName;
    const currentKec   = sessionPosko?.kecamatan || "Jakarta Utara";
    const currentNama  = namaPetugas.trim() || `Petugas ${currentPosko}`;

    setKirimLoading(true);

    try {
      const { error } = await kirimPesanChat(
        currentPosko,
        currentKec,
        currentNama,
        text,
        tipePesan
      );

      if (error) {
        toast.error(`Gagal mengirim pesan: ${error}`);
      } else {
        setPesanInput("");
        setTipePesan("normal");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setKirimLoading(false);
    }
  }

  const filteredMessages = chatMessages.filter((m) => {
    if (filterKec !== "SEMUA" && m.kecamatan !== filterKec) return false;
    if (filterTipe !== "SEMUA" && m.tipe !== filterTipe) return false;
    return true;
  });

  const myPoskoName = sessionPosko?.namaPosko || poskoAktif;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Chat Koordinasi Antar Posko
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Komunikasi real-time 31 Posko Kelurahan &amp; Supervisor Kota Jakarta Utara
          </p>
        </div>

        {/* Info Posko Saya */}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl text-xs shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold leading-none">Posko Anda:</span>
            <span className="font-extrabold text-white">{myPoskoName} ({sessionPosko?.kecamatan || "Koja"})</span>
          </div>
        </div>
      </div>

      {/* Main Chat Card */}
      <Card noPadding className="flex flex-col h-[70vh] min-h-[500px] shadow-lg border border-slate-200 rounded-2xl overflow-hidden">
        {/* Toolbar Filter & Identitas */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 text-[11px]">Filter Chat:</span>
            <select
              value={filterKec}
              onChange={(e) => setFilterKec(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800 touch-manipulation text-xs"
            >
              <option value="SEMUA">🌐 Semua Kecamatan</option>
              {KECAMATAN_LIST.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800 touch-manipulation text-xs"
            >
              <option value="SEMUA">Semua Tipe Pesan</option>
              <option value="normal">💬 Teks Normal</option>
              <option value="peringatan">⚠️ Peringatan</option>
              <option value="info">ℹ️ Informasi</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] whitespace-nowrap">Nama Anda:</span>
            <input
              type="text"
              value={namaPetugas}
              onChange={(e) => handleSaveNama(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl font-semibold bg-white text-slate-900 text-xs w-36 sm:w-44 focus:ring-2 focus:ring-bulog-blue"
            />
          </div>
        </div>

        {/* Message History Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <span className="text-4xl mb-2">💬</span>
              <p className="text-xs font-bold text-slate-600">Belum ada pesan pada filter ini</p>
              <p className="text-[11px] text-slate-400 mt-1">Jadilah yang pertama mengirimkan update informasi posko Anda!</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMine = msg.posko.toLowerCase() === myPoskoName.toLowerCase();
              const badgeBg = POSKO_WARNA_MAP[msg.kecamatan] ?? "bg-slate-700";
              const formattedTime = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"} space-y-1`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 px-1">
                    <span className={`w-2 h-2 rounded-full ${badgeBg}`} />
                    <span className="text-slate-800 font-extrabold">{msg.posko}</span>
                    <span className="text-slate-400">({msg.kecamatan})</span>
                    <span className="text-slate-400 font-normal">• {msg.nama_petugas}</span>
                    <span className="text-slate-400 font-mono text-[9px]">{formattedTime}</span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs shadow-2xs leading-relaxed space-y-1 ${
                      isMine
                        ? "bg-bulog-blue text-white rounded-tr-xs"
                        : msg.tipe === "peringatan"
                        ? "bg-amber-50 border border-amber-300 text-amber-950 rounded-tl-xs"
                        : msg.tipe === "info"
                        ? "bg-sky-50 border border-sky-300 text-sky-950 rounded-tl-xs"
                        : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs"
                    }`}
                  >
                    {msg.tipe === "peringatan" && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-amber-800 uppercase tracking-wide mb-1">
                        <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Peringatan Penting
                      </div>
                    )}
                    {msg.tipe === "info" && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-sky-800 uppercase tracking-wide mb-1">
                        <svg className="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        Informasi Posko
                      </div>
                    )}
                    <p className="whitespace-pre-wrap font-medium">{msg.pesan}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleKirimPesan} className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
          {/* Tipe Selector Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tipe Pesan:</span>
            <button
              type="button"
              onClick={() => setTipePesan("normal")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                tipePesan === "normal"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              💬 Normal
            </button>
            <button
              type="button"
              onClick={() => setTipePesan("peringatan")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                tipePesan === "peringatan"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              ⚠️ Peringatan
            </button>
            <button
              type="button"
              onClick={() => setTipePesan("info")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                tipePesan === "info"
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
              }`}
            >
              ℹ️ Informasi
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={pesanInput}
              onChange={(e) => setPesanInput(e.target.value)}
              placeholder={`Tulis pesan dari Posko ${myPoskoName}...`}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-bulog-blue/40"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={kirimLoading || !pesanInput.trim()}
              className="min-w-[90px]"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            >
              {kirimLoading ? "..." : "Kirim"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
