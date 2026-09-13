/**
 * hooks/usePdfBast.ts
 * Hook untuk parsing file PDF BAST Bulog format 2-kolom menggunakan PDF.js
 * Dilengkapi pelacakan _sourcePage, _sourceFile, dan validasi selisih alokasi.
 */
"use client";

import { useCallback } from "react";
import { extractBASTFromColumn } from "@/services/bastParser";
import type { BastRow } from "@/types";

function extractKelurahanFromText(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /(?:Kelurahan\s*[\/\\]\s*Desa|Desa\s*[\/\\]\s*Kelurahan|Kelurahan|Desa|Kel\.?)\s*[:\|\s]+\s*([A-Za-z\s]+?)(?=\s*(?:Kecamatan|KEC|Kota|Kabupaten|Kab|Provinsi|Total|Jumlah|Kami|Alokasi|Halaman|RT|RW|\d|$))/i,
    /(?:Kelurahan|Desa|Kel\.?)\s+([A-Za-z\s]{3,30})(?=\s*(?:Kecamatan|KEC|Kota|Kabupaten|Kab|Provinsi|Total|Jumlah|Kami|Alokasi|Halaman|\d|$))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let cand = match[1].trim();
      cand = cand.replace(/\s+(?:KOTA|KABUPATEN|KAB|PROVINSI|ADM|JAKARTA|UTARA|SELATAN|BARAT|TIMUR|PUSAT|KECAMATAN|KEC|TOTAL|ALOKASI|HALAMAN|PBP).*$/i, "").trim();
      cand = cand.replace(/^(?:Kelurahan|Desa|Kel\.?|\/|:)\s*/i, "").trim();

      if (cand.length >= 3 && !/^(JAKARTA|UTARA|KECAMATAN|PROVINSI|KOTA|TOTAL|ALOKASI|KAMI)$/i.test(cand)) {
        return cand;
      }
    }
  }

  return null;
}

export function usePdfBast() {
  const parsePdfFile = useCallback(
    async (
      file: File,
      kelDefault: string,
      onProgress?: (pNum: number, total: number) => void
    ): Promise<{ records: BastRow[]; kelurahan: string; totalPerkiraan?: number }> => {
      const pdfjsLib = await import("pdfjs-dist");

      if (typeof window !== "undefined") {
        const version = pdfjsLib.version || "3.11.174";
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();

      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: true,
        }).promise;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        throw new Error(`Gagal membuka struktur PDF: ${errorMsg}`);
      }

      let kelBAST = kelDefault;
      let totalPerkiraan: number | undefined = undefined;

      // Ekstraksi Kelurahan & Total Alokasi dari Halaman 1-3
      for (let pNum = 1; pNum <= Math.min(3, pdf.numPages); pNum++) {
        try {
          const p = await pdf.getPage(pNum);
          const pText = await p.getTextContent();
          const strPage = pText.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");

          const extracted = extractKelurahanFromText(strPage);
          if (extracted) {
            kelBAST = extracted;
          }

          const matchTotal = strPage.match(/(?:Total|Jumlah)\s*(?:Alokasi|PBP|Penerima)?\s*[:\|\s]+(\d+)/i);
          if (matchTotal && matchTotal[1]) {
            totalPerkiraan = parseInt(matchTotal[1], 10);
          }

          if (extracted && totalPerkiraan) break;
        } catch (e) {
          console.warn(`Gagal mengekstrak metadata dari halaman ${pNum}:`, e);
        }
      }

      const allRecords: BastRow[] = [];
      let totalTextItemsCount = 0;

      for (let pNum = 1; pNum <= pdf.numPages; pNum++) {
        if (pNum % 10 === 0 || pNum === pdf.numPages) {
          onProgress?.(pNum, pdf.numPages);
          await new Promise((r) => setTimeout(r, 0));
        }

        const page = await pdf.getPage(pNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;
        if (!items || items.length === 0) continue;

        totalTextItemsCount += items.length;

        const viewport = page.getViewport({ scale: 1 });
        const midX = viewport.width / 2;

        const leftItems: { str: string; x: number; y: number }[] = [];
        const rightItems: { str: string; x: number; y: number }[] = [];

        for (const it of items) {
          if (!("str" in it) || !it.str || !it.str.trim()) continue;
          const x = it.transform[4];
          const y = it.transform[5];
          if (x < midX) {
            leftItems.push({ str: it.str, x, y });
          } else {
            rightItems.push({ str: it.str, x, y });
          }
        }

        leftItems.sort((a, b) => b.y - a.y || a.x - b.x);
        rightItems.sort((a, b) => b.y - a.y || a.x - b.x);

        const leftExtracted = extractBASTFromColumn(leftItems, kelBAST, file.name, pNum);
        const rightExtracted = extractBASTFromColumn(rightItems, kelBAST, file.name, pNum);

        allRecords.push(...leftExtracted);
        allRecords.push(...rightExtracted);
      }

      if (allRecords.length === 0) {
        if (totalTextItemsCount < 50) {
          throw new Error(
            "PDF ini terdeteksi sebagai gambar (scanned/foto PDF) tanpa layer teks digital. PDF BAST Bulog harus berbentuk PDF digital dengan barcode teks."
          );
        } else {
          throw new Error(
            `Tidak ada barcode PBP terdeteksi di dalam file PDF ini. Pastikan file adalah BAST Bulog resmi.`
          );
        }
      }

      return { records: allRecords, kelurahan: kelBAST, totalPerkiraan };
    },
    []
  );

  return { parsePdfFile };
}
