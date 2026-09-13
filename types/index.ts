/**
 * types/index.ts
 * Definisi tipe data domain bisnis sistem posko Bulog + tipe UI/ERP + Generator SPTJM Resmi.
 */

export interface MasterRow {
  NAMA: string;
  NIK: string;
  NO_KK: string;
  KEL_NAME: string;
  KEC_NAME: string;
  ALAMAT: string;
  NO_RT: string;
  NO_RW: string;
  USIA: string;
  HUBUNGAN_KELUARGA: string;
  DESIL: string;
  bansos: string;
  ID_WILAYAH: string;
  // Metadata Sumber & Keterlakukan (Provenance)
  _sourceFile?: string;
  _sourceRow?: number;
  _isTanpaNIK?: boolean;
  _rawColumns?: Record<string, unknown>;
  [key: string]: unknown;
}

export type StatusPencocokanBAST = 
  | "MATCHED" 
  | "TIDAK_ADA_DI_MASTER" 
  | "PERLU_VERIFIKASI_MANUAL";

export interface BastRow {
  NAMA: string;
  KELURAHAN_BAST: string;
  BARCODE: string;
  NIK: string;
  NO_KK: string;
  NO_URUT: number | null;
  ALAMAT_BAST: string;
  NO_RT?: string;
  NO_RW?: string;
  // Metadata Keterlakukan & Cross-check Instant
  _sourceFile?: string;
  _sourceRow?: number;
  _sourcePage?: number;
  _statusPencocokan?: StatusPencocokanBAST;
  _masterMatchNIK?: string;
  _masterMatchNama?: string;
}

export interface LogEntry {
  waktu: string;
  nama: string;
  nik: string;
  kelurahanAsal: string;
  posko: string;
  status: "SUKSES_SALUR" | "ALIH_PENGADUAN";
  alokasiKg: number;
}

export interface AuditRow {
  no: number | string;
  nik: string;
  nama: string;
  no_kk?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  status_pbp: string;
  nama_pengganti: string;
  nik_pengganti: string;
  no_kk_pengganti?: string;
  alamat_pengganti?: string;
  pekerjaan_pengganti?: string;
  no_bast?: string;
  notes: string;
  kelurahan: string;
  status_serah: string;
  verification_status?: string; // Dari Excel: "Belum diverifikasi" / "Sudah diverifikasi"
  _sourceFile?: string;
  _sourceRow?: number;
  _tipeEkspor?: "SUDAH_DISERAHKAN" | "BELUM_DISERAHKAN";
}

export interface AnomaliRow {
  nama: string;
  nik: string;
  kelBAST: string;
  kelMaster: string;
  alamatMaster: string;
  status: string;
}

export interface ActivePBP {
  master: MasterRow | null;
  bast: BastRow | null;
  posko: string;
}

export type ActiveTab = "dashboard" | "posko" | "log" | "audit" | "bermasalah" | "panduan" | "chat";

export interface ChatPoskoItem {
  id: string;
  created_at: string;
  posko: string;
  kecamatan: string;
  nama_petugas: string;
  pesan: string;
  tipe: "normal" | "info" | "peringatan";
}

export interface SessionPosko {
  email: string;
  namaPosko: string;
  kecamatan: string;
  isSuper: boolean;
  isLoggedIn: boolean;
}

export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export type KategoriSelisih =
  | "TUNGGU_INPUT_WEB"   // Fisik sudah diserahkan di posko / BAST ada, tapi Web Bulog masih tertera Belum Diserahkan
  | "BELUM_DIAMBIL"      // Web Bulog Belum Diserahkan & Posko belum ada pelayanan
  | "HUMAN_ERROR_BAST"   // Ditulis Pengganti padahal terdaftar di DTKS/1 KK
  | "POTENSI_TTD_NYASAR" // Web Bulog Sudah Diserahkan, tapi Fisik BAST / Log Posko Belum Ada
  | "MATCH_LENGKAP";     // Cocok sempurna

export interface SelisihAuditRow {
  noUrut?: number | null;
  nik: string;
  nikBast?: string;
  nama: string;
  noKK: string;
  kelurahan: string;
  rt: string;
  rw: string;
  alamat: string;
  statusWebBulog: string; // "Sudah Diserahkan" / "Belum Diserahkan"
  verificationStatus: string;  // "Belum diverifikasi" / "Sudah diverifikasi"
  statusPosko: string;    // "Sudah Diserahkan" / "Pengaduan" / "Belum Dilayani"
  adaBASTFisik: boolean;
  kategoriSelisih: KategoriSelisih;
  catatanRekomendasi: string;
  dugaanSalahKetikNIK?: string;
  sumberDataEkspresil?: string;
}

export interface LogBermasalahItem {
  id: string;
  sumber: "MASTER_EXCEL" | "BAST_PDF" | "BAST_EXCEL" | "EKSPOR_BULOG";
  fileAsal: string;
  nomorBarisOrPage: string;
  tipeMasalah: 
    | "HEADER_TIDAK_DITEMUKAN"
    | "NIK_INVALID"
    | "NIK_DUPLIKAT"
    | "TIDAK_ADA_DI_MASTER"
    | "PERLU_VERIFIKASI_MANUAL"
    | "EKSTRAKSI_PDF_SELISIH"
    | "BENTROK_DUA_FILE_BULOG"
    | "STRUKTUR_FILE_RUSAK"
    | "POTENSI_TTD_NYASAR"
    | "NIK_PENGGANTI_KOSONG"
    | "PENGGANTI_NON_DTKS"
    | "BEDA_KELURAHAN_ANOMALI"
    | "PBP_PENGGANTI_TERTOLAK";
  pesanBahasa: string;
  dataMentah: Record<string, unknown>;
  waktuPencatatan: string;
}

export interface ImporReport {
  namaFile: string;
  sumberType: "MASTER" | "BAST" | "AUDIT";
  totalBarisSumber: number;
  totalBerhasilDimuat: number;
  totalBarisSkipped: number;
  totalDuplikat: number;
  contohBarisGagal: { baris: number; alasan: string; mentah: Record<string, unknown> }[];
  waktuImpor: string;
}

export interface RiwayatEksporBulog {
  id: string;
  namaFile: string;
  tipeEkspor: "SUDAH_DISERAHKAN" | "BELUM_DISERAHKAN";
  waktuUnggah: string;
  tanggalDitarikPetugas: string;
  totalBaris: number;
  barisRecords: AuditRow[];
}

// Tipe Data Khusus Generator SPTJM Resmi Bulog
export interface PengaturanWilayahSPTJM {
  provinsi: string;
  kabupatenKota: string;
  alokasiBulan: string;
  namaLurah?: string;
  nipLurah?: string;
  namaPetugasPosko?: string;
}

export interface DetailItemSPTJM {
  id: string;
  noBast: string;
  kelurahan: string;
  kecamatan: string;

  // PBP Awal (Hak)
  pbpAwalNIK: string;
  pbpAwalNoKK: string;
  pbpAwalNama: string;
  pbpAwalAlamat: string;

  // PBP Pengganti
  penggantiNIK: string;
  penggantiNoKK: string;
  penggantiNama: string;
  penggantiAlamat: string;
  penggantiPekerjaan: string;

  // Track sumber & status validasi
  isValidComplete: boolean;
  alasanBermasalah: string[];
  rawAuditRow?: AuditRow;
}

export interface LogPenggantiTertolak {
  id: string;
  waktu: string;
  posko: string;
  nama: string;
  nik: string;
  noKK: string;
  catatan: string;
}

export interface KelompokDokumenSPTJM {
  noBast: string;
  kelurahan: string;
  kecamatan: string;
  provinsi: string;
  kabupatenKota: string;
  alokasiBulan: string;
  daftarKasus: DetailItemSPTJM[];
  totalKasus: number;
  isValidAll: boolean;
}
