/**
 * public/excelWorker.js
 * Web Worker untuk membaca dan menormalisasi file Excel ukuran besar (seperti Master 142k)
 * Dilengkapi validasi struktur header, pelacakan provenance, dan sanitasi NIK/NoKK presisi 100%.
 * Menggunakan SheetJS lokal (bukan CDN) agar bisa jalan offline.
 */

importScripts("/xlsx.full.min.js");

/**
 * Sanitasi NIK/NoKK 16-digit dari berbagai format rusak Excel:
 * - Notasi ilmiah: "3.17203E+15"
 * - Float Excel kehilangan digit trailing
 * - Leading zero hilang
 */
function fixNIK(val) {
  if (val === null || val === undefined || val === "") return "";
  var raw = String(val).trim();
  if (/^[\d.]+[eE][+\-]?\d+$/.test(raw)) {
    var num = Number(raw);
    if (!isNaN(num) && isFinite(num)) raw = Math.round(num).toString();
  }
  var digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 0) return "";
  if (digits.length < 16 && digits.length >= 10) return digits.padStart(16, "0");
  if (digits.length > 16) return digits.slice(0, 16);
  return digits;
}

self.onmessage = function (e) {
  var fileBuffer = e.data.fileBuffer;
  var mode = e.data.mode;
  var selectedSheet = e.data.selectedSheet;
  var fileName = e.data.fileName;

  try {
    var data = new Uint8Array(fileBuffer);
    var workbook = XLSX.read(data, { type: "array", cellText: true, cellNF: false });

    var sheetName =
      selectedSheet ||
      (mode === "master" && workbook.SheetNames.includes("UTAMA")
        ? "UTAMA"
        : workbook.SheetNames[0]);

    var worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error('Sheet "' + sheetName + '" tidak ditemukan pada file Excel.');
    }

    // Baca sebagai raw dengan header: 1 agar bisa kontrol tipe data
    var raw = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
    if (raw.length === 0) {
      throw new Error('Sheet "' + sheetName + '" kosong atau tidak memiliki baris data.');
    }

    var firstRow = raw[0];
    var headers = Object.keys(firstRow);

    if (mode === "master") {
      var cleanHeaders = headers.map(function (h) {
        return h.trim().toUpperCase().replace(/[\s_.\-\/]/g, "");
      });
      var hasNama = cleanHeaders.some(function (a) {
        return a.indexOf("NAMA") !== -1;
      });

      if (!hasNama) {
        throw new Error(
          "Struktur kolom Excel tidak sesuai! Kolom NAMA tidak ditemukan. Kolom yang ada: [" +
            headers.slice(0, 10).join(", ") +
            "]."
        );
      }

      var normalized = [];
      var total = raw.length;

      for (var i = 0; i < total; i++) {
        var r = raw[i];
        var norm = {};
        for (var k in r) {
          var cleanKey = k.trim().toUpperCase().replace(/[\s_.\-\/]/g, "");
          norm[cleanKey] = r[k];
        }

        var nama =
          norm["NAMA"] ||
          norm["NAMALENGKAP"] ||
          norm["NAMAPBP"] ||
          norm["NAMAPENERIMA"] ||
          norm["NAMAKEPALAKELUARGA"] ||
          norm["NAMAWARGA"] ||
          "";

        // NIK — gunakan fixNIK untuk handle notasi ilmiah & leading zero
        var rawNikVal =
          norm["NIK"] ||
          norm["NIKKPM"] ||
          norm["NIKPENERIMA"] ||
          norm["NIKWARGA"] ||
          norm["NONIK"] ||
          norm["NOKTP"] ||
          norm["NOMORKTP"] ||
          norm["NIKPBP"] ||
          norm["KTP"] ||
          norm["NIKHEAD"] ||
          norm["NIKAKG"] ||
          norm["NOIDENTITAS"] ||
          norm["IDPENERIMA"] ||
          norm["KPMID"] ||
          norm["NIKKEPALAKELUARGA"] ||
          "";

        if (!rawNikVal) {
          for (var nk in norm) {
            if (
              nk.indexOf("NIK") !== -1 ||
              nk.indexOf("NOKTP") !== -1 ||
              nk.indexOf("NONIK") !== -1
            ) {
              if (norm[nk]) {
                rawNikVal = norm[nk];
                break;
              }
            }
          }
        }
        var idWilayah = norm["IDWILAYAH"] || norm["KODEWILAYAH"] || norm["ID"] || "";
        var nik = fixNIK(rawNikVal);
        var isTanpaNIK = false;

        // Fallback jika file Master tidak memiliki kolom NIK sama sekali (menggunakan ID_WILAYAH / Baris)
        if (!nik) {
          isTanpaNIK = true;
          var cleanIdW = fixNIK(idWilayah);
          nik = cleanIdW && cleanIdW.length >= 6 ? cleanIdW : "IDW-" + (i + 2);
        }

        // No. KK — sama
        var rawKKVal = norm["NOKK"] !== undefined ? norm["NOKK"] : (norm["NOMORKK"] || norm["KK"] || norm["KARTUKELUARGA"] || "");
        var noKK = fixNIK(rawKKVal);

        var kelurahan =
          norm["KELURAHAN"] || norm["KELNAME"] || norm["NAMAKELURAHAN"] || norm["DESAKELURAHAN"] || norm["KEL"] || norm["DESA"] || "";
        var kecamatan = norm["KECAMATAN"] || norm["KECNAME"] || norm["NAMAKECAMATAN"] || norm["KEC"] || "";
        var alamat = norm["ALAMAT"] || norm["ALAMATLENGKAP"] || norm["ALAMATKTP"] || norm["ALAMATTINGGAL"] || norm["JALAN"] || "";

        var rawRt = norm["RT"] !== undefined ? norm["RT"] : (norm["NORT"] !== undefined ? norm["NORT"] : (norm["NOMORT"] || ""));
        var rawRw = norm["RW"] !== undefined ? norm["RW"] : (norm["NORW"] !== undefined ? norm["NORW"] : (norm["NOMORW"] || ""));
        var rt = String(rawRt !== null && rawRt !== undefined ? rawRt : "").trim();
        var rw = String(rawRw !== null && rawRw !== undefined ? rawRw : "").trim();

        var usia = norm["USIA"] || norm["UMUR"] || "";
        var hubungan = norm["HUBUNGANKELUARGA"] || norm["HUBUNGAN"] || norm["STATUSKELUARGA"] || norm["SHDK"] || "";
        var desil = norm["DESIL"] || norm["P3KE"] || norm["KATEGORI"] || "";
        var bansos = norm["BANSOS"] || norm["PROGRAM"] || norm["BANTUAN"] || "Sembako";
        var idWilayah = norm["IDWILAYAH"] || norm["KODEWILAYAH"] || "";

        normalized.push({
          NAMA: String(nama).trim(),
          NIK: nik,
          NO_KK: noKK,
          KEL_NAME: String(kelurahan).trim(),
          KEC_NAME: String(kecamatan).trim(),
          ALAMAT: String(alamat).trim(),
          NO_RT: rt,
          NO_RW: rw,
          USIA: String(usia).trim(),
          HUBUNGAN_KELUARGA: String(hubungan).trim(),
          DESIL: String(desil).trim(),
          bansos: String(bansos).trim(),
          ID_WILAYAH: String(idWilayah).trim(),
          _sourceFile: fileName || "File_Master.xlsx",
          _sourceRow: i + 2,
          _isTanpaNIK: isTanpaNIK,
          _rawColumns: r,
        });

        if (i % 10000 === 0 || i === total - 1) {
          self.postMessage({ type: "progress", processed: i + 1, total: total });
        }
      }

      self.postMessage({ type: "success", data: normalized, sheetUsed: sheetName, sheetNames: workbook.SheetNames });
    } else {
      self.postMessage({ type: "success", data: raw, sheetUsed: sheetName, sheetNames: workbook.SheetNames });
    }
  } catch (err) {
    self.postMessage({ type: "error", message: err.message || "Gagal memproses Excel" });
  }
};
