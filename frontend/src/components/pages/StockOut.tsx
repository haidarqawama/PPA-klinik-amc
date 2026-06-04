'use client'

import { useState } from "react";
import Link from "next/link";
import { Barcode, Package, TrendingDown, Camera, Search, AlertCircle } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';

const recentStockOut = [
  { id: 1, item: "Paracetamol 500mg", qty: 50, price: 1500, date: "2026-05-13", customer: "Pasien Umum" },
  { id: 2, item: "Amoxicillin 500mg", qty: 30, price: 3000, date: "2026-05-13", customer: "Rawat Inap" },
  { id: 3, item: "Vitamin C 1000mg", qty: 20, price: 2000, date: "2026-05-12", customer: "Pasien Umum" },
  { id: 4, item: "Betadine Solution", qty: 10, price: 28000, date: "2026-05-12", customer: "IGD" },
];

// Mock data barang - dalam implementasi real akan dari database
const mockItemData = {
  "8992761123456": {
    name: "Paracetamol 500mg",
    type: "Obat",
    currentStock: 500,
    units: ["Strip", "Box", "Tablet", "Suppositoria"],
    defaultUnit: "Strip",
    sellPrice: 1500,
    isObat: true
  },
  "8992761567890": {
    name: "Sarung Tangan Latex L",
    type: "Alat Sekali Pakai",
    currentStock: 1000,
    units: ["Box", "Pcs", "Pack"],
    defaultUnit: "Box",
    sellPrice: 3500,
    isObat: false
  }
};

export default function StockOut() {
  const [barcode, setBarcode] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [stockError, setStockError] = useState(false);

  const handleSearch = (value: string) => {
    setBarcode(value);
    // Simulasi pencarian barang
    if (value.length >= 5) {
      // Cek apakah barcode ada di mock data
      const item = mockItemData[value as keyof typeof mockItemData];
      if (item) {
        setSelectedItem(item);
        setSelectedUnit(item.defaultUnit);
      } else {
        // Default ke obat untuk demo
        setSelectedItem(mockItemData["8992761123456"]);
        setSelectedUnit(mockItemData["8992761123456"].defaultUnit);
      }
    } else {
      setSelectedItem(null);
      setSelectedUnit("");
    }
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    const currentStock = selectedItem?.currentStock || 0;
    setStockError(value > currentStock);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Barang Keluar</h1>
        <p className="text-sm text-muted-foreground mt-1">Catat pengeluaran barang dari inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Form Barang Keluar</h3>
              <p className="text-sm text-muted-foreground">Scan atau input manual</p>
            </div>
          </div>

          {/* Barcode Scanner */}
          <div>
            <label className="block text-sm mb-2">Scan Barcode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Barcode className="w-5 h-5" />
                Scan Barcode
              </button>
              <button
                type="button"
                className="py-3 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Scan OCR
              </button>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <label className="block text-sm mb-2">Atau Input Manual</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama barang atau ketik barcode..."
                value={barcode}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Item Details (shown after scan/search) */}
          {selectedItem && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{selectedItem.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedItem.isObat
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {selectedItem.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Stok tersedia: {selectedItem.currentStock} {selectedItem.defaultUnit}
                  </p>
                  <p className="text-sm text-success mt-1">
                    Harga Jual: Rp {selectedItem.sellPrice.toLocaleString('id-ID')} / {selectedItem.defaultUnit}
                  </p>
                </div>
              </div>

              {/* Unit Selection */}
              <div>
                <label className="block text-sm mb-2">Satuan *</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {selectedItem.units.map((unit: string) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm mb-2">Jumlah Keluar ({selectedUnit}) *</label>
                <input
                  type="number"
                  placeholder="0"
                  value={quantity || ""}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className={`w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 ${
                    stockError
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-primary"
                  }`}
                />
              </div>

              {/* Stock Error */}
              {stockError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Stok Tidak Mencukupi</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      Jumlah yang diminta melebihi stok tersedia ({selectedItem.currentStock} {selectedItem.defaultUnit})
                    </p>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              {quantity > 0 && !stockError && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Nilai</span>
                    <span className="text-lg font-semibold text-primary">
                      Rp {(quantity * selectedItem.sellPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer/Department */}
              <div>
                <label className="block text-sm mb-2">Tujuan Penggunaan *</label>
                <select className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Pilih tujuan</option>
                  <option value="pasien-umum">Pasien Umum</option>
                  <option value="rawat-inap">Rawat Inap</option>
                  <option value="igd">IGD</option>
                  <option value="poli">Poli</option>
                  <option value="operasi">Ruang Operasi</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={stockError || quantity === 0}
                className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proses Barang Keluar
              </button>
            </div>
          )}
        </div>

        {/* Recent History */}
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold">Riwayat Barang Keluar</h3>
            <p className="text-sm text-muted-foreground">Transaksi terbaru hari ini</p>
          </div>
          <div className="divide-y divide-border">
            {recentStockOut.map((item) => (
              <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                      <TrendingDown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.item}</p>
                      <p className="text-sm text-muted-foreground">{item.customer}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                        <span className="text-xs text-primary">-{item.qty} unit</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Link
              href="/stockouthistory"
              className="block w-full py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-center"
            >
              Lihat Semua Riwayat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
