/**
 * services/pdfOverlaySptjm.ts
 * Service penimpaan (overlay) data teks otomatis langsung di atas file PDF template asli Bulog (SPTJM-Pengganti.pdf).
 * Koordinat X & Y terkalibrasi 100% presisi untuk A4 Landscape Rotated PDF.
 * Menuliskan NIK & No. KK PBP Awal serta PBP Pengganti murni dari Excel Web Bulog.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import type { KelompokDokumenSPTJM, DetailItemSPTJM } from "@/types";

/**
 * Meng-overlay seluruh baris data kasus ke dalam PDF Template asli (SPTJM-Pengganti.pdf)
 * dan mengembalikan ArrayBuffer PDF terisi.
 */
export async function generatePdfSptjmTerisi(
  kelompok: KelompokDokumenSPTJM,
  customPdfBuffer?: ArrayBuffer
): Promise<Uint8Array> {
  let templateBuffer: ArrayBuffer;

  if (customPdfBuffer) {
    templateBuffer = customPdfBuffer;
  } else {
    const res = await fetch("/SPTJM-Pengganti.pdf");
    if (!res.ok) {
      throw new Error("Gagal mengunduh template /SPTJM-Pengganti.pdf dari server.");
    }
    templateBuffer = await res.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(templateBuffer);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const pages = pdfDoc.getPages();
  const page1 = pages[0]; // Halaman 1
  const page2 = pages[1]; // Halaman 2 (Ttd)
  const page3 = pages[2]; // Halaman 3 (Lampiran)

  const black = rgb(0, 0, 0);

  // -------------------------------------------------------------------------
  // HALAMAN 1 — ISIAN HEADER, WILAYAH & TABEL MULTI-BARIS
  // -------------------------------------------------------------------------
  if (page1) {
    // Header Info:
    page1.drawText(`: ${kelompok.noBast}`, { x: 535, y: 240, size: 9, font: fontMono, color: black, rotate: degrees(90) });
    page1.drawText(`: ${kelompok.alokasiBulan}`, { x: 513, y: 240, size: 9, font: fontBold, color: black, rotate: degrees(90) });

    // Metadata Wilayah
    page1.drawText(`: ${kelompok.kelurahan}`, { x: 195, y: 440, size: 9, font: fontBold, color: black, rotate: degrees(90) });
    page1.drawText(`: ${kelompok.kecamatan}`, { x: 173, y: 440, size: 9, font: fontBold, color: black, rotate: degrees(90) });
    page1.drawText(`: ${kelompok.kabupatenKota}`, { x: 151, y: 440, size: 9, font: fontBold, color: black, rotate: degrees(90) });
    page1.drawText(`: ${kelompok.provinsi}`, { x: 129, y: 440, size: 9, font: fontBold, color: black, rotate: degrees(90) });

    // Multi-Baris Tabel Halaman 1 (Baris 1 = X:65, Baris 2 = X:42, Baris 3 = X:19)
    const p1RowsX = [65, 42, 19];

    kelompok.daftarKasus.forEach((item: DetailItemSPTJM, idx: number) => {
      if (idx >= p1RowsX.length) return;
      const rX = p1RowsX[idx];

      // No
      page1.drawText(String(idx + 1), { x: rX, y: 35, size: 8, font: fontBold, color: black, rotate: degrees(90) });

      // PBP Awal (Hak)
      page1.drawText(item.pbpAwalNIK, { x: rX, y: 60, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page1.drawText(item.pbpAwalNoKK, { x: rX, y: 150, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page1.drawText(potongTeks(item.pbpAwalNama, 18), { x: rX, y: 230, size: 8, font: fontBold, color: black, rotate: degrees(90) });
      page1.drawText(potongTeks(item.pbpAwalAlamat, 22), { x: rX, y: 310, size: 6.5, font: fontRegular, color: black, rotate: degrees(90) });

      // PBP Pengganti
      page1.drawText(item.penggantiNIK, { x: rX, y: 430, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page1.drawText(item.penggantiNoKK, { x: rX, y: 510, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page1.drawText(potongTeks(item.penggantiNama, 18), { x: rX, y: 590, size: 8, font: fontBold, color: black, rotate: degrees(90) });
      page1.drawText(potongTeks(item.penggantiAlamat, 22), { x: rX, y: 670, size: 6.5, font: fontRegular, color: black, rotate: degrees(90) });
      page1.drawText(potongTeks(item.penggantiPekerjaan, 14), { x: rX, y: 780, size: 7.5, font: fontRegular, color: black, rotate: degrees(90) });
    });
  }

  // -------------------------------------------------------------------------
  // HALAMAN 2 — LEMBAR TANDA TANGAN BASAH
  // -------------------------------------------------------------------------
  if (page2) {
    page2.drawText(`Kepala Desa / Lurah ${kelompok.kelurahan}`, { x: 380, y: 250, size: 9, font: fontBold, color: black, rotate: degrees(90) });
    page2.drawText(`${kelompok.kabupatenKota}, `, { x: 180, y: 580, size: 9, font: fontBold, color: black, rotate: degrees(90) });
  }

  // -------------------------------------------------------------------------
  // HALAMAN 3 — LAMPIRAN TABEL RINCIAN LENGKAP & BARIS JUMLAH MULTI-BARIS
  // -------------------------------------------------------------------------
  if (page3) {
    // Header Grid Metadata Lampiran
    page3.drawText(`: ${kelompok.provinsi}`, { x: 508, y: 175, size: 8, font: fontBold, color: black, rotate: degrees(90) });
    page3.drawText(`: ${kelompok.kabupatenKota}`, { x: 487, y: 175, size: 8, font: fontBold, color: black, rotate: degrees(90) });
    page3.drawText(`: ${kelompok.alokasiBulan}`, { x: 466, y: 175, size: 8, font: fontBold, color: black, rotate: degrees(90) });

    page3.drawText(`: ${kelompok.kecamatan}`, { x: 508, y: 435, size: 8, font: fontBold, color: black, rotate: degrees(90) });
    page3.drawText(`: ${kelompok.kelurahan}`, { x: 487, y: 435, size: 8, font: fontBold, color: black, rotate: degrees(90) });

    // BAST Number / QR Code Kanan
    page3.drawText(kelompok.noBast, { x: 505, y: 715, size: 8, font: fontMono, color: black, rotate: degrees(90) });

    // Multi-Baris Tabel Halaman 3 (Up to 16 rows)
    const p3RowsX = [422, 398, 374, 350, 326, 302, 278, 254, 230, 206, 182, 158, 134, 110, 86, 62];

    kelompok.daftarKasus.forEach((item: DetailItemSPTJM, idx: number) => {
      if (idx >= p3RowsX.length) return;
      const rX = p3RowsX[idx];

      // No
      page3.drawText(String(idx + 1), { x: rX, y: 35, size: 8, font: fontBold, color: black, rotate: degrees(90) });

      // PBP Awal (Hak)
      page3.drawText(item.pbpAwalNIK, { x: rX, y: 60, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page3.drawText(item.pbpAwalNoKK, { x: rX, y: 150, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page3.drawText(potongTeks(item.pbpAwalNama, 18), { x: rX, y: 230, size: 8, font: fontBold, color: black, rotate: degrees(90) });
      page3.drawText(potongTeks(item.pbpAwalAlamat, 22), { x: rX, y: 310, size: 6.5, font: fontRegular, color: black, rotate: degrees(90) });

      // PBP Pengganti
      page3.drawText(item.penggantiNIK, { x: rX, y: 430, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page3.drawText(item.penggantiNoKK, { x: rX, y: 510, size: 7.5, font: fontMono, color: black, rotate: degrees(90) });
      page3.drawText(potongTeks(item.penggantiNama, 18), { x: rX, y: 590, size: 8, font: fontBold, color: black, rotate: degrees(90) });
      page3.drawText(potongTeks(item.penggantiAlamat, 22), { x: rX, y: 670, size: 6.5, font: fontRegular, color: black, rotate: degrees(90) });
      page3.drawText(potongTeks(item.penggantiPekerjaan, 14), { x: rX, y: 780, size: 7.5, font: fontRegular, color: black, rotate: degrees(90) });
    });

    // Baris JUMLAH di Bagian Bawah Tabel Halaman 3
    const totalBeras = kelompok.totalKasus * 30;
    page3.drawText(`${kelompok.totalKasus} PBP (${totalBeras.toLocaleString("id-ID")} Kg)`, {
      x: 38,
      y: 780,
      size: 8.5,
      font: fontBold,
      color: black,
      rotate: degrees(90),
    });
  }

  return await pdfDoc.save();
}

function potongTeks(str: string, maxLen: number): string {
  if (!str) return "—";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
