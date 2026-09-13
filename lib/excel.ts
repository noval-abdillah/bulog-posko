/**
 * lib/excel.ts
 * Generator Excel Profesional Korporat BULOG menggunakan ExcelJS.
 * Menghasilkan file Excel berwarna, menarik, auto-fit width, anti-E+15 (Text murni NIK/KK),
 * serta dilengkapi Kop Laporan Resmi Perum BULOG.
 */

import ExcelJS from "exceljs";
import { formatTanggalFile } from "@/lib/utils";

export interface OpsiEksporExcel {
  judulLaporan?: string;
  subJudul?: string;
  posko?: string;
}

export async function eksporExcel(
  data: Record<string, unknown>[],
  namaSheet: string,
  namaFile: string,
  opsi?: OpsiEksporExcel
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error("Data ekspor kosong.");
  }

  const keys = Object.keys(data[0]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Posko Bulog - Perum BULOG";
  workbook.created = new Date();

  // Excel sheet name limit is 31 chars & no invalid chars (\ / ? * : [ ])
  const safeSheetName = (namaSheet || "Laporan_Bulog")
    .replace(/[\\/?*:\[\]]/g, "_")
    .slice(0, 31);

  const worksheet = workbook.addWorksheet(safeSheetName, {
    views: [{ showGridLines: true }],
  });

  const lastColLetter = getColumnLetter(keys.length);

  // -------------------------------------------------------------------------
  // 1. KOP HEADER LAPORAN RESMI BULOG (BARIS 1–3)
  // -------------------------------------------------------------------------

  // Baris 1: Main Banner Bulog
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const r1 = worksheet.getCell("A1");
  r1.value = "PERUM BULOG — SISTEM POSKO VERIFIKASI & AUDIT BANSOS PBP";
  r1.font = { name: "Arial", size: 13, bold: true, color: { argb: "FFFFFF" } };
  r1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "07264B" } }; // Dark Navy
  r1.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 30;

  // Baris 2: Subtitle Laporan
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const r2 = worksheet.getCell("A2");
  const namaJudul = opsi?.judulLaporan || namaFile.replace(/_/g, " ");
  r2.value = `LAPORAN RESMI: ${namaJudul.toUpperCase()}`;
  r2.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
  r2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3B73" } }; // Bulog Blue
  r2.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 24;

  // Baris 3: Metadata Wilayah & Waktu
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const r3 = worksheet.getCell("A3");
  const poskoInfo = opsi?.posko ? ` | Posko Kelurahan: ${opsi.posko}` : "";
  const tglFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  r3.value = `Tanggal Ditarik: ${tglFormatted}${poskoInfo} | Wilayah Operasional: Kota Jakarta Utara`;
  r3.font = { name: "Arial", size: 9, italic: true, color: { argb: "0B3B73" } };
  r3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EBF3FB" } }; // Soft Blue Tint
  r3.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(3).height = 20;

  // Baris 4: Pemisah Kosong
  worksheet.getRow(4).height = 10;

  // -------------------------------------------------------------------------
  // 2. HEADER TABEL KOLOM (BARIS 5)
  // -------------------------------------------------------------------------
  const headerRowIndex = 5;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.height = 26;

  keys.forEach((key, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = key;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0B3B73" } }; // Bulog Blue
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: "07264B" } },
      bottom: { style: "medium", color: { argb: "07264B" } },
      left: { style: "thin", color: { argb: "3B82F6" } },
      right: { style: "thin", color: { argb: "3B82F6" } },
    };
  });

  // -------------------------------------------------------------------------
  // 3. BARIS DATA (BARIS 6 ONWARDS) DENGAN ZEBRA STRIPING & AUTO FORMAT
  // -------------------------------------------------------------------------
  const startRowIndex = 6;

  data.forEach((rowObj, rIdx) => {
    const currentRowNum = startRowIndex + rIdx;
    const row = worksheet.getRow(currentRowNum);
    row.height = 22;

    const isEven = rIdx % 2 === 0;
    const rowBgColor = isEven ? "FFFFFF" : "F4F8FA"; // Zebra Striping: White vs Soft Ice Blue

    keys.forEach((key, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const val = rowObj[key];
      const valStr = val !== null && val !== undefined ? String(val).trim() : "";

      const keyUpper = key.toUpperCase();
      const isNIKorKK = keyUpper.includes("NIK") || keyUpper.includes("KK") || keyUpper.includes("BARCODE") || keyUpper.includes("NO");
      const isStatusField = keyUpper.includes("STATUS") || keyUpper.includes("KETERANGAN") || keyUpper.includes("KATEGORI");

      cell.value = valStr;
      cell.font = { name: "Arial", size: 9, color: { argb: "1E293B" } };

      // Base Fill
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBgColor } };

      // Base Border
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };

      // Alignment & Tipe Data Murni Text
      if (isNIKorKK || keyUpper === "NO" || keyUpper === "RT" || keyUpper === "RW") {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        // Force string type & '@' format agar Excel TIDAK ubah NIK/KK keNotasi Eksponen E+15
        cell.numFmt = "@";
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      }

      // Highlight Status Berwarna
      if (isStatusField) {
        const vLow = valStr.toLowerCase();
        if (vLow.includes("sah") || vLow.includes("dtks") || vLow.includes("1 kk") || vLow.includes("sukses") || vLow.includes("lengkap")) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E6F4EA" } }; // Soft Green
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "137333" } }; // Dark Green Text
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (vLow.includes("non-dtks") || vLow.includes("tertolak") || vLow.includes("wajib sptjm") || vLow.includes("anomali") || vLow.includes("waspada") || vLow.includes("urgensi")) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FCE8E6" } }; // Soft Red
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "C5221F" } }; // Dark Red Text
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (vLow.includes("belum") || vLow.includes("tunggu") || vLow.includes("pengaduan")) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF7E0" } }; // Soft Amber
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "B06000" } }; // Dark Amber Text
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 4. AUTO-FIT COLUMN WIDTHS PRESISI (MARGIN AMAN)
  // -------------------------------------------------------------------------
  keys.forEach((key, idx) => {
    const col = worksheet.getColumn(idx + 1);
    let maxLen = key.length;

    for (let i = 0; i < Math.min(data.length, 300); i++) {
      const cellVal = data[i][key];
      if (cellVal !== null && cellVal !== undefined) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    }

    // Minimum width 14, Maximum width 60
    col.width = Math.min(Math.max(maxLen + 5, 14), 60);
  });

  // -------------------------------------------------------------------------
  // 5. EXPORT & DOWNLOAD FILE (.xlsx)
  // -------------------------------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${namaFile}_${formatTanggalFile()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Helper untuk mengonversi indeks angka kolom (1-based) menjadi huruf Excel (misal: 1 -> A, 27 -> AA) */
function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = "";
  let c = colIndex;
  while (c > 0) {
    temp = (c - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    c = Math.floor((c - temp) / 26);
  }
  return letter || "A";
}
