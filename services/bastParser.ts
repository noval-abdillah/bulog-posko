/**
 * services/bastParser.ts
 * Ekstraksi & Cross-Check Instant BAST (PDF & Excel) terhadap Master Data 142k.
 * Menandai status MATCHED, TIDAK_ADA_DI_MASTER, atau PERLU_VERIFIKASI_MANUAL.
 */

import type { BastRow, MasterRow, StatusPencocokanBAST, LogBermasalahItem } from "@/types";
import { cleanStr, cleanNum, formatWaktuSekarang } from "@/lib/utils";

interface TextItem {
  str: string;
  x: number;
  y: number;
}

export function parseRtRwFromText(text: string): { rt: string; rw: string } {
  if (!text) return { rt: "", rw: "" };

  let rt = "";
  let rw = "";

  // Pola 1: RT 005 / RW 003 atau RT.005/RW.003
  const p1 = text.match(/RT[\s\.\:\_\-]*0*(\d{1,3})[\s\.\:\_\-\/\,]*RW[\s\.\:\_\-]*0*(\d{1,3})/i);
  if (p1) {
    return { rt: p1[1], rw: p1[2] };
  }

  // Pola 2: RT/RW : 005/003 atau RT/RW 005/003
  const p2 = text.match(/RT\s*[\/\\]\s*RW[\s\.\:\_\-]*0*(\d{1,3})[\s\/\-\.]*0*(\d{1,3})/i);
  if (p2) {
    return { rt: p2[1], rw: p2[2] };
  }

  // Pola 3: RT 005 saja
  const rtMatch = text.match(/RT[\s\.\:\_\-]*0*(\d{1,3})/i);
  if (rtMatch && rtMatch[1]) {
    rt = rtMatch[1];
  }

  // Pola 4: RW 003 saja
  const rwMatch = text.match(/RW[\s\.\:\_\-]*0*(\d{1,3})/i);
  if (rwMatch && rwMatch[1]) {
    rw = rwMatch[1];
  }

  // Pola 5: jika RW belum dapat, cek format 005/003
  if (!rw) {
    const slashMatch = text.match(/(?:RT|\b)[\s\.]*0*(\d{1,3})\s*[\/\-]\s*0*(\d{1,3})/i);
    if (slashMatch) {
      if (!rt) rt = slashMatch[1];
      rw = slashMatch[2];
    }
  }

  return { rt, rw };
}

export function extractBASTFromColumn(
  items: TextItem[],
  kelName: string,
  fileName: string = "Dokumen_BAST.pdf",
  pageNum: number = 1
): BastRow[] {
  if (!items || items.length === 0) return [];

  const text = items.map((it) => it.str).join("\n");
  const bcPattern = /(\d{15})[\s\-\|\;\/]*(\d{16})[\s\-\|\;\/]*(\d{16})/g;

  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = bcPattern.exec(text)) !== null) {
    matches.push(m);
  }

  const results: BastRow[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fullBarcode = `${match[1]}-${match[2]}-${match[3]}`;
    const nik = match[2];
    const noKK = match[3];
    const noUrut = parseInt(match[1].slice(-5), 10) || null;

    // Validasi NIK 16-digit format wilayah & tanggal lahir dasar
    const isValidNikFormat = /^\d{16}$/.test(nik) && !/^0{16}$/.test(nik);
    if (!isValidNikFormat) continue;

    const startPos = i > 0 ? matches[i - 1].index + matches[i - 1][0].length : 0;
    const endPos = i < matches.length - 1 ? matches[i + 1].index : text.length;

    const chunkBefore = text.substring(startPos, match.index).trim();
    const chunkAfter = text.substring(match.index + match[0].length, endPos).trim();
    const combinedBlock = `${chunkBefore}\n${chunkAfter}`;

    const lines = chunkBefore.split("\n").map((l) => l.trim()).filter(Boolean);

    const validLines = lines.filter((l) => {
      if (/^[\*\s\d\.,:\-\/\_]+$/.test(l)) return false;
      if (/^(Nama PBP|QR Code|TTD|Halaman|Alokasi|Kec|Kel|Provinsi|Kota|didistribusikan|Petugas)/i.test(l)) return false;
      return true;
    });

    const rawName = validLines[0] || "";
    const address = validLines.slice(1).join(" ") || "";

    const { rt: extractedRt, rw: extractedRw } = parseRtRwFromText(combinedBlock);

    let cleanName = rawName
      .replace(/\s*-\s*RT.*$/i, "")
      .replace(/\s+RT\s*\d+.*$/i, "")
      .replace(/\s*RW\s*\d+.*$/i, "")
      .trim();
    cleanName = cleanName.replace(/^[\*\d\.\s\-\_]+/, "").trim();

    if (cleanName && cleanName.length >= 2) {
      results.push({
        NAMA: cleanName,
        KELURAHAN_BAST: kelName,
        BARCODE: fullBarcode,
        NIK: nik,
        NO_KK: noKK,
        NO_URUT: noUrut,
        ALAMAT_BAST: address || combinedBlock,
        NO_RT: extractedRt,
        NO_RW: extractedRw,
        _sourceFile: fileName,
        _sourceRow: i + 1,
        _sourcePage: pageNum,
      });
    }
  }

  return results;
}

/**
 * Cross-check instant entri BAST ke Data Master 142k
 */
export function crossCheckBastKeMaster(
  bastRows: BastRow[],
  masterByNIK: Map<string, MasterRow>,
  masterByName: Map<string, MasterRow[]>
): {
  checkedRecords: BastRow[];
  logBermasalahItems: LogBermasalahItem[];
  detectedMajorityKelurahan?: string;
} {
  const checkedRecords: BastRow[] = [];
  const logBermasalahItems: LogBermasalahItem[] = [];

  // Deteksi mayoritas Kelurahan dari NIK Master Data 142k
  const kelCountMap = new Map<string, number>();
  for (const b of bastRows) {
    const nikClean = cleanNum(b.NIK);
    if (nikClean) {
      const match = masterByNIK.get(nikClean);
      if (match && match.KEL_NAME && match.KEL_NAME.trim()) {
        const kel = match.KEL_NAME.trim();
        kelCountMap.set(kel, (kelCountMap.get(kel) || 0) + 1);
      }
    }
  }

  let majorityKel: string | undefined = undefined;
  let maxCount = 0;
  let totalMatched = 0;
  kelCountMap.forEach((count, kel) => {
    totalMatched += count;
    if (count > maxCount) {
      maxCount = count;
      majorityKel = kel;
    }
  });

  const shouldAutoCorrect = Boolean(majorityKel && maxCount >= 3 && (maxCount / totalMatched) >= 0.4);
  const detectedMajorityKelurahan = shouldAutoCorrect ? majorityKel : undefined;

  for (const b of bastRows) {
    const nikClean = cleanNum(b.NIK);
    const namaClean = cleanStr(b.NAMA);

    let statusPencocokan: StatusPencocokanBAST = "TIDAK_ADA_DI_MASTER";
    let masterMatchNIK: string | undefined = undefined;
    let masterMatchNama: string | undefined = undefined;

    const matchByNIK = nikClean ? masterByNIK.get(nikClean) : undefined;

    if (matchByNIK) {
      statusPencocokan = "MATCHED";
      masterMatchNIK = matchByNIK.NIK;
      masterMatchNama = matchByNIK.NAMA;

      // Cek apakah nama di BAST berbeda signifikan dengan nama di Master
      const masterNameClean = cleanStr(matchByNIK.NAMA);
      if (namaClean !== masterNameClean && !masterNameClean.includes(namaClean) && !namaClean.includes(masterNameClean)) {
        statusPencocokan = "PERLU_VERIFIKASI_MANUAL";
        logBermasalahItems.push({
          id: Math.random().toString(36).slice(2),
          sumber: b._sourcePage ? "BAST_PDF" : "BAST_EXCEL",
          fileAsal: b._sourceFile || "BAST.pdf",
          nomorBarisOrPage: b._sourcePage ? `Halaman ${b._sourcePage}` : `Baris ${b._sourceRow || 1}`,
          tipeMasalah: "PERLU_VERIFIKASI_MANUAL",
          pesanBahasa: `Ejaan nama berbeda antara BAST ('${b.NAMA}') vs Master ('${matchByNIK.NAMA}'). NIK cocok: ${b.NIK}.`,
          dataMentah: { namaBAST: b.NAMA, namaMaster: matchByNIK.NAMA, NIK: b.NIK, Kelurahan: b.KELURAHAN_BAST },
          waktuPencatatan: formatWaktuSekarang(),
        });
      }
    } else {
      // Cek apakah nama BAST ada di Master dengan NIK berbeda
      const matchByNameList = masterByName.get(namaClean);
      if (matchByNameList && matchByNameList.length > 0) {
        statusPencocokan = "PERLU_VERIFIKASI_MANUAL";
        masterMatchNIK = matchByNameList[0].NIK;
        masterMatchNama = matchByNameList[0].NAMA;

        logBermasalahItems.push({
          id: Math.random().toString(36).slice(2),
          sumber: b._sourcePage ? "BAST_PDF" : "BAST_EXCEL",
          fileAsal: b._sourceFile || "BAST.pdf",
          nomorBarisOrPage: b._sourcePage ? `Halaman ${b._sourcePage}` : `Baris ${b._sourceRow || 1}`,
          tipeMasalah: "PERLU_VERIFIKASI_MANUAL",
          pesanBahasa: `Nama BAST '${b.NAMA}' cocok dengan Master, tetapi NIK berbeda (BAST: ${b.NIK} vs Master: ${matchByNameList[0].NIK}).`,
          dataMentah: { namaBAST: b.NAMA, nikBAST: b.NIK, nikMaster: matchByNameList[0].NIK },
          waktuPencatatan: formatWaktuSekarang(),
        });
      } else {
        // NIK dan Nama sama sekali tidak ada di Master
        statusPencocokan = "TIDAK_ADA_DI_MASTER";
        logBermasalahItems.push({
          id: Math.random().toString(36).slice(2),
          sumber: b._sourcePage ? "BAST_PDF" : "BAST_EXCEL",
          fileAsal: b._sourceFile || "BAST.pdf",
          nomorBarisOrPage: b._sourcePage ? `Halaman ${b._sourcePage}` : `Baris ${b._sourceRow || 1}`,
          tipeMasalah: "TIDAK_ADA_DI_MASTER",
          pesanBahasa: `Entri BAST atas nama '${b.NAMA}' (NIK: ${b.NIK || "Kosong"}) tidak ditemukan pada Master Data 142k.`,
          dataMentah: { BAST: b },
          waktuPencatatan: formatWaktuSekarang(),
        });
      }
    }

    const effectiveKel = shouldAutoCorrect && majorityKel ? majorityKel : b.KELURAHAN_BAST;

    checkedRecords.push({
      ...b,
      KELURAHAN_BAST: effectiveKel,
      _statusPencocokan: statusPencocokan,
      _masterMatchNIK: masterMatchNIK,
      _masterMatchNama: masterMatchNama,
    });
  }

  return { checkedRecords, logBermasalahItems, detectedMajorityKelurahan };
}
