/**
 * services/verifikasi.ts
 * Logic pengecekan & pencocokan PBP cerdas.
 * Mendukung barcode BAST, Banpang, NIK 16-digit, No Urut, Nama, dan Pencarian No. KK 16-digit (1 KK).
 */

import type { MasterRow, BastRow, ActivePBP, LogEntry } from "@/types";
import { cleanStr, cleanNum, formatWaktuSekarang } from "@/lib/utils";
export { parseRtRwFromText } from "./bastParser";

export interface HasilPengecekan {
  matchesMaster: MasterRow[];
  matchBAST: BastRow | null;
  matchMode: string;
  tidakDitemukan: boolean;
  adaDuplikat: boolean;
}

export function jalankanPengecekan(
  rawQ: string,
  poskoAktif: string,
  bastRecords: BastRow[],
  masterRecords: MasterRow[],
  masterByNIK: Map<string, MasterRow>,
  masterByName: Map<string, MasterRow[]>,
  bastByNIK: Map<string, BastRow>,
  bastByNoUrut: Map<string, BastRow>,
  masterByKK?: Map<string, MasterRow[]>
): HasilPengecekan {
  const trimmedQ = rawQ.trim();
  const cleanQ = cleanStr(trimmedQ);
  const cleanNumQ = cleanNum(trimmedQ);
  const cleanPosko = cleanStr(poskoAktif);

  let extractedNIK = "";
  let extractedNoUrut = "";
  let extractedNoKK = "";

  // 1. Ekstraksi Barcode Cerdas (Mendukung format -, |, ;, /, spasi, atau 47-digit murni)
  const multiPartMatch = trimmedQ.match(/(\d{15})[\s\-\|\;\/]+(\d{16})[\s\-\|\;\/]+(\d{16})/);
  if (multiPartMatch) {
    extractedNIK = multiPartMatch[2];
    extractedNoKK = multiPartMatch[3];
    extractedNoUrut = String(parseInt(multiPartMatch[1].slice(-5), 10));
  } else if (cleanNumQ.length === 47) {
    extractedNIK = cleanNumQ.slice(15, 31);
    extractedNoKK = cleanNumQ.slice(31, 47);
    extractedNoUrut = String(parseInt(cleanNumQ.slice(10, 15), 10));
  } else if (cleanNumQ.length === 16) {
    // 16 digit: bisa NIK atau NO_KK
    if (masterByNIK.has(cleanNumQ)) {
      extractedNIK = cleanNumQ;
    } else if (masterByKK && masterByKK.has(cleanNumQ)) {
      extractedNoKK = cleanNumQ;
    } else {
      extractedNIK = cleanNumQ;
    }
  } else if (/^\d{1,5}$/.test(cleanNumQ)) {
    extractedNoUrut = String(parseInt(cleanNumQ, 10));
  } else {
    const nikMatch = trimmedQ.match(/\b\d{16}\b/);
    if (nikMatch) {
      extractedNIK = nikMatch[0];
    }
  }

// 2. CARI DI BAST RECORDS (Prioritas Utama: BAST PDF/Excel Posko Aktif)
  let matchBAST: BastRow | null = null;
  if (bastRecords.length > 0) {
    // A. Cek No. Urut scoped khusus poskoAktif
    if (extractedNoUrut) {
      const compositeKey = `${cleanPosko}_${extractedNoUrut}`;
      if (bastByNoUrut.has(compositeKey)) {
        matchBAST = bastByNoUrut.get(compositeKey)!;
      }
    }

    // B. Cek NIK di BAST (Utamakan BAST Posko Aktif)
    if (!matchBAST && extractedNIK) {
      if (bastByNIK.has(extractedNIK)) {
        const bastCand = bastByNIK.get(extractedNIK)!;
        const bKel = cleanStr(bastCand.KELURAHAN_BAST);
        if (!bKel || bKel === cleanPosko || bKel.includes(cleanPosko) || cleanPosko.includes(bKel)) {
          matchBAST = bastCand;
        } else {
          // BAST ada tapi beda kelurahan
          matchBAST = bastCand;
        }
      }
    }

    // C. Fallback No. Urut (Utamakan Posko Aktif)
    if (!matchBAST && extractedNoUrut) {
      matchBAST = bastRecords.find(
        (b) =>
          b.NO_URUT === parseInt(extractedNoUrut, 10) &&
          (cleanStr(b.KELURAHAN_BAST).includes(cleanPosko) || cleanPosko.includes(cleanStr(b.KELURAHAN_BAST)))
      ) ?? bastRecords.find((b) => b.NO_URUT === parseInt(extractedNoUrut, 10)) ?? null;
    }

    // D. Cek Barcode murni
    if (!matchBAST && cleanQ) {
      matchBAST = bastRecords.find(
        (b) =>
          cleanStr(b.BARCODE).includes(cleanQ) &&
          (cleanStr(b.KELURAHAN_BAST).includes(cleanPosko) || cleanPosko.includes(cleanStr(b.KELURAHAN_BAST)))
      ) ?? bastRecords.find((b) => cleanStr(b.BARCODE).includes(cleanQ)) ?? null;
    }

    // E. Pencarian Nama BAST (Utamakan Posko Aktif)
    if (!matchBAST && cleanQ.length >= 3) {
      const candidates = bastRecords.filter((b) => {
        const bName = cleanStr(b.NAMA);
        return bName.startsWith(cleanQ) || bName.split(/\s+/).some((w) => w.startsWith(cleanQ));
      });
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const matchA = cleanStr(a.KELURAHAN_BAST).includes(cleanPosko) || cleanPosko.includes(cleanStr(a.KELURAHAN_BAST)) ? 1 : 0;
          const matchB = cleanStr(b.KELURAHAN_BAST).includes(cleanPosko) || cleanPosko.includes(cleanStr(b.KELURAHAN_BAST)) ? 1 : 0;
          return matchB - matchA;
        });
        matchBAST = candidates[0];
      }
    }
  }

  // 3. CARI DI MASTER DATA 142k (Sebagai Acuan Baseline & Lintas Kelurahan)
  let matchesMaster: MasterRow[] = [];
  let matchMode = "Nama";

  // Cek berdasar NIK lebih dulu
  const targetNIK = extractedNIK || (matchBAST?.NIK ?? "");
  if (targetNIK && targetNIK.length >= 10 && masterByNIK.has(targetNIK)) {
    matchesMaster = [masterByNIK.get(targetNIK)!];
    const mKel = cleanStr(matchesMaster[0].KEL_NAME || "");
    const isMasterPoskoMatch = !mKel || !cleanPosko || mKel === cleanPosko || mKel.includes(cleanPosko) || cleanPosko.includes(mKel);
    matchMode = isMasterPoskoMatch
      ? "NIK 16 Digit / Barcode Banpang (Pasti Sesuai)"
      : `Acuan Master Data 142k — Lintas Kelurahan (${matchesMaster[0].KEL_NAME || "Luar Posko"})`;
  }

  // Cek berdasar No. KK (jika NIK tidak ketemu atau user memasukkan No KK)
  if (matchesMaster.length === 0 && extractedNoKK && masterByKK && masterByKK.has(extractedNoKK)) {
    matchesMaster = masterByKK.get(extractedNoKK)!;
    matchMode = `Pencari No. KK (${matchesMaster.length} Anggota Keluarga)`;
  }

  if (matchesMaster.length === 0) {
    const targetName = matchBAST && cleanStr(matchBAST.NAMA) ? cleanStr(matchBAST.NAMA) : cleanQ;

    if (targetName) {
      const foundByName = masterByName.get(targetName);
      if (foundByName && foundByName.length > 0) {
        matchesMaster = [...foundByName];
        matchMode = "Nama Persis";
      } else if (targetName.length >= 2) {
        const scoredMatches: { item: MasterRow; score: number }[] = [];

        for (let i = 0; i < masterRecords.length; i++) {
          const m = masterRecords[i];
          const mName = cleanStr(m.NAMA || "");
          if (!mName) continue;

          let score = 0;
          if (mName.startsWith(targetName)) {
            score = 100;
          } else {
            const words = mName.split(/\s+/);
            if (words.some((w) => w.startsWith(targetName))) {
              score = 80;
            } else if (targetName.length >= 4 && mName.includes(targetName)) {
              score = 50;
            }
          }

          if (score > 0) {
            const kelA = cleanStr(m.KEL_NAME || "");
            if (kelA.includes(cleanPosko) || cleanPosko.includes(kelA)) score += 15;
            scoredMatches.push({ item: m, score });
          }
        }

        scoredMatches.sort((a, b) => b.score - a.score);
        matchesMaster = scoredMatches.map((sm) => sm.item);
        matchMode = "Kemiripan Nama";
      }
    }
  }

  // 4. BI-DIRECTIONAL CROSS-MATCHING Antara Master & BAST
  // Kasus A: Ditemukan di Master, tapi matchBAST masih null -> Cari BAST berdasar Nama Master
  if (matchesMaster.length > 0 && !matchBAST && bastRecords.length > 0) {
    const mName = cleanStr(matchesMaster[0].NAMA);
    const mNIK = cleanNum(matchesMaster[0].NIK);

    // A1. Cek NIK KTP jika valid
    if (mNIK && mNIK.length === 16 && !mNIK.startsWith("000000") && bastByNIK.has(mNIK)) {
      matchBAST = bastByNIK.get(mNIK)!;
    }

    // A2. Cek Nama Persis
    if (!matchBAST && mName) {
      matchBAST = bastRecords.find((b) => cleanStr(b.NAMA) === mName) ?? null;
    }

    // A3. Cek Substring / Word Match
    if (!matchBAST && mName && mName.length >= 3) {
      const candidates = bastRecords.filter((b) => {
        const bName = cleanStr(b.NAMA);
        return bName.includes(mName) || mName.includes(bName) || bName.startsWith(mName);
      });
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const matchA = cleanStr(a.KELURAHAN_BAST).includes(cleanPosko) ? 1 : 0;
          const matchB = cleanStr(b.KELURAHAN_BAST).includes(cleanPosko) ? 1 : 0;
          return matchB - matchA;
        });
        matchBAST = candidates[0];
      }
    }
  }

  // Kasus B: Ditemukan di BAST, tapi matchesMaster masih kosong -> Cari Master berdasar Nama BAST
  if (matchBAST && matchesMaster.length === 0 && masterRecords.length > 0) {
    const bName = cleanStr(matchBAST.NAMA);
    const bNIK = cleanNum(matchBAST.NIK);

    if (bNIK && bNIK.length === 16 && masterByNIK.has(bNIK)) {
      matchesMaster = [masterByNIK.get(bNIK)!];
    }

    if (matchesMaster.length === 0 && bName) {
      const found = masterByName.get(bName);
      if (found && found.length > 0) {
        matchesMaster = [...found];
      } else if (bName.length >= 3) {
        const scoredMatches: { item: MasterRow; score: number }[] = [];
        for (let i = 0; i < masterRecords.length; i++) {
          const m = masterRecords[i];
          const mName = cleanStr(m.NAMA || "");
          if (!mName) continue;
          if (mName.includes(bName) || bName.includes(mName)) {
            let score = 50;
            if (cleanStr(m.KEL_NAME || "").includes(cleanPosko)) score += 15;
            scoredMatches.push({ item: m, score });
          }
        }
        if (scoredMatches.length > 0) {
          scoredMatches.sort((a, b) => b.score - a.score);
          matchesMaster = scoredMatches.map((sm) => sm.item);
        }
      }
    }
  }

  if (matchesMaster.length === 0 && !matchBAST) {
    return { matchesMaster: [], matchBAST: null, matchMode, tidakDitemukan: true, adaDuplikat: false };
  }

  return {
    matchesMaster,
    matchBAST,
    matchMode,
    tidakDitemukan: false,
    adaDuplikat: matchesMaster.length > 1,
  };
}

export function buatLogEntry(pbp: ActivePBP, status: LogEntry["status"]): LogEntry {
  const { master, bast, posko } = pbp;
  const bastNik = bast?.NIK && /^\d{16}$/.test(bast.NIK) ? bast.NIK : null;
  const masterNik = master?.NIK && !master._isTanpaNIK && !master.NIK.startsWith("IDW-") ? master.NIK : null;
  const finalNik = bastNik || masterNik || bast?.NIK || master?.NIK || "-";

  return {
    waktu: formatWaktuSekarang(),
    nama: bast?.NAMA || master?.NAMA || "Tanpa Nama",
    nik: finalNik,
    kelurahanAsal: bast?.KELURAHAN_BAST || master?.KEL_NAME || "-",
    posko,
    status,
    alokasiKg: status === "SUKSES_SALUR" ? 30 : 0,
  };
}
