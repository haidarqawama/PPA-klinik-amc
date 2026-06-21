'use client'

import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Package, Barcode, Calendar, Hash, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";
import type { Masters } from "@/types/master";

const formatNumber = (value: string) => {
  const number = value.replace(/[^\d]/g, "");

  if (!number) return "";

  return number.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );
};

const formatStock = (value: string) => {
  const number = value.replace(/[^\d]/g, "");

  if (!number) return "";

  return number.replace(/^0+(?=\d)/, "");
};

export default function EditItem() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const kodeBrng = params.kodeBrng as string;
  const urlNoBatch = searchParams.get("no_batch") || "";
  const urlNoFaktur = searchParams.get("no_faktur") || "";

  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaApotek, setHargaApotek] = useState("");
  const [hargaUmum, setHargaUmum] = useState("");
  const [hargaUtama, setHargaUtama] = useState("");

  const [namaBarang, setNamaBarang] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isObat, setIsObat] = useState(true);
  const [golongan, setGolongan] = useState("");
  const [kategori, setKategori] = useState("");
  const [supplier, setSupplier] = useState("");
  const [satuan, setSatuan] = useState("");
  const [stok, setStok] = useState("");
  const [expired, setExpired] = useState("");
  const [noBatch, setNoBatch] = useState("");
  const [noFaktur, setNoFaktur] = useState("");
  const [message, setMessage] = useState("");
  const [masters, setMasters] = useState<Masters>({
    satuan: [],
    jenis: [],
    golongan: [],
    suppliers: [],
  });

  useEffect(() => {
    let ignore = false;

    async function loadMasters() {
      try {
        const response = await fetch(apiUrl("/api/masters"));
        const data = await response.json();

        if (ignore) return;

        setMasters({
          satuan: data.satuan || [],
          jenis: data.jenis || [],
          golongan: data.golongan || [],
          suppliers: data.suppliers || [],
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadMasters();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadItem() {
      if (!kodeBrng) return;

      try {
        const qs = new URLSearchParams({ no_batch: urlNoBatch, no_faktur: urlNoFaktur });
        const response = await axios.get(
          apiUrl(`/api/items/${kodeBrng}?${qs.toString()}`)
        );
        const item = response.data.data;

        if (ignore) return;

        setNamaBarang(item.nama_brng || "");
        setSatuan(item.kode_sat || "");
        setKategori(item.kdjns || "");
        setSupplier(item.kode_industri || "");
        setBarcode(item.barcode || "");
        setGolongan(item.kode_golongan || "");
        setStok(String(Number(item.stok || 0)));
        setHargaBeli(formatNumber(String(item.h_beli || 0)));
        setHargaApotek(formatNumber(String(item.beliluar || 0)));
        setHargaUmum(formatNumber(String(item.ralan || 0)));
        setHargaUtama(formatNumber(String(item.utama || 0)));

        if (item.no_batch) {
          setNoBatch(item.no_batch);
        }
        if (item.no_faktur) {
          setNoFaktur(item.no_faktur);
        }

        if (item.expire && item.expire !== "0000-00-00") {
          setExpired(item.expire.substring(0, 10));
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadItem();

    return () => {
      ignore = true;
    };
  }, [kodeBrng]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
  
    try {
        await axios.put(
          apiUrl(`/api/items/${kodeBrng}`),
          {
            nama_barang: namaBarang,
            barcode,
            supplier,
            satuan,
            golongan,
            jenis: kategori,
            stok: Number(stok || 0),
            harga_beli: Number(String(hargaBeli).replace(/\./g, "")),
            harga_umum: Number(String(hargaUmum).replace(/\./g, "")),
            harga_utama: Number(String(hargaUtama).replace(/\./g, "")),
            harga_beli_luar: Number(String(hargaApotek).replace(/\./g, "")),
            expired: expired ? `${expired}T00:00:00Z`: null,
            no_batch: noBatch || null,
            no_faktur: noFaktur || null,
            original_no_batch: urlNoBatch || null,
            original_no_faktur: urlNoFaktur || null,
          }
        );
      
        setMessage("✅ Barang berhasil diperbarui");
      
        setTimeout(() => {
          router.push("/inventory");
        }, 1500);
      
      } catch (err) {
      
        setMessage("❌ Gagal memperbarui barang");
      
        setTimeout(() => {
          setMessage("");
        }, 3000);
      
        console.error(err);
      }
  };

    const beli =
    Number(
        String(hargaBeli)
        .replace(/\./g, "") || 0
    );

    const apotek =
    Number(
        String(hargaApotek)
        .replace(/\./g, "") || 0
    );

    const umum =
    Number(
        String(hargaUmum)
        .replace(/\./g, "") || 0
    );

    const utama =
    Number(
        String(hargaUtama)
        .replace(/\./g, "") || 0
    );

    // BERDASARKAN HARGA BELI
    const marginUmumBeli =
        beli > 0
        ? (
            ((umum - beli) / beli) * 100
            ).toFixed(1)
        : "0";

    const marginUtamaBeli =
        beli > 0
        ? (
            ((utama - beli) / beli) * 100
            ).toFixed(1)
        : "0";

    const marginApotekBeli =
        beli > 0
        ? (
            ((apotek - beli) / beli) * 100
            ).toFixed(1)
        : "0";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {message && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white ${
            message.includes("berhasil")
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {message}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/inventory")}
          className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Barang</h1>
          <p className="text-sm text-muted-foreground mt-1">Perbarui informasi barang inventory</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle Obat/Non-Obat */}
          <div>
            <label className="block text-sm mb-3">Kategori Barang</label>
            <div className="inline-flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setIsObat(true)}
                className={`px-6 py-2.5 rounded-lg text-sm transition-all ${
                  isObat ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                }`}
              >
                Obat
              </button>
              <button
                type="button"
                onClick={() => setIsObat(false)}
                className={`px-6 py-2.5 rounded-lg text-sm transition-all ${
                  !isObat ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                }`}
              >
                Non-Obat
              </button>
            </div>
          </div>

          {/* Nama Barang */}
          <div>
            <label className="block text-sm mb-2">Nama Barang *</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Paracetamol 500mg"
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Barcode & Scanner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Barcode *</label>
              <div className="relative">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="8992761123456"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full py-3 px-6 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
              >
                Scan Barcode
              </button>
            </div>
          </div>

          {/* Golongan Obat (only for Obat) */}
          {isObat && (
            <div>
              <label className="block text-sm mb-2">Golongan Barang *</label>
                <select
                value={golongan}
                onChange={(e) => setGolongan(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                >
                <option value="">Pilih golongan</option>

                {masters.golongan.map((item) => (
                    <option
                    key={item.kode}
                    value={item.kode}
                    >
                    {item.nama}
                    </option>
                ))}
                </select>
            </div>
          )}

          {/* Jenis Barang */}
          <div>
            <label className="block text-sm mb-2">Jenis Barang *</label>
            <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
            >
            <option value="">Pilih jenis</option>

            {masters.jenis.map((item) => (
                <option
                key={item.kdjns}
                value={item.kdjns}
                >
                {item.nama}
                </option>
            ))}
            </select>
          </div>

          {/* Batch & Faktur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">No. Batch</label>
              <input
                type="text"
                value={noBatch}
                onChange={(e) => setNoBatch(e.target.value)}
                placeholder="No. batch"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">No. Faktur</label>
              <input
                type="text"
                value={noFaktur}
                onChange={(e) => setNoFaktur(e.target.value)}
                placeholder="No. faktur"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm mb-2">
              Supplier *
            </label>

            <select
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
            >

              <option value="">
                Pilih supplier
              </option>

              {masters.suppliers?.map((item)=>(
                <option
                  key={item.kode_industri}

                  value={item.kode_industri}
                >
                  {item.nama_industri}
                </option>
              ))}

            </select>
          </div>

          {/* Satuan & Stok */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Satuan *</label>
                <select
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                >
                <option value="">Pilih satuan</option>

                {masters.satuan.map((item) => (
                    <option
                    key={item.kode_sat}
                    value={item.kode_sat}
                    >
                    {item.satuan}
                    </option>
                ))}
                </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Stok Saat Ini *</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={stok}
                  onChange={(e) => setStok(formatStock(e.target.value))}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Harga Beli & Harga Jual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Harga Beli Supplier *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={hargaBeli}
                  onChange={(e) => {
                    const value = formatNumber(e.target.value);
                    const beli = Number(value.replace(/\./g, ""));

                    setHargaBeli(value);
                    setHargaUtama(formatNumber(Math.round(beli * 1.1).toString()));
                    setHargaApotek(formatNumber(Math.round(beli * 1.3).toString()));
                    setHargaUmum(formatNumber(Math.round(beli * 1.5).toString()));
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {/* Harga Jual Apotek */}
            <div>
              <label className="block text-sm mb-2">
                Harga Jual Apotek *
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Rp
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"

                  value={hargaApotek}

                  onChange={(e) =>
                    setHargaApotek(
                      formatNumber(e.target.value)
                    )
                  }

                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl"
                />
              </div>
            </div>
            {/* Harga Umum */}
            <div>
              <label className="block text-sm mb-2">
                Harga Jual Umum *
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Rp
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"

                  value={hargaUmum}

                  onChange={(e) =>
                    setHargaUmum(
                      formatNumber(e.target.value)
                    )
                  }

                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl"
                />
              </div>
            </div>

            {/* Harga BPJS / Utama */}
            <div>
              <label className="block text-sm mb-2">
                Harga Jual Utama (BPJS) *
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Rp
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"

                  value={hargaUtama}

                  onChange={(e) =>
                    setHargaUtama(
                      formatNumber(e.target.value)
                    )
                  }

                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Berdasarkan Harga Beli */}
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">

            <p className="font-semibold text-success mb-3">
              Margin dari Harga Beli
            </p>

            <p className="text-sm text-success">
              Umum:
              <span className="font-semibold">
                {" "}
                {marginUmumBeli}%
              </span>
            </p>

            <p className="text-sm text-success">
              Utama (BPJS):
              <span className="font-semibold">
                {" "}
                {marginUtamaBeli}%
              </span>
            </p>

            <p className="text-sm text-success">
              Apotek:
              <span className="font-semibold">
                {" "}
                {marginApotekBeli}%
              </span>
            </p>

          </div>

          {/* Tanggal Expired */}
          {isObat && (
            <div>
              <label className="block text-sm mb-2">Tanggal Expired *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  min="2000-01-01"
                  max="2100-12-31"
                  value={expired}
                  onChange={(e) => setExpired(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Format: mm/dd/yyyy (contoh: 31/12/2026)</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/inventory")}
              className="flex-1 py-3 px-6 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
