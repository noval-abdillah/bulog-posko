/**
 * lib/ai.ts
 * Client library helper untuk memanggil Next.js API Route AI 9router.
 */

import { fixNIK, cleanNum } from "@/lib/utils";

export interface OcrKtpResult {
  nik: string;
  nama: string;
  noKK: string;
  alamat: string;
  rt: string;
  rw: string;
}

function cleanOcrText(value: unknown): string {
  return String(value ?? "")
    .replace(/^(NIK|NAMA|NO\.?\s*KK|ALAMAT|RT\/?RW|RT|RW)\s*:?\s*/i, "")
    .trim();
}

function normalizeOcrResult(raw: Partial<OcrKtpResult>): OcrKtpResult {
  const nik = fixNIK(raw.nik);
  const noKK = fixNIK(raw.noKK);

  return {
    nik: nik.length === 16 ? nik : "",
    nama: cleanOcrText(raw.nama),
    noKK: noKK.length === 16 ? noKK : "",
    alamat: cleanOcrText(raw.alamat),
    rt: cleanNum(raw.rt).slice(0, 3),
    rw: cleanNum(raw.rw).slice(0, 3),
  };
}

export interface DeepMatchResult {
  bestMatchIndex: number | null;
  confidenceScore: number;
  alasan: string;
}

async function callAI(action: string, payload: unknown): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Gagal memproses AI automation.");
  }

  return data.result as string;
}

function extractJsonFromText(text: string): string {
  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return clean;
}

export async function aiScanOcrKtp(imageBase64: string): Promise<OcrKtpResult> {
  const text = await callAI("ocr_ktp", { imageBase64 });
  const cleanJsonText = extractJsonFromText(text);
  return normalizeOcrResult(JSON.parse(cleanJsonText) as Partial<OcrKtpResult>);
}

export async function aiCopilotQuery(
  userQuery: string,
  contextData: unknown,
  chatHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  return callAI("copilot", { userQuery, contextData, chatHistory });
}

export async function aiGenerateAuditInsight(
  statsData: unknown,
  poskoAktif: string
): Promise<string> {
  return callAI("audit_insight", { statsData, poskoAktif });
}

export async function aiPersonalizeWaMsg(
  tone: string,
  rtTarget: string,
  rwTarget: string,
  kelurahan: string,
  wargaList: unknown[]
): Promise<string> {
  return callAI("wa_personalize", { tone, rtTarget, rwTarget, kelurahan, wargaList });
}

export async function aiDeepMatchName(
  targetName: string,
  candidateList: unknown[]
): Promise<DeepMatchResult> {
  const text = await callAI("deep_match", { targetName, candidateList });
  const cleanJsonText = extractJsonFromText(text);
  return JSON.parse(cleanJsonText) as DeepMatchResult;
}
