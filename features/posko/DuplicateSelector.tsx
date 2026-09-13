/**
 * features/posko/DuplicateSelector.tsx
 * Panel disambiguasi nama ganda — tampil saat ditemukan >1 warga bernama sama.
 * Sumber: index.html L273–283 (HTML), L1264–1300 (JS render duplicate list)
 */
"use client";

import { cleanStr } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { MasterRow, BastRow } from "@/types";

interface Props {
  matchesMaster: MasterRow[];
  matchBAST: BastRow | null;
  poskoAktif: string;
  matchMode: string;
  onPilih: (item: MasterRow) => void;
}

export default function DuplicateSelector({ matchesMaster, poskoAktif, onPilih }: Props) {
  const cleanPosko = cleanStr(poskoAktif);

  function getItemKey(item: MasterRow, idx: number) {
    return [item.NIK || "", item._sourceFile || "", item._sourceRow ?? idx].join("|");
  }

  return (
    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
          <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Ditemukan {matchesMaster.length} orang bernama serupa di Jakarta Utara:
        </span>
        <Badge variant="warning">Pilih data yang sesuai fisik</Badge>
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {matchesMaster.slice(0, 15).map((item, idx) => {
          const itemKel = cleanStr(item.KEL_NAME || "");
          const isPoskoSama = itemKel.includes(cleanPosko);
          return (
            <button
              key={getItemKey(item, idx)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2
                ${isPoskoSama
                  ? "bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
              onClick={() => onPilih(item)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black truncate">{item.NAMA}</span>
                  {isPoskoSama
                    ? <Badge variant="success"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Posko Ini</Badge>
                    : <Badge variant="neutral">Wilayah Lain</Badge>}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Kel. <b>{item.KEL_NAME || "—"}</b> · Kec. {item.KEC_NAME || "—"} · RT {item.NO_RT || "—"}/RW {item.NO_RW || "—"} · {item.USIA || "—"} thn
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-mono text-[10px] text-slate-400 block">NIK: {item.NIK || "—"}</span>
                <span className="text-[11px] text-slate-600 truncate max-w-[180px] block">{item.ALAMAT || ""}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
