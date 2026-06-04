'use client'

import { useEffect, useState } from "react";
import { Package, Barcode, DollarSign, Calendar, Building2, Hash } from "lucide-react";

export default function AddItem() {
  const [isObat, setIsObat] = useState(true);
  const [hargaBeli, setHargaBeli] = useState("");
  const [hargaUmum, setHargaUmum] = useState("");
  const [hargaUtama, setHargaUtama] = useState("");
  const [hargaBeliLuar, setHargaBeliLuar] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const beli =
    Number(
      String(hargaBeli)
        .replace(/\./g, "") || 0
    );

  const beliLuar =
    Number(
      String(hargaBeliLuar)
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

  // BERDASARKAN HARGA BELI LUAR
  const marginUmumBeliLuar =
    beliLuar > 0
      ? (
          ((umum - beliLuar) / beliLuar) * 100
        ).toFixed(1)
      : "0";

  const marginUtamaBeliLuar =
    beliLuar > 0
      ? (
          ((utama - beliLuar) / beliLuar) * 100
        ).toFixed(1)
      : "0";

  const [formData, setFormData] = useState({
    nama_barang: "",
    barcode: "",
    golongan: "",
    jenis: "",
    supplier: "",
    satuan: "",
    stok: 0,
    harga_beli: 0,
    harga_umum: 0,
    harga_utama: 0,
    harga_beli_luar: 0,
    expired: ""
  });

  const [masters,setMasters]=
  useState({
    satuan:[],
    jenis:[],
    golongan:[],
    suppliers:[]
  })

  useEffect(() => {

    fetch(
      "http://localhost:8081/api/masters"
    )
      .then((r) => r.json())
  
      .then((data) => {
  
        setMasters({
          satuan: data.satuan || [],
          jenis: data.jenis || [],
          golongan: data.golongan || [],
          suppliers: data.suppliers || []
        });
  
      });
  
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nama_barang ||
      !formData.supplier ||
      !formData.satuan ||
      !formData.golongan ||
      !formData.jenis ||
      !formData.expired ||
      !hargaBeli ||
      !hargaUmum ||
      !hargaUtama ||
      !hargaBeliLuar ||
      Number(formData.stok) <= 0
    ) {
    
      setMessage(
        "Semua field wajib diisi"
      );
    
      return;
    }
  
    try {
      setLoading(true);
  
      const res = await fetch("http://localhost:8081/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_barang: formData.nama_barang,
          barcode: formData.barcode,
        
          supplier: formData.supplier,
        
          satuan: formData.satuan,
        
          golongan: formData.golongan,
        
          jenis: formData.jenis,
        
          stok: Number(formData.stok),
        
          harga_beli: Number(String(hargaBeli).replace(/\./g, "")),
        
          harga_umum: Number(String(hargaUmum).replace(/\./g,"")),

          harga_utama: Number(String(hargaUtama).replace(/\./g,"")),

          harga_beli_luar: Number(String(hargaBeliLuar).replace(/\./g,"")),
        
          expired: formData.expired
            ? `${formData.expired}T00:00:00Z`
            : null
        })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setMessage("✅ Barang berhasil ditambahkan");
        setTimeout(() => setMessage(""), 5000);
        setFormData({
          nama_barang: "",
          barcode: "",
          supplier: "",
          satuan: "",
          golongan: "",
          jenis: "",
          stok: 0,
          harga_beli: 0,
          harga_umum: 0,
          harga_utama: 0,
          harga_beli_luar: 0,
          expired: ""
        });
        
        setHargaBeli("");
        setHargaUmum("")
        setHargaUtama("")
        setHargaBeliLuar("")
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } else {
        setMessage(`❌ ${data.error || "Gagal tambah barang"}`);
        setTimeout(() => setMessage(""), 5000);
      }
  
    } catch {
      setMessage("❌ Tidak dapat terhubung ke server");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string) => {
    const number = value.replace(/[^\d]/g, "");
    if (!number) return "";
    return number.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "."
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tambah Barang Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">Tambahkan barang obat atau non-obat ke inventory</p>
        {message && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white ${
            message.includes("berhasil") ? "bg-green-500" : "bg-red-500"}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
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
                placeholder="Contoh: Paracetamol 500mg"
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.nama_barang}
                onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
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
                  placeholder="8992761123456"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
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
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                value={formData.golongan}
                onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
              >
                <option value="">Pilih golongan</option>

                {masters.golongan.map((item: any) => (
                  <option key={item.kode} value={item.kode}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Jenis Barang */}
          <div>
            <label className="block text-sm mb-2">Jenis Barang *</label>
            <select className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
              value={formData.jenis}
              onChange={(e)=>setFormData({...formData, jenis:e.target.value})}
            >
              <option value="">Pilih jenis</option>

              {masters.jenis.map((item: any) => (
                <option key={item.kdjns} value={item.kdjns}>
                  {item.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm mb-2">
              Supplier *
            </label>

            <select
              className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"

              value={formData.supplier}

              onChange={(e)=>
                setFormData({
                  ...formData,
                  supplier:e.target.value
                })
              }
            >

              <option value="">
                Pilih supplier
              </option>

              {masters.suppliers?.map((item:any)=>(
                <option
                  key={item.kode_industri}

                  value={item.kode_industri}
                >
                  {item.nama_industri}
                </option>
              ))}

            </select>
          </div>

          {/* Satuan & Stok Awal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Satuan *</label>
              <select className="w-full px-4 py-3 bg-input-background border border-border rounded-xl"
                value={formData.satuan}
                onChange={(e)=>setFormData({...formData, satuan:e.target.value})}
              >
                <option value="">Pilih satuan</option>

                {masters.satuan.map((item: any) => (
                  <option key={item.kode_sat} value={item.kode_sat}>
                    {item.satuan}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">Stok Awal *</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="0"
                  value={formData.stok || ""}
                  onChange={(e) => setFormData({...formData, stok: Number(e.target.value)})}
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
                  onChange={(e) => setHargaBeli(formatNumber(e.target.value))}
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            {/* Harga Beli Luar */}
            <div>
              <label className="block text-sm mb-2">
                Harga Beli Luar (Apotek)*
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  Rp
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"

                  value={hargaBeliLuar}

                  onChange={(e) =>
                    setHargaBeliLuar(
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

          {/* Margin Calculation */}
          <div className="grid grid-cols-2 gap-4">

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

          </div>

          {/* Berdasarkan Harga Beli Luar */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">

            <p className="font-semibold text-primary mb-3">
              Margin dari Harga Beli Luar
            </p>

            <p className="text-sm text-primary">
              Umum:
              <span className="font-semibold">
                {" "}
                {marginUmumBeliLuar}%
              </span>
            </p>

            <p className="text-sm text-primary">
            Utama (BPJS):
              <span className="font-semibold">
                {" "}
                {marginUtamaBeliLuar}%
              </span>
            </p>

          </div>

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
                  placeholder="dd/mm/yyyy"
                  pattern="\d{2}/\d{2}/\d{4}"
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.expired || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expired: e.target.value }))}
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Format: mm/dd/yyyy (contoh: 12/31/2026)</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              className="flex-1 py-3 px-6 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              onClick={() => {
                setFormData({
                  nama_barang: "", barcode: "", golongan: "", jenis: "",
                  supplier: "", satuan: "", stok: 0,
                  harga_beli: 0, harga_jual: 0, expired: ""
                });
              
                setHargaBeli("");
                setHargaUmum("");
                setHargaUtama("");
                setHargaBeliLuar("");
                setMessage("");
                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={
                !formData.nama_barang ||
                !formData.supplier ||
                !formData.satuan ||
                !formData.golongan ||
                !formData.jenis ||
                !formData.expired ||
                !hargaBeli ||
                !hargaUmum ||
                !hargaUtama ||
                !hargaBeliLuar ||
                Number(formData.stok) <= 0
              }
            >
              {loading ? "Menyimpan..." : "Tambah Barang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
