/**
 * services/masterData.ts
 * Logic validasi struktur header, normalisasi baris Excel master,
 * penambahan metadata provenance (_sourceFile, _sourceRow, _rawColumns),
 * dan pembuatan Laporan Impor Konkret & Log Data Bermasalah.
 */

import type { MasterRow, ImporReport, LogBermasalahItem } from "@/types";
import { formatWaktuSekarang, fixNIK } from "@/lib/utils";

export interface ValidasiHeaderResult {
  isValid: boolean;
  kolomAda: string[];
  kolomHilang: string[];
  pesanError?: string;
}

export function validasiStrukturHeaderMaster(headers: string[]): ValidasiHeaderResult {
  const cleanHeaders = headers.map((h) => h.trim().toUpperCase().replace(/[\s_.\-\/]/g, ""));
  const hasNama = cleanHeaders.some((a) => a.includes("NAMA"));

  if (!hasNama) {
    return {
      isValid: false,
      kolomAda: [],
      kolomHilang: ["NAMA"],
      pesanError: `Struktur kolom Excel tidak valid! Kolom NAMA wajib ditemukan. Kolom terdeteksi di file: [${headers.slice(0, 10).join(", ")}].`,
    };
  }

  return { isValid: true, kolomAda: ["NAMA"], kolomHilang: [] };
}

export function normalizeMasterRow(
  r: Record<string, unknown>,
  fileName: string = "File_Master.xlsx",
  rowIndex: number = 2
): MasterRow {
  const norm: Record<string, unknown> = {};
  for (const k in r) {
    const cleanKey = k.trim().toUpperCase().replace(/[\s_.\-\/]/g, "");
    norm[cleanKey] = r[k];
  }

  const nama =
    norm["NAMA"] ||
    norm["NAMALENGKAP"] ||
    norm["NAMAPBP"] ||
    norm["NAMAPENERIMA"] ||
    norm["NAMAKEPALAKELUARGA"] ||
    norm["NAMAWARGA"] ||
    "";

  let rawNik = String(
    norm["NIK"] ??
    norm["NIKKPM"] ??
    norm["NIKPENERIMA"] ??
    norm["NIKWARGA"] ??
    norm["NONIK"] ??
    norm["NOKTP"] ??
    norm["NOMORKTP"] ??
    norm["NIKPBP"] ??
    norm["KTP"] ??
    norm["NIKHEAD"] ??
    norm["NIKAKG"] ??
    norm["NOIDENTITAS"] ??
    norm["IDPENERIMA"] ??
    norm["KPMID"] ??
    norm["NIKKEPALAKELUARGA"] ??
    ""
  );

  if (!rawNik) {
    for (const nk in norm) {
      if (nk.includes("NIK") || nk.includes("NOKTP") || nk.includes("NONIK")) {
        if (norm[nk]) {
          rawNik = String(norm[nk]);
          break;
        }
      }
    }
  }

  const rawKK = String(
    norm["NOKK"] ?? norm["NOMORKK"] ?? norm["KK"] ?? norm["KARTUKELUARGA"] ?? ""
  );
  const noKK = fixNIK(rawKK);

  const kelurahan =
    norm["KELURAHAN"] ??
    norm["KELNAME"] ??
    norm["NAMAKELURAHAN"] ??
    norm["DESAKELURAHAN"] ??
    norm["KEL"] ??
    norm["DESA"] ??
    "";
  const kecamatan =
    norm["KECAMATAN"] ?? norm["KECNAME"] ?? norm["NAMAKECAMATAN"] ?? norm["KEC"] ?? "";
  const alamat =
    norm["ALAMAT"] ?? norm["ALAMATLENGKAP"] ?? norm["ALAMATKTP"] ?? norm["ALAMATTINGGAL"] ?? norm["JALAN"] ?? "";
  
  const rawRt = norm["RT"] ?? norm["NORT"] ?? norm["NOMORT"] ?? "";
  const rawRw = norm["RW"] ?? norm["NORW"] ?? norm["NOMORW"] ?? "";
  const rt = String(rawRt !== null && rawRt !== undefined ? rawRt : "").trim();
  const rw = String(rawRw !== null && rawRw !== undefined ? rawRw : "").trim();

  const usia = norm["USIA"] ?? norm["UMUR"] ?? "";
  const hubungan =
    norm["HUBUNGANKELUARGA"] ?? norm["HUBUNGAN"] ?? norm["STATUSKELUARGA"] ?? norm["SHDK"] ?? "";
  const desil = norm["DESIL"] ?? norm["P3KE"] ?? norm["KATEGORI"] ?? "";
  const bansos = norm["BANSOS"] ?? norm["PROGRAM"] ?? norm["BANTUAN"] ?? "Sembako";
  const idWilayah = String(norm["IDWILAYAH"] ?? norm["KODEWILAYAH"] ?? norm["ID"] ?? "").trim();

  let nik = fixNIK(rawNik);
  let isTanpaNIK = false;
  if (!nik) {
    isTanpaNIK = true;
    const cleanIdW = fixNIK(idWilayah);
    nik = cleanIdW && cleanIdW.length >= 6 ? cleanIdW : `IDW-${rowIndex}`;
  }

  return {
    ...r,
    NAMA: String(nama).trim(),
    NIK: nik,
    NO_KK: noKK,
    KEL_NAME: String(kelurahan).trim(),
    KEC_NAME: String(kecamatan).trim(),
    ALAMAT: String(alamat).trim(),
    NO_RT: rt,
    NO_RW: rw,
    USIA: String(usia).trim(),
    HUBUNGAN_KELUARGA: String(hubungan).trim(),
    DESIL: String(desil).trim(),
    bansos: String(bansos).trim(),
    ID_WILAYAH: String(idWilayah).trim(),

    // Provenance Metadata
    _sourceFile: fileName,
    _sourceRow: rowIndex,
    _isTanpaNIK: isTanpaNIK,
    _rawColumns: r,
  };
}

export function prosesImportMasterDataWithReport(
  rawRows: Record<string, unknown>[],
  fileName: string
): {
  validRecords: MasterRow[];
  report: ImporReport;
  logBermasalahItems: LogBermasalahItem[];
} {
  const validRecords: MasterRow[] = [];
  const logBermasalahItems: LogBermasalahItem[] = [];
  const contohBarisGagal: ImporReport["contohBarisGagal"] = [];

  const nikSeenMap = new Map<string, number>();
  let totalSkipped = 0;
  let totalDuplikat = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const rawObj = rawRows[i];
    const excelRowIndex = i + 2; // Baris 1 biasanya header

    const normalized = normalizeMasterRow(rawObj, fileName, excelRowIndex);

    // Validasi Nama wajib terisi
    if (!normalized.NAMA) {
      totalSkipped++;
      const pesan = "Nama Kosong pada file Master Data";

      logBermasalahItems.push({
        id: Math.random().toString(36).slice(2),
        sumber: "MASTER_EXCEL",
        fileAsal: fileName,
        nomorBarisOrPage: `Baris ${excelRowIndex}`,
        tipeMasalah: "HEADER_TIDAK_DITEMUKAN",
        pesanBahasa: pesan,
        dataMentah: rawObj,
        waktuPencatatan: formatWaktuSekarang(),
      });

      if (contohBarisGagal.length < 5) {
        contohBarisGagal.push({
          baris: excelRowIndex,
          alasan: pesan,
          mentah: rawObj,
        });
      }
      continue;
    }

    // Deteksi NIK duplikat (hanya untuk NIK asli, bukan IDW sintesis)
    if (!normalized._isTanpaNIK && normalized.NIK && nikSeenMap.has(normalized.NIK)) {
      totalDuplikat++;
      const barisAwal = nikSeenMap.get(normalized.NIK)!;
      const pesan = `NIK Duplikat (${normalized.NIK}) ditemukan pada Baris ${excelRowIndex}. Sebelumnya sudah muncul di Baris ${barisAwal}.`;

      logBermasalahItems.push({
        id: Math.random().toString(36).slice(2),
        sumber: "MASTER_EXCEL",
        fileAsal: fileName,
        nomorBarisOrPage: `Baris ${excelRowIndex}`,
        tipeMasalah: "NIK_DUPLIKAT",
        pesanBahasa: pesan,
        dataMentah: rawObj,
        waktuPencatatan: formatWaktuSekarang(),
      });

      if (contohBarisGagal.length < 5) {
        contohBarisGagal.push({
          baris: excelRowIndex,
          alasan: pesan,
          mentah: rawObj,
        });
      }
      // NIK duplikat tetap dimasukkan agar data tidak hilang, namun dicatat di log
    } else {
      nikSeenMap.set(normalized.NIK, excelRowIndex);
    }

    validRecords.push(normalized);
  }

  const report: ImporReport = {
    namaFile: fileName,
    sumberType: "MASTER",
    totalBarisSumber: rawRows.length,
    totalBerhasilDimuat: validRecords.length,
    totalBarisSkipped: totalSkipped,
    totalDuplikat,
    contohBarisGagal,
    waktuImpor: formatWaktuSekarang(),
  };

  return { validRecords, report, logBermasalahItems };
}
