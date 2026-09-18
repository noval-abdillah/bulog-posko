/**
 * services/auditBulog.ts
 * Logic filter, kategorisasi, dan Modul Rekonsiliasi Selisih 3-Way.
 * Menandingkan Master Data (142k), BAST/Log Posko, dan 2 File Ekspor Web Bulog Resmi (Sudah & Belum).
 * Mendukung pembacaan kolom `verification_status` dan `status_serah` murni dari Excel Web Bulog.
 */

import type { AuditRow, MasterRow, BastRow, LogEntry, SelisihAuditRow, KategoriSelisih } from "@/types";
import { cleanStr, cleanNum, fixNIK } from "@/lib/utils";
import { parseRtRwFromText } from "@/services/bastParser";

export type FilterAudit = "BedaKK" | "Pengganti" | "Semua" | "Normal" | "SatuKK";

export function filterAuditRows(
  records: AuditRow[],
  filter: FilterAudit,
  search: string
): AuditRow[] {
  let filtered = records;

  if (filter === "Semua") {
    const seen = new Set<string>();
    filtered = filtered.filter((r) => {
      const key = [
        fixNIK(r.nik) || cleanNum(r.nik),
        cleanStr(r.kelurahan),
        cleanStr(r.status_pbp),
        fixNIK(r.nik_pengganti) || cleanNum(r.nik_pengganti),
        cleanStr(r.nama_pengganti),
      ].join("|");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (filter === "BedaKK") {
    filtered = filtered.filter((r) => r.status_pbp.toLowerCase().includes("beda kk"));
  } else if (filter === "Pengganti") {
    filtered = filtered.filter((r) => r.status_pbp.toLowerCase().includes("pengganti"));
  } else if (filter === "Normal") {
    filtered = filtered.filter((r) => r.status_pbp.toLowerCase().includes("normal"));
  } else if (filter === "SatuKK") {
    filtered = filtered.filter((r) => r.status_pbp.toLowerCase().includes("satu kk"));
  }

  if (search) {
    const upper = search.trim().toUpperCase();
    filtered = filtered.filter(
      (r) =>
        r.nama.toUpperCase().includes(upper) ||
        r.nama_pengganti.toUpperCase().includes(upper) ||
        String(r.nik_pengganti).includes(upper) ||
        String(r.nik).includes(upper) ||
        String(r.no || "").includes(upper) ||
        String(r.no_bast || "").toUpperCase().includes(upper) ||
        String(r.kelurahan || "").toUpperCase().includes(upper)
    );
  }

  return filtered;
}

export function hitungStatistikBulog(records: AuditRow[]) {
  return {
    total: records.length,
    normal: records.filter((r) => r.status_pbp.toLowerCase().includes("normal")).length,
    pengganti: records.filter((r) => r.status_pbp.toLowerCase().includes("pengganti")).length,
    perwakilan: records.filter((r) => r.status_pbp.toLowerCase().includes("perwakilan")).length,
  };
}

/**
 * Modul Rekonsiliasi Selisih 3-Way Presisi
 * Membaca verification_status & status_serah dari Excel Web Bulog
 */
export function analisaSelisih3Way(
  bulogExportRecords: AuditRow[],
  masterRecords: MasterRow[],
  bastRecords: BastRow[],
  logPelayanan: LogEntry[],
  masterByNIK: Map<string, MasterRow>,
  masterByName: Map<string, MasterRow[]>,
  poskoAktif: string,
  bulogSudahSerahRecords: AuditRow[] = [],
  bulogBelumSerahRecords: AuditRow[] = []
): SelisihAuditRow[] {
  const seenRows = new Set<string>();
  const cleanPosko = cleanStr(poskoAktif);

  function isPoskoScope(kelurahan: string): boolean {
    const cleanKel = cleanStr(kelurahan);
    if (!cleanPosko || !cleanKel) return true;
    return cleanKel === cleanPosko || cleanKel.includes(cleanPosko) || cleanPosko.includes(cleanKel);
  }

  function getRowKey(row: AuditRow): string {
    return [
      fixNIK(row.nik) || cleanNum(row.nik),
      cleanStr(row.kelurahan),
      cleanStr(row.status_pbp),
      fixNIK(row.nik_pengganti) || cleanNum(row.nik_pengganti),
      cleanStr(row.nama_pengganti),
    ].join("|");
  }

  const logMapByNIK = new Map<string, LogEntry>();
  logPelayanan.forEach((l) => {
    if (l.nik && l.nik !== "-") logMapByNIK.set(cleanNum(l.nik), l);
  });

  const bastMapByNIK = new Map<string, BastRow>();
  bastRecords.forEach((b) => {
    if (b.NIK) bastMapByNIK.set(cleanNum(b.NIK), b);
  });

  const hasil: SelisihAuditRow[] = [];

  // Jika user mengunggah 2 file terpisah (Sudah & Belum)
  const isDuaFileAktif = bulogSudahSerahRecords.length > 0 || bulogBelumSerahRecords.length > 0;
  const recordsToProcess = isDuaFileAktif
    ? [...bulogSudahSerahRecords, ...bulogBelumSerahRecords]
    : bulogExportRecords;

  const hasMatchingPoskoInRecords = recordsToProcess.some((r) => {
    const kel = r.kelurahan;
    if (!kel) return true;
    if (isPoskoScope(kel)) return true;
    const n = fixNIK(r.nik) || cleanNum(r.nik);
    const m = n ? masterByNIK.get(n) : undefined;
    return m ? isPoskoScope(m.KEL_NAME || "") : false;
  });

  const shouldFilterByPosko = hasMatchingPoskoInRecords;

  for (const bRow of recordsToProcess) {
    const rowKey = getRowKey(bRow);
    if (seenRows.has(rowKey)) continue;
    seenRows.add(rowKey);

    const nikClean = fixNIK(bRow.nik) || cleanNum(bRow.nik);
    const namaClean = cleanStr(bRow.nama);
    const rowKelClean = cleanStr(bRow.kelurahan);

    const foundMaster = (nikClean ? masterByNIK.get(nikClean) : undefined) || (namaClean ? masterByName.get(namaClean)?.[0] : undefined);
    const masterMatch: MasterRow | null = foundMaster ?? null;

    if (shouldFilterByPosko && rowKelClean && !isPoskoScope(bRow.kelurahan)) {
      if (!masterMatch || !isPoskoScope(masterMatch.KEL_NAME || "")) continue;
    }

    const statusSerahWeb = String(bRow.status_serah || "").toLowerCase();
    const verificationStatus = String(bRow.verification_status || "Belum diverifikasi").trim();

    // Evaluasi presisi: Dibilang Sudah Serah HANYA JIKA status_serah memuat "sudah" ATAU file 1
    const isBelumSerahTeks = statusSerahWeb.includes("belum") || statusSerahWeb.includes("tidak");
    const isSudahSerahWeb =
      !isBelumSerahTeks &&
      (bRow._tipeEkspor === "SUDAH_DISERAHKAN" ||
        statusSerahWeb.includes("sudah") ||
        statusSerahWeb.includes("diterima") ||
        statusSerahWeb.includes("menerima") ||
        statusSerahWeb.includes("terima") ||
        statusSerahWeb.includes("salur") ||
        statusSerahWeb.includes("ya"));

    let extractedNoUrut: number | null = null;
    const rawNoBastStr = String(bRow.no_bast || bRow.no || "").trim();
    const noMatch = rawNoBastStr.match(/(\d{1,5})$/);
    if (noMatch) extractedNoUrut = parseInt(noMatch[1], 10);

    const logMatch = logMapByNIK.get(nikClean);
    const bastMatchRaw = (nikClean ? bastMapByNIK.get(nikClean) ?? null : null)
      || (extractedNoUrut ? bastRecords.find((b) => b.NO_URUT === extractedNoUrut) ?? null : null)
      || (namaClean ? bastRecords.find((b) => cleanStr(b.NAMA) === namaClean || cleanStr(b.NAMA).includes(namaClean) || namaClean.includes(cleanStr(b.NAMA))) ?? null : null);
    const bastMatch = bastMatchRaw && isPoskoScope(bastMatchRaw.KELURAHAN_BAST) ? bastMatchRaw : null;
    const isTerverifikasiPosko = Boolean(logMatch && logMatch.status === "SUKSES_SALUR");
    const adaFisik = Boolean(isTerverifikasiPosko || bastMatch);

    let statusPosko = "Belum Terverifikasi";
    if (isTerverifikasiPosko) {
      statusPosko = "Terverifikasi di Posko (30 Kg)";
    } else if (logMatch && logMatch.status === "ALIH_PENGADUAN") {
      statusPosko = "Dialihkan Pengaduan";
    } else if (bastMatch) {
      statusPosko = "Terdaftar di BAST Undangan";
    }

    let kategori: KategoriSelisih = "MATCH_LENGKAP";
    let rekomendasi = `Status Web Bulog & Posko Kita cocok terverifikasi. (${verificationStatus})`;
    const dugaanSalahKetik: string | undefined = undefined;

    const statusWebLower = bRow.status_pbp.toLowerCase();
    const isStatusPengganti = statusWebLower.includes("pengganti");

    if (!isSudahSerahWeb && isTerverifikasiPosko) {
      // 1. TERVERIFIKASI DI POSKO KITA, TAPI BELUM TERVERIFIKASI DI EXCEL WEB BULOG -> TUNGGU_INPUT_WEB
      kategori = "TUNGGU_INPUT_WEB";
      rekomendasi = `Urgensi Tinggi: Beras 30 Kg SUDAH terverifikasi di posko kita, tetapi di Excel Web Bulog statusnya '${bRow.status_serah}' (${verificationStatus}). Operator WAJIB segera input di web!`;
    } else if (!isSudahSerahWeb && !isTerverifikasiPosko) {
      // 2. BELUM TERVERIFIKASI DI POSKO KITA & BELUM TERVERIFIKASI DI EXCEL WEB BULOG -> BELUM_DIAMBIL
      kategori = "BELUM_DIAMBIL";
      rekomendasi = `Belum terverifikasi di posko kita maupun Excel Bulog (${bRow.status_serah} · ${verificationStatus}). Hubungi Ketua RT/RW setempat.`;
    } else if (isSudahSerahWeb && !isTerverifikasiPosko && !bastMatch) {
      // 3. Terverifikasi di Web Bulog TAPI belum pernah di-scan/dilayani di posko kita -> POTENSI_TTD_NYASAR
      kategori = "POTENSI_TTD_NYASAR";
      rekomendasi = "Waspada: Excel Web Bulog mencatat 'Sudah Diserahkan', tetapi Posko Kita belum pernah memverifikasi warga ini. Cek TTD nyasar / kesalahan input web.";
    } else if (isStatusPengganti) {
      const cleanP = cleanStr(bRow.nama_pengganti);
      const nikP = fixNIK(bRow.nik_pengganti) || cleanNum(bRow.nik_pengganti);

      let matchP: MasterRow | undefined = undefined;
      if (nikP && nikP.length === 16) {
        matchP = masterByNIK.get(nikP);
      }

      let is1KKWithPBP = false;
      if (masterMatch && masterMatch.NO_KK && cleanP) {
        const candidateList = masterByName.get(cleanP) ?? [];
        const sameKKMatch = candidateList.find((c) => c.NO_KK === masterMatch.NO_KK);
        if (sameKKMatch) {
          matchP = sameKKMatch;
          is1KKWithPBP = true;
        }
      }

      if (matchP) {
        kategori = "HUMAN_ERROR_BAST";
        if (is1KKWithPBP) {
          rekomendasi = `Status Pengganti Excel Bulog: Pengambil (${bRow.nama_pengganti}) 1 KK dengan PBP Asli (${matchP.HUBUNGAN_KELUARGA || "Keluarga"}).`;
        } else {
          rekomendasi = `Status Pengganti Excel Bulog: Pengambil (${bRow.nama_pengganti}) terverifikasi NIK di DTKS Kel. ${matchP.KEL_NAME}.`;
        }
      } else if (!nikP || nikP.length < 16) {
        kategori = "HUMAN_ERROR_BAST";
        rekomendasi = `NIK Pengganti kosong/tidak lengkap di Excel Bulog. Nama (${bRow.nama_pengganti}) belum terverifikasi NIK 16-digit. Wajib cek KTP fisik & lampirkan SPTJM.`;
      } else {
        kategori = "HUMAN_ERROR_BAST";
        rekomendasi = `Pengganti Non-DTKS (NIK: ${nikP}). Wajib lampirkan SPTJM bermeterai.`;
      }
    }

    let finalRt = String(bRow.rt || "").trim();
    let finalRw = String(bRow.rw || "").trim();

    if (!finalRt && bastMatch?.NO_RT) finalRt = bastMatch.NO_RT;
    if (!finalRw && bastMatch?.NO_RW) finalRw = bastMatch.NO_RW;

    if (!finalRt && masterMatch?.NO_RT) finalRt = masterMatch.NO_RT;
    if (!finalRw && masterMatch?.NO_RW) finalRw = masterMatch.NO_RW;

    if ((!finalRt || !finalRw) && bastMatch?.ALAMAT_BAST) {
      const parsed = parseRtRwFromText(bastMatch.ALAMAT_BAST);
      if (!finalRt) finalRt = parsed.rt;
      if (!finalRw) finalRw = parsed.rw;
    }

    if ((!finalRt || !finalRw) && masterMatch?.ALAMAT) {
      const parsed = parseRtRwFromText(masterMatch.ALAMAT);
      if (!finalRt) finalRt = parsed.rt;
      if (!finalRw) finalRw = parsed.rw;
    }

    const alamatToUse = bRow.alamat && bRow.alamat !== "—" && bRow.alamat !== "-"
      ? bRow.alamat
      : (masterMatch?.ALAMAT || bastMatch?.ALAMAT_BAST || "—");

    hasil.push({
      noUrut: bastMatch?.NO_URUT ?? extractedNoUrut ?? null,
      nik: bRow.nik || (masterMatch?.NIK ?? "—"),
      nikBast: bastMatch?.NIK || undefined,
      nama: bRow.nama || (masterMatch?.NAMA ?? "—"),
      noKK: masterMatch?.NO_KK || bastMatch?.NO_KK || "—",
      kelurahan: bRow.kelurahan || masterMatch?.KEL_NAME || bastMatch?.KELURAHAN_BAST || "—",
      rt: finalRt || "—",
      rw: finalRw || "—",
      alamat: alamatToUse,
      statusWebBulog: isSudahSerahWeb ? `Sudah Diserahkan (${bRow.status_pbp})` : bRow.status_serah || "Belum Diserahkan",
      verificationStatus,
      statusPosko,
      adaBASTFisik: adaFisik,
      kategoriSelisih: kategori,
      catatanRekomendasi: rekomendasi,
      dugaanSalahKetikNIK: dugaanSalahKetik,
      sumberDataEkspresil: bRow._sourceFile
        ? `Ekspor Bulog (${bRow._sourceFile})`
        : "Ekspor Bulog Manual",
    });
  }

  // Evaluasi Warga di Master Data 142k yang belum ada di Ekspor Web Bulog sama sekali
  if (masterRecords.length > 0 && recordsToProcess.length > 0) {
    const bulogNIKSet = new Set<string>();
    recordsToProcess.forEach((b) => {
      const n = fixNIK(b.nik) || cleanNum(b.nik);
      if (n) bulogNIKSet.add(n);
    });

    for (const m of masterRecords) {
      const mNIK = fixNIK(m.NIK) || cleanNum(m.NIK);
      if (!mNIK || bulogNIKSet.has(mNIK)) continue;
      if (!isPoskoScope(m.KEL_NAME || "")) continue;

      const logMatch = logMapByNIK.get(mNIK);
      const bastMatchRaw = bastMapByNIK.get(mNIK) ?? null;
      const bastMatch = bastMatchRaw && isPoskoScope(bastMatchRaw.KELURAHAN_BAST) ? bastMatchRaw : null;
      const isTerverifikasiPosko = Boolean(logMatch && logMatch.status === "SUKSES_SALUR");
      const adaFisik = Boolean(isTerverifikasiPosko || bastMatch);

      let statusPosko = "Belum Terverifikasi";
      if (isTerverifikasiPosko) {
        statusPosko = "Terverifikasi di Posko (30 Kg)";
      } else if (logMatch && logMatch.status === "ALIH_PENGADUAN") {
        statusPosko = "Dialihkan Pengaduan";
      } else if (bastMatch) {
        statusPosko = "Terdaftar di BAST Undangan";
      }

      hasil.push({
        noUrut: bastMatch?.NO_URUT ?? null,
        nik: m.NIK || "—",
        nikBast: bastMatch?.NIK || undefined,
        nama: m.NAMA || "—",
        noKK: m.NO_KK || "—",
        kelurahan: m.KEL_NAME || "—",
        rt: m.NO_RT !== undefined && m.NO_RT !== "" ? m.NO_RT : "—",
        rw: m.NO_RW !== undefined && m.NO_RW !== "" ? m.NO_RW : "—",
        alamat: m.ALAMAT || "—",
        statusWebBulog: "Belum Ada di File Ekspor",
        verificationStatus: "Belum diverifikasi",
        statusPosko,
        adaBASTFisik: adaFisik,
        kategoriSelisih: isTerverifikasiPosko ? "TUNGGU_INPUT_WEB" : "BELUM_DIAMBIL",
        catatanRekomendasi: isTerverifikasiPosko
          ? "Telah terverifikasi di posko kita, tetapi belum terverifikasi di file ekspor Bulog."
          : "Belum pernah terverifikasi di posko kita maupun di file ekspor Bulog.",
        sumberDataEkspresil: "Master Data 142k",
      });
    }
  }

  return hasil;
}
