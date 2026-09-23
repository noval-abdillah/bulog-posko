/**
 * store/appStore.ts
 * Store terpusat Zustand — state data bisnis + Data Bermasalah + Generator SPTJM Resmi + Chat & Auth.
 */

import { create } from "zustand";
import type {
  MasterRow,
  BastRow,
  LogEntry,
  AuditRow,
  AnomaliRow,
  ActivePBP,
  ActiveTab,
  ToastItem,
  LogBermasalahItem,
  ImporReport,
  RiwayatEksporBulog,
  PengaturanWilayahSPTJM,
  LogPenggantiTertolak,
  ChatPoskoItem,
  SessionPosko,
} from "@/types";

import {
  simpanMasterKeDB,
  simpanBastKeDB,
  simpanLogKeDB,
  simpanAuditKeDB,
  simpanPenggantiTertolakKeDB,
  ambilMasterDariDB,
  ambilBastDariDB,
  ambilLogDariDB,
  ambilAuditDariDB,
  ambilPenggantiTertolakDariDB,
  bersihkanSemuaDB,
} from "@/lib/db";
import { cleanStr, cleanNum, fixNIK } from "@/lib/utils";
import { kirimLogPelayananKeSupabase, upsertRingkasanKelurahan } from "@/lib/supabasePosko";

type AuditPenandaStatus = "VERIFIED" | "REVIEW" | "MISMATCH";

function getAuditRowKey(row: AuditRow, idx?: number): string {
  const nik = fixNIK(row.nik) || cleanNum(row.nik);
  const nikPengganti = fixNIK(row.nik_pengganti) || cleanNum(row.nik_pengganti);

  if (!nik || nik === "—") {
    return `${row._sourceFile || "file"}_${row._sourceRow ?? idx ?? Math.random()}_${cleanStr(row.nama)}`;
  }

  return [
    nik,
    cleanStr(row.kelurahan),
    cleanStr(row.status_pbp),
    nikPengganti,
    cleanStr(row.nama_pengganti),
  ].join("|");
}

function dedupeAuditRows(records: AuditRow[]): AuditRow[] {
  const seen = new Map<string, AuditRow>();
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const key = getAuditRowKey(row, i);
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

interface AppState {
  /* --- navigasi & UI --- */
  activeTab: ActiveTab;
  sidebarOpen: boolean;
  toasts: ToastItem[];
  poskoAktif: string;
  poskoSearchQuery: string;
  isRestoredFromDB: boolean;

  /* --- data bisnis --- */
  masterRecords: MasterRow[];
  bastRecords: BastRow[];
  loadedBASTFiles: string[];
  bulogExportRecords: AuditRow[];
  bulogSudahSerahRecords: AuditRow[];
  bulogBelumSerahRecords: AuditRow[];
  logPelayanan: LogEntry[];
  logPenggantiTertolak: LogPenggantiTertolak[];
  anomaliRecordsCache: AnomaliRow[];
  currentActivePBP: ActivePBP | null;
  auditPenandaMap: Record<string, AuditPenandaStatus>;
  auditFisikRecords: AuditRow[];
  poskoYangDiload: string | null;

  /* --- auth & chat --- */
  sessionPosko: SessionPosko | null;
  chatMessages: ChatPoskoItem[];
  unreadChatCount: number;
  namaPetugasChat: string;

  /* --- data bermasalah & audit provenance --- */
  logBermasalah: LogBermasalahItem[];
  imporReports: ImporReport[];
  riwayatEksporBulog: RiwayatEksporBulog[];

  /* --- pengaturan SPTJM Resmi Bulog --- */
  pengaturanSPTJM: PengaturanWilayahSPTJM;

  /* --- index cepat --- */
  masterByNIK: Map<string, MasterRow>;
  masterByName: Map<string, MasterRow[]>;
  masterByKK: Map<string, MasterRow[]>;
  bastByNIK: Map<string, BastRow>;
  bastByNoUrut: Map<string, BastRow>;

  /* --- aksi UI --- */
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPoskoAktif: (posko: string) => void;
  setPoskoSearchQuery: (query: string) => void;
  tambahToast: (type: ToastItem["type"], message: string, onClickTab?: ActiveTab) => void;
  hapusToast: (id: string) => void;

  /* --- aksi data & storage --- */
  setMasterRecords: (records: MasterRow[]) => void;
  setBastRecords: (records: BastRow[]) => void;
  appendBastRecords: (records: BastRow[], kelurahan: string) => void;
  setBulogExportRecords: (records: AuditRow[]) => void;
  setBulogSudahSerahRecords: (records: AuditRow[]) => void;
  setBulogBelumSerahRecords: (records: AuditRow[]) => void;
  setCurrentActivePBP: (pbp: ActivePBP | null) => void;
  setAuditPenandaMap: (map: Record<string, AuditPenandaStatus>) => void;
  setAuditFisikRecords: (rows: AuditRow[]) => void;
  setPoskoYangDiload: (kel: string | null) => void;
  tambahLogPelayanan: (entry: LogEntry) => void;
  bersihkanLog: () => void;
  tambahPenggantiTertolak: (entry: LogPenggantiTertolak) => void;
  hapusPenggantiTertolak: (id: string) => void;
  bersihkanPenggantiTertolak: () => void;
  setAnomaliCache: (cache: AnomaliRow[]) => void;
  setPengaturanSPTJM: (pengaturan: Partial<PengaturanWilayahSPTJM>) => void;
  muatDataDariDB: () => Promise<void>;
  resetSemuaData: () => Promise<void>;

  /* --- aksi auth & chat --- */
  setSessionPosko: (session: SessionPosko | null) => void;
  setChatMessages: (msgs: ChatPoskoItem[]) => void;
  tambahChatMessage: (msg: ChatPoskoItem) => void;
  setNamaPetugasChat: (nama: string) => void;
  incrementUnread: () => void;
  resetUnreadCount: () => void;

  /* --- aksi data bermasalah & provenance --- */
  tambahLogBermasalah: (items: LogBermasalahItem[]) => void;
  bersihkanDataBermasalah: () => void;
  tambahImporReport: (report: ImporReport) => void;
  tambahRiwayatEksporBulog: (riwayat: RiwayatEksporBulog) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: "dashboard",
  sidebarOpen: true,
  toasts: [],
  poskoAktif: "Rawa Badak Utara",
  poskoSearchQuery: "",
  isRestoredFromDB: false,

  masterRecords: [],
  bastRecords: [],
  loadedBASTFiles: [],
  bulogExportRecords: [],
  bulogSudahSerahRecords: [],
  bulogBelumSerahRecords: [],
  logPelayanan: [],
  logPenggantiTertolak: [],
  anomaliRecordsCache: [],
  currentActivePBP: null,
  auditPenandaMap: {},
  auditFisikRecords: [],
  poskoYangDiload: null,

  sessionPosko: null,
  chatMessages: [],
  unreadChatCount: 0,
  namaPetugasChat: "",

  logBermasalah: [],
  imporReports: [],
  riwayatEksporBulog: [],

  pengaturanSPTJM: {
    provinsi: "DKI JAKARTA",
    kabupatenKota: "KOTA JAKARTA UTARA",
    alokasiBulan: "JULI - SEPTEMBER 2026",
    namaLurah: "",
    nipLurah: "",
    namaPetugasPosko: "",
  },

  masterByNIK: new Map(),
  masterByName: new Map(),
  masterByKK: new Map(),
  bastByNIK: new Map(),
  bastByNoUrut: new Map(),

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setPoskoAktif: (posko) => set({ poskoAktif: posko }),
  setPoskoSearchQuery: (query) => set({ poskoSearchQuery: query }),

  tambahToast: (type, message, onClickTab) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message, onClickTab }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 6000);
  },

  hapusToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setMasterRecords: (records) => {
    const masterByNIK = new Map<string, MasterRow>();
    const masterByName = new Map<string, MasterRow[]>();
    const masterByKK = new Map<string, MasterRow[]>();

    for (const r of records) {
      if (r.NIK && r.NIK.length >= 10) masterByNIK.set(r.NIK, r);

      const nameKey = r.NAMA
        ? String(r.NAMA).toUpperCase().replace(/[^0-9A-Z]/g, "")
        : "";
      if (nameKey) {
        const list = masterByName.get(nameKey) ?? [];
        list.push(r);
        masterByName.set(nameKey, list);
      }

      if (r.NO_KK && r.NO_KK.length >= 10) {
        const kkList = masterByKK.get(r.NO_KK) ?? [];
        kkList.push(r);
        masterByKK.set(r.NO_KK, kkList);
      }
    }

    set({ masterRecords: records, masterByNIK, masterByName, masterByKK });
    simpanMasterKeDB(records).catch((err) => console.error("Gagal simpan Master ke IDB:", err));
  },

  setBastRecords: (records) => {
    const bastByNIK = new Map<string, BastRow>();
    const bastByNoUrut = new Map<string, BastRow>();
    for (const b of records) {
      if (b.NIK) {
        bastByNIK.set(b.NIK, b);
        const cNum = cleanNum(b.NIK);
        if (cNum) bastByNIK.set(cNum, b);
        const fNik = fixNIK(b.NIK);
        if (fNik) bastByNIK.set(fNik, b);
      }
      if (b.NO_URUT != null) {
        const kelKey = cleanStr(b.KELURAHAN_BAST);
        if (kelKey) bastByNoUrut.set(`${kelKey}_${b.NO_URUT}`, b);
        bastByNoUrut.set(String(b.NO_URUT), b);
      }
    }
    set({ bastRecords: records, bastByNIK, bastByNoUrut });
    simpanBastKeDB(records, get().loadedBASTFiles).catch((err) =>
      console.error("Gagal simpan BAST ke IDB:", err)
    );
  },

  appendBastRecords: (newRecords, kelurahan) => {
    const prev = get();
    const cleanTargetKel = cleanStr(kelurahan);

    const filteredPrevious = prev.bastRecords.filter((b) => {
      const bKelClean = cleanStr(b.KELURAHAN_BAST || "");
      if (!bKelClean || !cleanTargetKel) return true;
      return !bKelClean.includes(cleanTargetKel) && !cleanTargetKel.includes(bKelClean);
    });

    const merged = [...filteredPrevious, ...newRecords];
    const bastByNIK = new Map<string, BastRow>();
    const bastByNoUrut = new Map<string, BastRow>();

    for (const b of merged) {
      if (b.NIK) {
        bastByNIK.set(b.NIK, b);
        const cNum = cleanNum(b.NIK);
        if (cNum) bastByNIK.set(cNum, b);
        const fNik = fixNIK(b.NIK);
        if (fNik) bastByNIK.set(fNik, b);
      }
      if (b.NO_URUT != null) {
        const kelKey = cleanStr(b.KELURAHAN_BAST);
        if (kelKey) bastByNoUrut.set(`${kelKey}_${b.NO_URUT}`, b);
        bastByNoUrut.set(String(b.NO_URUT), b);
      }
    }

    const loadedBASTFiles = prev.loadedBASTFiles.includes(kelurahan)
      ? prev.loadedBASTFiles
      : [...prev.loadedBASTFiles, kelurahan];

    set({ bastRecords: merged, bastByNIK, bastByNoUrut, loadedBASTFiles });
    simpanBastKeDB(merged, loadedBASTFiles).catch((err) =>
      console.error("Gagal simpan BAST ke IDB:", err)
    );
    upsertRingkasanKelurahan({
      kelurahan,
      kecamatan: get().sessionPosko?.kecamatan ?? "",
      bast_jumlah: newRecords.length,
      bast_diupload_at: new Date().toISOString(),
    }).catch(() => undefined);
  },

  setBulogExportRecords: (records) => {
    const deduped = dedupeAuditRows(records);
    set({ bulogExportRecords: deduped });
    simpanAuditKeDB(deduped).catch((err) => console.error("Gagal simpan Audit ke IDB:", err));
  },

  setBulogSudahSerahRecords: (records) => {
    const dedupedSudah = dedupeAuditRows(records);
    set({ bulogSudahSerahRecords: dedupedSudah });
    const currentCombined = dedupeAuditRows([...dedupedSudah, ...get().bulogBelumSerahRecords]);
    set({ bulogExportRecords: currentCombined });
    simpanAuditKeDB(currentCombined).catch((err) => console.error("Gagal simpan Audit ke IDB:", err));
    const s = get();
    upsertRingkasanKelurahan({
      kelurahan: s.poskoAktif,
      kecamatan: s.sessionPosko?.kecamatan ?? "",
      sudah_serah_jumlah: dedupedSudah.length,
    }).catch(() => undefined);
  },

  setBulogBelumSerahRecords: (records) => {
    const dedupedBelum = dedupeAuditRows(records);
    set({ bulogBelumSerahRecords: dedupedBelum });
    const currentCombined = dedupeAuditRows([...get().bulogSudahSerahRecords, ...dedupedBelum]);
    set({ bulogExportRecords: currentCombined });
    simpanAuditKeDB(currentCombined).catch((err) => console.error("Gagal simpan Audit ke IDB:", err));
    const s = get();
    upsertRingkasanKelurahan({
      kelurahan: s.poskoAktif,
      kecamatan: s.sessionPosko?.kecamatan ?? "",
      belum_serah_jumlah: dedupedBelum.length,
    }).catch(() => undefined);
  },

  setCurrentActivePBP: (pbp) => set({ currentActivePBP: pbp }),
  setAuditPenandaMap: (map) => {
    set({ auditPenandaMap: map });
    const values = Object.values(map);
    const s = get();
    upsertRingkasanKelurahan({
      kelurahan: s.poskoAktif,
      kecamatan: s.sessionPosko?.kecamatan ?? "",
      verified_fisik: values.filter((v) => v === "VERIFIED").length,
      review_fisik: values.filter((v) => v === "REVIEW").length,
      mismatch_fisik: values.filter((v) => v === "MISMATCH").length,
    }).catch(() => undefined);
  },
  setAuditFisikRecords: (rows) => set({ auditFisikRecords: rows }),
  setPoskoYangDiload: (kel) => set({ poskoYangDiload: kel }),

  tambahLogPelayanan: (entry) => {
    set((s) => {
      const nextLogs = [entry, ...s.logPelayanan];
      simpanLogKeDB(nextLogs).catch((err) => console.error("Gagal simpan Log ke IDB:", err));
      return { logPelayanan: nextLogs };
    });
    const s = get();
    const kecamatan = s.sessionPosko?.kecamatan ?? "";
    kirimLogPelayananKeSupabase(entry, kecamatan).catch(() => undefined);
    const sukses    = s.logPelayanan.filter((l) => l.status === "SUKSES_SALUR").length;
    const pengaduan = s.logPelayanan.filter((l) => l.status === "ALIH_PENGADUAN").length;
    upsertRingkasanKelurahan({
      kelurahan: s.poskoAktif,
      kecamatan,
      total_sukses:    entry.status === "SUKSES_SALUR"    ? sukses + 1    : sukses,
      total_pengaduan: entry.status === "ALIH_PENGADUAN"  ? pengaduan + 1 : pengaduan,
    }).catch(() => undefined);
  },

  bersihkanLog: () => {
    set({ logPelayanan: [] });
    simpanLogKeDB([]).catch((err) => console.error("Gagal bersihkan Log di IDB:", err));
  },

  tambahPenggantiTertolak: (entry) => {
    set((s) => {
      const nextList = [entry, ...s.logPenggantiTertolak];
      simpanPenggantiTertolakKeDB(nextList).catch((err) => console.error("Gagal simpan Pengganti Tertolak ke IDB:", err));
      return { logPenggantiTertolak: nextList };
    });
  },

  hapusPenggantiTertolak: (id) => {
    set((s) => {
      const nextList = s.logPenggantiTertolak.filter((p) => p.id !== id);
      simpanPenggantiTertolakKeDB(nextList).catch((err) => console.error("Gagal update Pengganti Tertolak ke IDB:", err));
      return { logPenggantiTertolak: nextList };
    });
  },

  bersihkanPenggantiTertolak: () => {
    set({ logPenggantiTertolak: [] });
    simpanPenggantiTertolakKeDB([]).catch((err) => console.error("Gagal bersihkan Pengganti Tertolak di IDB:", err));
  },

  setAnomaliCache: (cache) => set({ anomaliRecordsCache: cache }),

  setPengaturanSPTJM: (pengaturan) =>
    set((s) => ({ pengaturanSPTJM: { ...s.pengaturanSPTJM, ...pengaturan } })),

  muatDataDariDB: async () => {
    try {
      const master = await ambilMasterDariDB();
      const bast = await ambilBastDariDB();
      const logs = await ambilLogDariDB();
      const audit = await ambilAuditDariDB();
      const penggantiTertolak = await ambilPenggantiTertolakDariDB();

      const masterByNIK = new Map<string, MasterRow>();
      const masterByName = new Map<string, MasterRow[]>();
      const masterByKK = new Map<string, MasterRow[]>();

      for (const r of master) {
        if (r.NIK && r.NIK.length >= 10) masterByNIK.set(r.NIK, r);
        const nameKey = r.NAMA
          ? String(r.NAMA).toUpperCase().replace(/[^0-9A-Z]/g, "")
          : "";
        if (nameKey) {
          const list = masterByName.get(nameKey) ?? [];
          list.push(r);
          masterByName.set(nameKey, list);
        }
        if (r.NO_KK && r.NO_KK.length >= 10) {
          const kkList = masterByKK.get(r.NO_KK) ?? [];
          kkList.push(r);
          masterByKK.set(r.NO_KK, kkList);
        }
      }

      const bastByNIK = new Map<string, BastRow>();
      const bastByNoUrut = new Map<string, BastRow>();
      for (const b of bast.records) {
        if (b.NIK) {
          bastByNIK.set(b.NIK, b);
          const cNum = cleanNum(b.NIK);
          if (cNum) bastByNIK.set(cNum, b);
          const fNik = fixNIK(b.NIK);
          if (fNik) bastByNIK.set(fNik, b);
        }
        if (b.NO_URUT != null) {
          const kelKey = cleanStr(b.KELURAHAN_BAST);
          if (kelKey) bastByNoUrut.set(`${kelKey}_${b.NO_URUT}`, b);
          bastByNoUrut.set(String(b.NO_URUT), b);
        }
      }

      const sudahList = dedupeAuditRows(audit.filter((a) => a._tipeEkspor === "SUDAH_DISERAHKAN"));
      const belumList = dedupeAuditRows(audit.filter((a) => a._tipeEkspor === "BELUM_DISERAHKAN"));
      const dedupedAudit = dedupeAuditRows(audit);

      set({
        masterRecords: master,
        masterByNIK,
        masterByName,
        masterByKK,
        bastRecords: bast.records,
        loadedBASTFiles: bast.files,
        bastByNIK,
        bastByNoUrut,
        logPelayanan: logs,
        logPenggantiTertolak: penggantiTertolak,
        bulogExportRecords: dedupedAudit,
        bulogSudahSerahRecords: sudahList,
        bulogBelumSerahRecords: belumList,
        isRestoredFromDB: true,
      });
    } catch (err) {
      console.error("Gagal memuat data dari IDB:", err);
    }
  },

  resetSemuaData: async () => {
    await bersihkanSemuaDB();
    set({
      masterRecords: [],
      bastRecords: [],
      loadedBASTFiles: [],
      bulogExportRecords: [],
      bulogSudahSerahRecords: [],
      bulogBelumSerahRecords: [],
      logPelayanan: [],
      logPenggantiTertolak: [],
      anomaliRecordsCache: [],
      sessionPosko: null,
      chatMessages: [],
      unreadChatCount: 0,
      namaPetugasChat: "",
      logBermasalah: [],
      imporReports: [],
      riwayatEksporBulog: [],
      currentActivePBP: null,
      auditPenandaMap: {},
      auditFisikRecords: [],
      poskoYangDiload: null,
      masterByNIK: new Map(),
      masterByName: new Map(),
      masterByKK: new Map(),
      bastByNIK: new Map(),
      bastByNoUrut: new Map(),
    });
  },

  setSessionPosko: (session) =>
    set((s) => ({
      sessionPosko: session,
      poskoAktif: session ? session.namaPosko : s.poskoAktif,
    })),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  tambahChatMessage: (msg) =>
    set((s) => {
      const exists = s.chatMessages.some((m) => m.id === msg.id);
      if (exists) return s;
      const isChatTabActive = s.activeTab === "chat";
      return {
        chatMessages: [...s.chatMessages, msg],
        unreadChatCount: isChatTabActive ? 0 : s.unreadChatCount + 1,
      };
    }),
  setNamaPetugasChat: (nama) => set({ namaPetugasChat: nama }),
  incrementUnread: () => set((s) => ({ unreadChatCount: s.unreadChatCount + 1 })),
  resetUnreadCount: () => set({ unreadChatCount: 0 }),

  tambahLogBermasalah: (items) =>
    set((s) => ({ logBermasalah: [...items, ...s.logBermasalah] })),

  bersihkanDataBermasalah: () => set({ logBermasalah: [] }),

  tambahImporReport: (report) =>
    set((s) => ({ imporReports: [report, ...s.imporReports] })),

  tambahRiwayatEksporBulog: (riwayat) =>
    set((s) => ({ riwayatEksporBulog: [riwayat, ...s.riwayatEksporBulog] })),
}));
