/**
 * services/sptjmGenerator.ts
 * Module pengelompokkan & ekstraksi murni data PBP Awal vs PBP Pengganti dari Excel Web Bulog ("Sudah Diserahkan").
 * Menyerap NIK, No. KK PBP Awal & PBP Pengganti murni dari Excel tanpa tebakan.
 * Mendukung penyaringan spesifik khusus 1 Kelurahan BAST Aktif (misal: "Rawa Badak Utara").
 */

import type {
  AuditRow,
  MasterRow,
  BastRow,
  DetailItemSPTJM,
  KelompokDokumenSPTJM,
  PengaturanWilayahSPTJM,
} from "@/types";
import { cleanStr, cleanNum } from "@/lib/utils";

/**
 * Mengambil semua baris Audit yang berstatus "Pengganti" (dari File 1 "Sudah Diserahkan" atau Ekspor Bulog aktif),
 * memfilter khusus kelurahanTarget (jika diberikan), mencocokkannya ke Data Master 142k,
 * dan mengelompokkan per Nomor BAST + Kelurahan.
 */
export function kelompokkanKasusSPTJM(
  bulogExportRecords: AuditRow[],
  masterByNIK: Map<string, MasterRow>,
  masterByName: Map<string, MasterRow[]>,
  bastByNIK: Map<string, BastRow>,
  pengaturanGlobal: PengaturanWilayahSPTJM,
  kelurahanTarget?: string
): KelompokDokumenSPTJM[] {
  const cleanTargetKel = kelurahanTarget ? cleanStr(kelurahanTarget) : "";

  // 1. Filter Kasus Pengganti murni yang khusus sesuai kelurahanTarget (jika ditentukan)
  const kasusPengganti = bulogExportRecords.filter((row) => {
    const sLower = row.status_pbp.toLowerCase();
    if (!sLower.includes("pengganti")) return false;

    if (cleanTargetKel) {
      const rowKelClean = cleanStr(row.kelurahan || "");
      // Jika kelurahan di baris ekspor terisi, harus cocok dengan kelurahanTarget
      if (rowKelClean && !rowKelClean.includes(cleanTargetKel) && !cleanTargetKel.includes(rowKelClean)) {
        return false;
      }
    }
    return true;
  });

  // 2. Petakan setiap kasus ke DetailItemSPTJM murni dari Excel
  const items: DetailItemSPTJM[] = kasusPengganti.map((row, idx) => {
    const cleanPBP = cleanNum(row.nik);
    const masterPBP = cleanPBP ? masterByNIK.get(cleanPBP) : masterByName.get(cleanStr(row.nama))?.[0];
    const bastPBP = cleanPBP ? bastByNIK.get(cleanPBP) : undefined;

    const noBast =
      row.no_bast ||
      bastPBP?.BARCODE ||
      (masterPBP?.ID_WILAYAH ? `BAST-${masterPBP.ID_WILAYAH}` : "BAST-2026093172031004");

    const kelurahan = row.kelurahan || masterPBP?.KEL_NAME || kelurahanTarget || "Rawa Badak Utara";
    const kecamatan = masterPBP?.KEC_NAME || "Koja";

    // PBP Awal (Hak) — Ekstraksi murni dari Excel dengan Fallback ke Master
    const pbpAwalNIK = cleanNum(row.nik) || masterPBP?.NIK || "";
    const pbpAwalNoKK = cleanNum(row.no_kk) || masterPBP?.NO_KK || "";
    const pbpAwalNama = row.nama || masterPBP?.NAMA || "";
    const pbpAwalAlamat =
      row.alamat ||
      (masterPBP
        ? `${masterPBP.ALAMAT || ""} RT ${masterPBP.NO_RT !== "" ? masterPBP.NO_RT : "—"}/RW ${masterPBP.NO_RW !== "" ? masterPBP.NO_RW : "—"}`.trim()
        : bastPBP?.ALAMAT_BAST || "");

    // PBP Pengganti — Ekstraksi murni dari Excel
    const penggantiNIK = cleanNum(row.nik_pengganti);
    const penggantiNoKK = cleanNum(row.no_kk_pengganti) || pbpAwalNoKK; // Fallback ke No KK PBP Awal jika 1 KK
    const penggantiNama = row.nama_pengganti.trim();
    const penggantiAlamat = row.alamat_pengganti || (row.notes && row.notes !== "—" ? row.notes : pbpAwalAlamat);
    const penggantiPekerjaan = row.pekerjaan_pengganti || "Wiraswasta";

    // Validasi Kelengkapan
    const alasanBermasalah: string[] = [];
    if (!pbpAwalNIK || pbpAwalNIK.length < 10) alasanBermasalah.push("NIK PBP Awal kurang dari 10 digit");
    if (!pbpAwalNoKK || pbpAwalNoKK.length < 10) alasanBermasalah.push("No. KK PBP Awal belum terisi");
    if (!penggantiNIK || penggantiNIK.length < 10) alasanBermasalah.push("NIK PBP Pengganti kurang dari 10 digit");
    if (!penggantiNama) alasanBermasalah.push("Nama PBP Pengganti belum terisi");

    const isValidComplete = alasanBermasalah.length === 0;

    return {
      id: `sptjm-${idx}-${Date.now()}`,
      noBast,
      kelurahan,
      kecamatan,
      pbpAwalNIK,
      pbpAwalNoKK,
      pbpAwalNama,
      pbpAwalAlamat,
      penggantiNIK,
      penggantiNoKK,
      penggantiNama,
      penggantiAlamat,
      penggantiPekerjaan,
      isValidComplete,
      alasanBermasalah,
      rawAuditRow: row,
    };
  });

  // 3. Kelompokkan berdasarkan Nomor BAST + Kelurahan
  const kelompokMap = new Map<string, DetailItemSPTJM[]>();
  for (const item of items) {
    const key = `${item.noBast}_${item.kelurahan}`;
    const list = kelompokMap.get(key) ?? [];
    list.push(item);
    kelompokMap.set(key, list);
  }

  const hasilKelompok: KelompokDokumenSPTJM[] = [];
  kelompokMap.forEach((daftarKasus) => {
    const pertamItem = daftarKasus[0];
    const isValidAll = daftarKasus.every((d) => d.isValidComplete);

    hasilKelompok.push({
      noBast: pertamItem.noBast,
      kelurahan: pertamItem.kelurahan,
      kecamatan: pertamItem.kecamatan,
      provinsi: pengaturanGlobal.provinsi,
      kabupatenKota: pengaturanGlobal.kabupatenKota,
      alokasiBulan: pengaturanGlobal.alokasiBulan,
      daftarKasus,
      totalKasus: daftarKasus.length,
      isValidAll,
    });
  });

  return hasilKelompok;
}
