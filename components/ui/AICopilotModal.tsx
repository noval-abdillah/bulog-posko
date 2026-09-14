/**
 * components/ui/AICopilotModal.tsx
 * Floating AI Copilot Asisten SOP & Data Posko Bulog (powered by 9router AI).
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { aiCopilotQuery } from "@/lib/ai";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AICopilotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("SuperAdmin");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const poskoAktif = useAppStore((s) => s.poskoAktif);
  const sessionPosko = useAppStore((s) => s.sessionPosko);
  const masterRecords = useAppStore((s) => s.masterRecords);
  const bastRecords = useAppStore((s) => s.bastRecords);
  const logPelayanan = useAppStore((s) => s.logPelayanan);
  const bulogExportRecords = useAppStore((s) => s.bulogExportRecords);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Halo Petugas Posko **${poskoAktif}**! Saya **AI Copilot Posko Bulog** (powered by 9router AI). Ada yang bisa saya bantu terkait SOP Penyaluran Beras 30 Kg, Berkas SPTJM, atau analisis data posko hari ini?`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("ninerouter_api_key") ?? "";
    if (savedKey) setCustomApiKey(savedKey);
    const savedModel = localStorage.getItem("ninerouter_model") ?? "";
    if (savedModel) setCustomModel(savedModel);
  }, []);

  const contextData = useMemo(() => {
    const sukses = logPelayanan.filter((l) => l.status === "SUKSES_SALUR").length;
    const pengaduan = logPelayanan.filter((l) => l.status === "ALIH_PENGADUAN").length;
    return {
      poskoAktif,
      kecamatan: sessionPosko?.kecamatan || "Jakarta Utara",
      namaPetugas: sessionPosko?.namaPosko || poskoAktif,
      totalMasterRecords: masterRecords.length,
      totalBastRecords: bastRecords.length,
      totalPelayananHariIni: logPelayanan.length,
      suksesSalurCount: sukses,
      alokasiKgTersalur: sukses * 30,
      pengaduanCount: pengaduan,
      totalBulogExportRecords: bulogExportRecords.length,
    };
  }, [poskoAktif, sessionPosko, masterRecords, bastRecords, logPelayanan, bulogExportRecords]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  function handleSaveKey(key: string) {
    setCustomApiKey(key);
    localStorage.setItem("ninerouter_api_key", key);
  }

  function handleSaveModel(modelName: string) {
    setCustomModel(modelName);
    localStorage.setItem("ninerouter_model", modelName);
  }

  async function handleSend(textToSend?: string) {
    const q = (textToSend || query).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const aiReply = await aiCopilotQuery(
        q,
        contextData,
        history,
        customApiKey || undefined,
        customModel || undefined
      );

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: aiReply,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Gagal menghubungi AI Server.";
      const errorResponse: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: `⚠️ **Error AI**: ${errMsg}\n\n*Petunjuk: Pastikan API Key 9router telah diset di server atau lewat tombol ⚙️ Pengaturan Key.*`,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-bulog-blue via-bulog-dark to-slate-900 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border border-sky-400/40 touch-manipulation group"
        aria-label="Tanya AI Copilot"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🤖</span>
        <span className="text-xs font-black tracking-wide hidden sm:inline">AI Copilot</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Copilot Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-lg h-[85vh] sm:h-[650px] flex flex-col overflow-hidden animate-zoom-in-95">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-bulog-dark to-bulog-blue text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl border border-white/20">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2">
                    AI Copilot Posko
                    <span className="text-[9px] bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-300/30 font-mono">
                      9router AI
                    </span>
                  </h3>
                  <p className="text-[10px] text-sky-200 font-medium">
                    Posko: {poskoAktif} ({contextData.kecamatan})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  title="Pengaturan API Key 9router"
                  className="p-2 text-sky-200 hover:text-white rounded-xl hover:bg-white/10 transition text-xs"
                >
                  ⚙️ Key
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-sky-200 hover:text-white rounded-xl hover:bg-white/10 transition"
                  aria-label="Tutup Copilot"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Config API Key & Model Drawer (Optional Override) */}
            {showKeyInput && (
              <div className="px-4 py-3 bg-slate-900 text-white text-xs border-b border-slate-800 space-y-2 animate-fade-in-up">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sky-300 text-[11px]">⚙️ Pengaturan 9router AI:</span>
                  <button onClick={() => setShowKeyInput(false)} className="text-[10px] text-slate-400 hover:text-white">Tutup</button>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Combo / Model ID (Default: SuperAdmin):</label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => handleSaveModel(e.target.value)}
                    placeholder="Contoh: SuperAdmin"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">API Key (Opsional):</label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => handleSaveKey(e.target.value)}
                    placeholder="Masukkan sk-xxxx-api-key-9router..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                </div>
                <p className="text-[9px] text-slate-400">Tersimpan di browser lokal Anda.</p>
              </div>
            )}

            {/* Quick Action Chips */}
            <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex gap-2 overflow-x-auto text-[11px] flex-shrink-0">
              <button
                onClick={() => handleSend("Bagaimana ringkasan SOP penyaluran beras 30 Kg di meja posko?")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg whitespace-nowrap border border-slate-300 shadow-2xs transition"
              >
                📖 SOP Salur 30Kg
              </button>
              <button
                onClick={() => handleSend("Berikan analisis ringkasan data realisasi posko saat ini.")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg whitespace-nowrap border border-slate-300 shadow-2xs transition"
              >
                📊 Analisis Posko
              </button>
              <button
                onClick={() => handleSend("Apa syarat dan aturan pengisian dokumen SPTJM Pengganti?")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg whitespace-nowrap border border-slate-300 shadow-2xs transition"
              >
                📄 Aturan SPTJM
              </button>
              <button
                onClick={() => handleSend("Bagaimana solusi jika tanda tangan di BAST kertas terlanjur salah baris/nyasar?")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-lg whitespace-nowrap border border-slate-300 shadow-2xs transition"
              >
                ⚠️ TTD Nyasar
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${
                      m.role === "user" ? "bg-bulog-blue text-white" : "bg-sky-100 text-sky-800 font-bold border border-sky-300"
                    }`}
                  >
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-bulog-blue text-white rounded-tr-xs shadow-xs"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 items-center text-xs text-slate-500">
                  <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center text-xs border border-sky-300">🤖</div>
                  <div className="px-3 py-2 bg-white border border-slate-200 rounded-2xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                    <span className="font-semibold text-[11px] text-slate-600">AI sedang berpikir & menyusun jawaban...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tanyakan SOP, data posko, atau aturan SPTJM..."
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-bulog-blue/40"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading || !query.trim()}
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                }
              >
                Kirim
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
