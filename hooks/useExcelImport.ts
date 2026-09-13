/**
 * hooks/useExcelImport.ts
 * Hook untuk membaca file Excel menggunakan Web Worker dengan dukungan multi-sheet & validasi header.
 */
"use client";

import { useCallback } from "react";
import type { MasterRow } from "@/types";

export function useExcelImport() {
  const dapatkanDaftarSheet = useCallback(async (file: File): Promise<string[]> => {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    return workbook.SheetNames;
  }, []);

  const bacaExcelMasterViaWorker = useCallback(
    (
      file: File,
      selectedSheet?: string,
      onProgress?: (processed: number, total: number) => void
    ): Promise<{ records: MasterRow[]; sheetUsed: string; sheetNames: string[] }> => {
      return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.Worker) {
          fallbackBacaExcelMaster(file, selectedSheet).then(resolve).catch(reject);
          return;
        }

        const worker = new Worker("/excelWorker.js");
        file.arrayBuffer().then((buffer) => {
          worker.postMessage(
            { fileBuffer: buffer, mode: "master", selectedSheet, fileName: file.name },
            [buffer]
          );
        });

        worker.onmessage = (e) => {
          const { type, data, processed, total, message, sheetUsed, sheetNames } = e.data;
          if (type === "progress") {
            onProgress?.(processed, total);
          } else if (type === "success") {
            worker.terminate();
            resolve({
              records: data as MasterRow[],
              sheetUsed: sheetUsed || "UTAMA",
              sheetNames: sheetNames || [],
            });
          } else if (type === "error") {
            worker.terminate();
            reject(new Error(message));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          console.warn("Worker error, fallback ke sync reader:", err);
          fallbackBacaExcelMaster(file, selectedSheet).then(resolve).catch(reject);
        };
      });
    },
    []
  );

  const bacaExcel = useCallback(
    async (file: File, selectedSheet?: string): Promise<Record<string, unknown>[]> => {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName =
        selectedSheet ||
        (workbook.SheetNames.includes("UTAMA") ? "UTAMA" : workbook.SheetNames[0]);
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
    },
    []
  );

  const bacaExcelSheet0 = useCallback(
    async (file: File): Promise<Record<string, unknown>[]> => {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(
        workbook.Sheets[workbook.SheetNames[0]]
      );
    },
    []
  );

  return { dapatkanDaftarSheet, bacaExcelMasterViaWorker, bacaExcel, bacaExcelSheet0 };
}

async function fallbackBacaExcelMaster(
  file: File,
  selectedSheet?: string
): Promise<{ records: MasterRow[]; sheetUsed: string; sheetNames: string[] }> {
  const XLSX = await import("xlsx");
  const { normalizeMasterRow } = await import("@/services/masterData");
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName =
    selectedSheet ||
    (workbook.SheetNames.includes("UTAMA") ? "UTAMA" : workbook.SheetNames[0]);
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

  const records = raw.map((r, idx) => normalizeMasterRow(r, file.name, idx + 2));
  return { records, sheetUsed: sheetName, sheetNames: workbook.SheetNames };
}
