/**
 * lib/demoData.ts
 * Data demo sesuai BAST RBU aktual — digunakan tombol "Demo RBU".
 * Sumber: index.html L746–850
 */

import type { MasterRow, BastRow, AuditRow } from "@/types";

export const demoMaster: MasterRow[] = [
  {
    NAMA: "JAENAL ABIDIN",
    NIK: "3172032211760001",
    NO_KK: "3172032105190015",
    KEL_NAME: "Rawa Badak Utara",
    KEC_NAME: "Koja",
    ALAMAT: "JL. PEMBANGUNAN 1",
    NO_RT: "12",
    NO_RW: "9",
    USIA: "49",
    HUBUNGAN_KELUARGA: "Kepala Keluarga",
    DESIL: "1",
    bansos: "Sembako",
    ID_WILAYAH: "3172031004",
  },
  {
    NAMA: "JAENAL ABIDIN",
    NIK: "3172010803720005",
    NO_KK: "3172012803120001",
    KEL_NAME: "Cilincing",
    KEC_NAME: "Cilincing",
    ALAMAT: "JL. KAMPUNG SAWAH NO. 88",
    NO_RT: "01",
    NO_RW: "02",
    USIA: "54",
    HUBUNGAN_KELUARGA: "Kepala Keluarga",
    DESIL: "2",
    bansos: "Sembako",
    ID_WILAYAH: "3172011001",
  },
  {
    NAMA: "MASHURI BIN DJUHRI",
    NIK: "3172031212400005",
    NO_KK: "3172030501097623",
    KEL_NAME: "Rawa Badak Utara",
    KEC_NAME: "Koja",
    ALAMAT: "JL.F GG.L NO.16",
    NO_RT: "2",
    NO_RW: "2",
    USIA: "86",
    HUBUNGAN_KELUARGA: "Kepala Keluarga",
    DESIL: "1",
    bansos: "Sembako",
    ID_WILAYAH: "3172031004",
  },
  {
    NAMA: "JAENATUN",
    NIK: "3172034101780008",
    NO_KK: "3172030501090716",
    KEL_NAME: "Rawa Badak Utara",
    KEC_NAME: "Koja",
    ALAMAT: "JL F GG.H/13",
    NO_RT: "7",
    NO_RW: "2",
    USIA: "48",
    HUBUNGAN_KELUARGA: "Kepala Keluarga",
    DESIL: "1",
    bansos: "Sembako",
    ID_WILAYAH: "3172031004",
  },
];

export const demoBAST: BastRow[] = [
  {
    NAMA: "JAENAL ABIDIN",
    KELURAHAN_BAST: "Rawa Badak Utara",
    BARCODE: "317203100401095-3172032211760001-3172032105190015",
    NIK: "3172032211760001",
    NO_KK: "3172032105190015",
    NO_URUT: 1095,
    ALAMAT_BAST: "JL. PEMBANGUNAN 1",
  },
  {
    NAMA: "JAENATUN",
    KELURAHAN_BAST: "Rawa Badak Utara",
    BARCODE: "317203100401096-3172034101780008-3172030501090716",
    NIK: "3172034101780008",
    NO_KK: "3172030501090716",
    NO_URUT: 1096,
    ALAMAT_BAST: "JL F GG.H/13",
  },
  {
    NAMA: "MASHURI BIN DJUHRI",
    KELURAHAN_BAST: "Rawa Badak Utara",
    BARCODE: "317203100401449-3172031212400005-3172030501097623",
    NIK: "3172031212400005",
    NO_KK: "3172030501097623",
    NO_URUT: 1449,
    ALAMAT_BAST: "JL.F GG.L NO.16",
  },
];

export const demoBulogExport: AuditRow[] = [
  {
    no: 1,
    nama: "JAENAL ABIDIN",
    nik: "3172032211760001",
    status_pbp: "Normal",
    nama_pengganti: "-",
    nik_pengganti: "-",
    notes: "Diterima Langsung",
    kelurahan: "Rawa Badak Utara",
    status_serah: "-",
  },
];
