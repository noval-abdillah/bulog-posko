/**
 * components/ui/AICopilotModal.tsx
 * Floating AI Copilot Asisten SOP & Data Posko Bulog (powered by 9router AI).
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { aiCopilotQuery } from "@/lib/ai";
import { Button } from "@/components/ui/Button";
import { cleanStr, cleanNum, fixNIK } from "@/lib/utils";
import type { ActiveTab } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function renderAiMessageContent(
  content: string,
  onVerifyClick: (q: string) => void
) {
  const actionRegex = /\[ACTION:VERIFY\|([^|\]]+)\|([^|\]]+)(?:\|([^\]]+))?\]/g;
  const parts = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIdx, match.index);
    if (textBefore) parts.push(<span key={lastIdx}>{textBefore}</span>);

    const targetQuery = match[1].trim();
    const targetName = match[2].trim();
    const noUrut = match[3]?.trim();

    parts.push(
      <button
        key={match.index}
        onClick={() => onVerifyClick(targetQuery)}
        className="inline-flex items-center gap-1.5 my-1 mx-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl text-[11px] shadow-2xs transition touch-manipulation cursor-pointer"
      >
        <span>🔍 Buka di Meja Posko {noUrut ? `(No. ${noUrut})` : `(${targetName})`}</span>
      </button>
    );

    lastIdx = match.index + match[0].length;
  }

  const remaining = content.substring(lastIdx);
  if (remaining) parts.push(<span key={lastIdx}>{remaining}</span>);

  return <>{parts}</>;
}

export default function AICopilotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("SuperAdmin");
  const [customBaseUrl, setCustomBaseUrl] = useState("http://127.0.0.1:20128/v1");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const poskoAktif            = useAppStore((s) => s.poskoAktif);
  const sessionPosko          = useAppStore((s) => s.sessionPosko);
  const masterRecords        = useAppStore((s) => s.masterRecords);
  const bastRecords          = useAppStore((s) => s.bastRecords);
  const logPelayanan         = useAppStore((s) => s.logPelayanan);
  const bulogExportRecords   = useAppStore((s) => s.bulogExportRecords);
  const bulogBelumSerahRecords = useAppStore((s) => s.bulogBelumSerahRecords);
  const masterByNIK          = useAppStore((s) => s.masterByNIK);
  const masterByName         = useAppStore((s) => s.masterByName);
  const bastByNIK            = useAppStore((s) => s.bastByNIK);

  const setActiveTab         = useAppStore((s) => s.setActiveTab);
  const setPoskoSearchQuery  = useAppStore((s) => s.setPoskoSearchQuery);

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
    const savedBaseUrl = localStorage.getItem("ninerouter_base_url") ?? "";
    if (savedBaseUrl) setCustomBaseUrl(savedBaseUrl);
  }, []);

  const contextData = useMemo(() => {
    const sukses = logPelayanan.filter((l) => l.status === "SUKSES_SALUR").length;
    const pengaduan = logPelayanan.filter((l) => l.status === "ALIH_PENGADUAN").length;
    const cleanPosko = cleanStr(poskoAktif);

    const isPoskoMatch = (kel: string) => {
      const cleanKel = cleanStr(kel || "");
      if (!cleanKel || !cleanPosko) return true;
      return cleanKel === cleanPosko || cleanKel.includes(cleanPosko) || cleanPosko.includes(cleanKel);
    };

    // 1. Daftar Sisa Belum Ambil (Diambil dari File 2 Belum Diserahkan Web Bulog & BAST PDF, urut No. BAST)
    const poskoBast = bastRecords.filter((b) => isPoskoMatch(b.KELURAHAN_BAST || ""));
    const servedNIKs = new Set(logPelayanan.filter((l) => l.status === "SUKSES_SALUR").map((l) => fixNIK(l.nik)));

    const sourceBelum = bulogBelumSerahRecords.length > 0
      ? bulogBelumSerahRecords
      : bulogExportRecords.filter((r) => String(r.status_serah || "").toLowerCase().includes("belum") || r._tipeEkspor === "BELUM_DISERAHKAN");

    let sisaBelumAmbilList: { noUrut: number | null; nama: string; nik: string; noKK: string; rt: string; rw: string; alamat: string; kelurahan: string; verificationStatus: string }[] = [];

    if (sourceBelum.length > 0) {
      sisaBelumAmbilList = sourceBelum.map((r) => {
        const nikClean = fixNIK(r.nik) || cleanNum(r.nik);
        const namaClean = cleanStr(r.nama);

        let extractedNoUrut: number | null = null;
        const rawNoBastStr = String(r.no_bast || r.no || "").trim();
        const noMatch = rawNoBastStr.match(/(\d{1,5})$/);
        if (noMatch) extractedNoUrut = parseInt(noMatch[1], 10);

        const bastMatch = (nikClean ? bastByNIK.get(nikClean) ?? null : null)
          || (extractedNoUrut ? bastRecords.find((b) => b.NO_URUT === extractedNoUrut) ?? null : null)
          || (namaClean ? bastRecords.find((b) => cleanStr(b.NAMA) === namaClean || cleanStr(b.NAMA).includes(namaClean) || namaClean.includes(cleanStr(b.NAMA))) ?? null : null);

        const masterMatch = (nikClean ? masterByNIK.get(nikClean) ?? null : null)
          || (namaClean ? masterByName.get(namaClean)?.[0] ?? null : null);

        let finalRt = String(r.rt || "").trim();
        let finalRw = String(r.rw || "").trim();
        if (!finalRt && bastMatch?.NO_RT) finalRt = bastMatch.NO_RT;
        if (!finalRw && bastMatch?.NO_RW) finalRw = bastMatch.NO_RW;
        if (!finalRt && masterMatch?.NO_RT) finalRt = masterMatch.NO_RT;
        if (!finalRw && masterMatch?.NO_RW) finalRw = masterMatch.NO_RW;

        return {
          noUrut: bastMatch?.NO_URUT ?? extractedNoUrut ?? null,
          nama: r.nama || bastMatch?.NAMA || "—",
          nik: nikClean || bastMatch?.NIK || r.nik || "—",
          noKK: fixNIK(r.no_kk) || bastMatch?.NO_KK || masterMatch?.NO_KK || "—",
          rt: finalRt || "—",
          rw: finalRw || "—",
          alamat: r.alamat && r.alamat !== "—" && r.alamat !== "-" ? r.alamat : (bastMatch?.ALAMAT_BAST || masterMatch?.ALAMAT || "—"),
          kelurahan: r.kelurahan || bastMatch?.KELURAHAN_BAST || poskoAktif,
          verificationStatus: r.verification_status || "Belum diverifikasi",
        };
      });
    } else {
      sisaBelumAmbilList = poskoBast
        .filter((b) => {
          const n = fixNIK(b.NIK);
          return !n || !servedNIKs.has(n);
        })
        .map((b) => ({
          noUrut: b.NO_URUT ?? null,
          nama: b.NAMA,
          nik: b.NIK,
          noKK: b.NO_KK,
          rt: b.NO_RT || "—",
          rw: b.NO_RW || "—",
          alamat: b.ALAMAT_BAST,
          kelurahan: b.KELURAHAN_BAST,
          verificationStatus: "Belum diverifikasi",
        }));
    }

    sisaBelumAmbilList.sort((a, b) => {
      if (a.noUrut != null && b.noUrut != null) return a.noUrut - b.noUrut;
      if (a.noUrut != null) return -1;
      if (b.noUrut != null) return 1;
      return a.nama.localeCompare(b.nama);
    });

    // 2. Daftar Undangan Nyasar / Anomali Wilayah (BAST vs Master Data 142k Sebagai Acuan Utama)
    const undanganNyasarList: { noUrut: number | null; nama: string; nik: string; kelBAST: string; kelMaster: string; alamatMaster: string }[] = [];
    if (masterRecords.length > 0 && bastRecords.length > 0) {
      for (const b of poskoBast) {
        let match = null;
        if (b.NIK && masterByNIK.has(b.NIK)) {
          match = masterByNIK.get(b.NIK)!;
        } else {
          const found = masterByName.get(cleanStr(b.NAMA));
          if (found?.length) match = found[0];
        }

        if (match) {
          const kMaster = cleanStr(match.KEL_NAME || "");
          const kBAST = cleanStr(b.KELURAHAN_BAST || "");
          if (kMaster && kBAST && !kMaster.includes(kBAST) && !kBAST.includes(kMaster)) {
            undanganNyasarList.push({
              noUrut: b.NO_URUT ?? null,
              nama: b.NAMA,
              nik: b.NIK,
              kelBAST: b.KELURAHAN_BAST,
              kelMaster: match.KEL_NAME,
              alamatMaster: `${match.ALAMAT || ""} (RT ${match.NO_RT || "—"}/RW ${match.NO_RW || "—"})`,
            });
          }
        }
      }
    }

    // 3. Daftar PBP Belum Ambil yang Kurang Foto / Belum Diverifikasi di Web Bulog (Lengkap No. Urut BAST)
    const kurangFotoList: { noUrut: number | null; nama: string; nik: string; statusVerifikasi: string; statusSerah: string; rt: string; rw: string }[] = [];
    const sourceBelumSerah = bulogBelumSerahRecords.length > 0 ? bulogBelumSerahRecords : bulogExportRecords;

    for (const r of sourceBelumSerah) {
      const vStatus = String(r.verification_status || "").toLowerCase();
      const sSerah = String(r.status_serah || "").toLowerCase();
      const isBelumSerah = sSerah.includes("belum") || r._tipeEkspor === "BELUM_DISERAHKAN";
      const isKurangFotoOrBelumVerif = !vStatus || vStatus.includes("belum") || vStatus.includes("kurang") || vStatus.includes("photo");

      if (isBelumSerah && isKurangFotoOrBelumVerif) {
        const nikClean = fixNIK(r.nik) || cleanNum(r.nik);
        const namaClean = cleanStr(r.nama);
        const bastMatch = (nikClean ? bastByNIK.get(nikClean) ?? null : null)
          || (namaClean ? bastRecords.find((b) => cleanStr(b.NAMA) === namaClean) ?? null : null);

        kurangFotoList.push({
          noUrut: bastMatch?.NO_URUT ?? null,
          nama: r.nama,
          nik: r.nik,
          statusVerifikasi: r.verification_status || "Belum diverifikasi",
          statusSerah: r.status_serah || "Belum diserahkan",
          rt: r.rt || bastMatch?.NO_RT || "—",
          rw: r.rw || bastMatch?.NO_RW || "—",
        });
      }
    }

    kurangFotoList.sort((a, b) => {
      if (a.noUrut != null && b.noUrut != null) return a.noUrut - b.noUrut;
      if (a.noUrut != null) return -1;
      if (b.noUrut != null) return 1;
      return a.nama.localeCompare(b.nama);
    });

    // 4. Audit Kejanggalan SOP di Excel Web Bulog
    const kejanggalanSOPList: { tipe: string; nama: string; nik: string; keterangan: string }[] = [];
    for (const r of bulogExportRecords) {
      const sSerah = String(r.status_serah || "").toLowerCase();
      const isSudahSerah = sSerah.includes("sudah") || sSerah.includes("diterima") || r._tipeEkspor === "SUDAH_DISERAHKAN";
      const nClean = fixNIK(r.nik) || cleanNum(r.nik);
      const isServedInPosko = servedNIKs.has(nClean);

      if (isSudahSerah && !isServedInPosko) {
        kejanggalanSOPList.push({
          tipe: "POTENSI_TTD_NYASAR",
          nama: r.nama,
          nik: r.nik,
          keterangan: `Excel Bulog mencatat 'Sudah Diserahkan', namun Posko belum pernah memverifikasi fisik warga ini.`,
        });
      }

      if (r.status_pbp.toLowerCase().includes("pengganti")) {
        const nikP = fixNIK(r.nik_pengganti) || cleanNum(r.nik_pengganti);
        if (!nikP || nikP.length < 16) {
          kejanggalanSOPList.push({
            tipe: "NIK_PENGGANTI_KOSONG",
            nama: r.nama_pengganti || r.nama,
            nik: r.nik_pengganti || "—",
            keterangan: `PBP Pengganti (${r.nama_pengganti || r.nama}) NIK Pengganti kosong/kurang 16-digit di Excel Bulog.`,
          });
        }
      }
    }

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
      totalSisaBelumAmbil: sisaBelumAmbilList.length,
      daftarSisaBelumAmbil: sisaBelumAmbilList.slice(0, 80),
      totalUndanganNyasar: undanganNyasarList.length,
      daftarUndanganNyasar: undanganNyasarList.slice(0, 40),
      totalKurangFotoBelumAmbil: kurangFotoList.length,
      daftarKurangFotoBelumAmbil: kurangFotoList.slice(0, 60),
      totalKejanggalanSOP: kejanggalanSOPList.length,
      daftarKejanggalanSOP: kejanggalanSOPList.slice(0, 40),
    };
  }, [poskoAktif, sessionPosko, masterRecords, bastRecords, logPelayanan, bulogExportRecords, bulogBelumSerahRecords, masterByNIK, masterByName, bastByNIK]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  function handleOpenPoskoSearch(searchQuery: string) {
    setPoskoSearchQuery(searchQuery);
    setActiveTab("posko");
    setIsOpen(false);
  }

  function handleSaveKey(key: string) {
    setCustomApiKey(key);
    localStorage.setItem("ninerouter_api_key", key);
  }

  function handleSaveModel(modelName: string) {
    setCustomModel(modelName);
    localStorage.setItem("ninerouter_model", modelName);
  }

  function handleSaveBaseUrl(url: string) {
    setCustomBaseUrl(url);
    localStorage.setItem("ninerouter_base_url", url);
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
        customModel || undefined,
        customBaseUrl || undefined
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
                  <label className="block text-[10px] text-slate-400 mb-1">Base URL 9router (Default: http://127.0.0.1:20128/v1):</label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => handleSaveBaseUrl(e.target.value)}
                    placeholder="Contoh: http://127.0.0.1:20128/v1"
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
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
                onClick={() => handleSend("Tampilkan daftar sisa warga PBP yang BELUM MENGAMBIL BERAS urut No. BAST.")}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg whitespace-nowrap shadow-2xs transition"
              >
                📋 Sisa PBP Belum Ambil (No. BAST)
              </button>
              <button
                onClick={() => handleSend("Lakukan pemindaian 100% full scan BAST PDF vs Master Data 142k acuan utama untuk mencari UNDANGAN NYASAR di posko ini.")}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg whitespace-nowrap shadow-2xs transition"
              >
                🚨 Cari Undangan Nyasar (Master 142k)
              </button>
              <button
                onClick={() => handleSend("Cari dan tampilkan daftar warga PBP yang BELUM AMBIL BERAS yang status fotonya KURANG FOTO / BELUM DIVERIFIKASI di Excel Bulog beserta No. Urut BAST-nya.")}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg whitespace-nowrap shadow-2xs transition"
              >
                📸 PBP Belum Ambil Kurang Foto (No. BAST)
              </button>
              <button
                onClick={() => handleSend("Audit dan cari kejanggalan atau hal di luar SOP dari file Excel Web Bulog (potensi TTD nyasar, NIK pengganti kosong, pengganti non-DTKS).")}
                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg whitespace-nowrap shadow-2xs transition"
              >
                ⚠️ Audit Kejanggalan SOP Bulog
              </button>
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
                        ? "bg-bulog-blue text-white rounded-tr-xs shadow-xs font-medium"
                        : "bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-2xs font-medium"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {renderAiMessageContent(m.content, handleOpenPoskoSearch)}
                      </div>
                    )}
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
