/**
 * lib/db.ts
 * Module IndexedDB murni (tanpa library eksternal) untuk persistent storage.
 * Menyimpan data Master 142k, data BAST, Log Pelayanan, dan Hasil Audit di browser
 * sehingga tidak hilang saat halaman di-refresh.
 */

import type { MasterRow, BastRow, LogEntry, AuditRow, LogPenggantiTertolak } from "@/types";

const DB_NAME = "BulogPoskoDB";
const DB_VERSION = 2;

export interface StoredMeta {
  loadedBASTFiles: string[];
  poskoAktif: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB tidak didukung pada environment ini."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("master")) {
        db.createObjectStore("master", { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("bast")) {
        db.createObjectStore("bast", { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("log")) {
        db.createObjectStore("log", { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("audit")) {
        db.createObjectStore("audit", { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("pengganti_tertolak")) {
        db.createObjectStore("pengganti_tertolak", { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function simpanMasterKeDB(records: MasterRow[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("master", "readwrite");
    const store = tx.objectStore("master");
    store.clear();
    for (let i = 0; i < records.length; i++) {
      store.add(records[i]);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilMasterDariDB(): Promise<MasterRow[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("master", "readonly");
    const store = tx.objectStore("master");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as MasterRow[]);
    req.onerror = () => reject(req.error);
  });
}

export async function simpanBastKeDB(records: BastRow[], loadedFiles: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["bast", "meta"], "readwrite");
    const bastStore = tx.objectStore("bast");
    const metaStore = tx.objectStore("meta");

    bastStore.clear();
    for (let i = 0; i < records.length; i++) {
      bastStore.add(records[i]);
    }

    metaStore.put({ id: "bast_files", files: loadedFiles });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilBastDariDB(): Promise<{ records: BastRow[]; files: string[] }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["bast", "meta"], "readonly");
    const bastStore = tx.objectStore("bast");
    const metaStore = tx.objectStore("meta");

    const reqBast = bastStore.getAll();
    const reqMeta = metaStore.get("bast_files");

    tx.oncomplete = () => {
      resolve({
        records: reqBast.result as BastRow[],
        files: (reqMeta.result?.files as string[]) || [],
      });
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function simpanLogKeDB(logs: LogEntry[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("log", "readwrite");
    const store = tx.objectStore("log");
    store.clear();
    for (let i = 0; i < logs.length; i++) {
      store.add(logs[i]);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilLogDariDB(): Promise<LogEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("log", "readonly");
    const store = tx.objectStore("log");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as LogEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function simpanAuditKeDB(records: AuditRow[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("audit", "readwrite");
    const store = tx.objectStore("audit");
    store.clear();
    for (let i = 0; i < records.length; i++) {
      store.add(records[i]);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilAuditDariDB(): Promise<AuditRow[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("audit", "readonly");
    const store = tx.objectStore("audit");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as AuditRow[]);
    req.onerror = () => reject(req.error);
  });
}

export async function simpanPenggantiTertolakKeDB(records: LogPenggantiTertolak[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pengganti_tertolak", "readwrite");
    const store = tx.objectStore("pengganti_tertolak");
    store.clear();
    for (let i = 0; i < records.length; i++) {
      store.add(records[i]);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilPenggantiTertolakDariDB(): Promise<LogPenggantiTertolak[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pengganti_tertolak", "readonly");
    const store = tx.objectStore("pengganti_tertolak");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as LogPenggantiTertolak[]);
    req.onerror = () => reject(req.error);
  });
}

export async function bersihkanSemuaDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["master", "bast", "log", "audit", "pengganti_tertolak", "meta"], "readwrite");
    tx.objectStore("master").clear();
    tx.objectStore("bast").clear();
    tx.objectStore("log").clear();
    tx.objectStore("audit").clear();
    tx.objectStore("pengganti_tertolak").clear();
    tx.objectStore("meta").clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
