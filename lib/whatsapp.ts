/**
 * lib/whatsapp.ts
 * Helper untuk men-generate pesan WhatsApp terformat rapi per RT/RW
 * berisi daftar warga yang belum mengambil bantuan beras 30 Kg di posko.
 */

import type { SelisihAuditRow } from "@/types";

export function generatePesanWAReminderRT(
  rtTarget: string,
  rwTarget: string,
  kelurahan: string,
  wargaList: SelisihAuditRow[]
): string {
  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const listText = wargaList
    .map((w, idx) => {
      const alamatParts = [w.alamat, w.rt ? `RT ${w.rt}` : "", w.rw ? `RW ${w.rw}` : ""].filter((part) => part && part !== "—" && part !== "-");
      const noUrutTag = w.noUrut != null ? `[No. ${w.noUrut}] ` : "";
      return `${idx + 1}. ${noUrutTag}*${w.nama}* - Alamat: ${alamatParts.join(" /") || "—"}`;
    })
    .join("\n");

  return `*PEMBERITAHUAN ALOKASI BANSOS PBP BULOG*
*Posko Kelurahan:* ${kelurahan}
*Target Wilayah:* RT ${rtTarget}${rwTarget && rwTarget !== "—" ? ` / RW ${rwTarget}` : ""}
*Tanggal:* ${hariIni}

Kepada Yth. *Bapak/Ibu Ketua RT ${rtTarget}${rwTarget && rwTarget !== "—" ? ` / RW ${rwTarget}` : ""}*,

Berikut kami sampaikan daftar warga PBP di RT ${rtTarget}${rwTarget && rwTarget !== "—" ? ` / RW ${rwTarget}` : ""} yang *BELUM MENGAMBIL* bantuan beras 30 Kg di Posko Kelurahan ${kelurahan}:

${listText || "(Tidak ada warga yang terdaftar)"}

Mohon bantuan Bapak/Ibu RT/RW untuk mengimbau warga di atas agar *segera hadir di Posko Kelurahan ${kelurahan}* membawa KTP & KK Asli sebelum alokasi ditutup.

Terima kasih atas kerja samanya.
_Salam, Petugas Posko Bulog Logistik_`;
}

export function generatePesanWAReminderSemuaRT(
  kelurahan: string,
  wargaList: SelisihAuditRow[]
): string {
  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const grouped = new Map<string, SelisihAuditRow[]>();
  wargaList.forEach((w) => {
    const rt = String(w.rt || "").trim();
    const rw = String(w.rw || "").trim();
    const key = (rt && rt !== "—" && rt !== "-") || (rw && rw !== "—" && rw !== "-")
      ? `RT ${rt || "—"} / RW ${rw || "—"}`
      : "RT — / RW — (Belum Teridentifikasi RT/RW)";

    const list = grouped.get(key) ?? [];
    list.push(w);
    grouped.set(key, list);
  });

  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a.includes("Belum Teridentifikasi")) return 1;
    if (b.includes("Belum Teridentifikasi")) return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const sections = sortedKeys
    .map((key) => {
      const items = grouped.get(key)!;
      const itemLines = items
        .map((w, idx) => {
          const noUrutTag = w.noUrut != null ? `[No. ${w.noUrut}] ` : "";
          return `  ${idx + 1}. ${noUrutTag}*${w.nama}* (NIK: ${w.nik}) — Alamat: ${w.alamat || "—"}`;
        })
        .join("\n");
      return `*${key}* (${items.length} PBP):\n${itemLines}`;
    })
    .join("\n\n");

  return `*REKAPITULASI PBP BELUM AMBIL BERAS (SEMUA RT/RW)*
*Posko Kelurahan:* ${kelurahan}
*Tanggal:* ${hariIni}
*Total Sisa PBP Belum Ambil:* ${wargaList.length} Warga

Kepada Yth. *Bapak/Ibu LMK, FKDM, serta Ketua RT & RW se-Kelurahan ${kelurahan}*,

Berikut kami sampaikan rekapitulasi daftar warga PBP per RT/RW yang *BELUM MENGAMBIL* bantuan beras 30 Kg di Posko Kelurahan ${kelurahan}:

${sections || "(Tidak ada warga yang terdaftar)"}

Mohon bantuan Bapak/Ibu Pengurus Wilayah untuk imbauan penjemputan warga di atas agar *segera hadir di Posko Kelurahan ${kelurahan}* membawa KTP & KK Asli sebelum batas alokasi berakhir.

Terima kasih atas kerja samanya.
_Salam, Petugas Posko Bulog Logistik_`;
}

export function bukaWhatsAppWeb(pesan: string, nomorHp: string = ""): void {
  const encodedText = encodeURIComponent(pesan);
  const cleanPhone = nomorHp.replace(/[^0-9]/g, "");

  let url = "";
  if (cleanPhone) {
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}
