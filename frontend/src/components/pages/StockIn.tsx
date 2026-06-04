'use client'

import { useState } from "react";
import Link from "next/link";
import { Barcode, Package, TrendingUp, Calendar, DollarSign, Camera, Search } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';

const recentStockIn = [
  { id: 1, item: "Paracetamol 500mg", qty: 100, price: 500, date: "2026-05-13", supplier: "PT Kimia Farma" },
  { id: 2, item: "Amoxicillin 500mg", qty: 200, price: 1200, date: "2026-05-13", supplier: "PT Kalbe Farma" },
  { id: 3, item: "Vitamin C 1000mg", qty: 150, price: 800, date: "2026-05-12", supplier: "PT Tempo Scan" },
  { id: 4, item: "Betadine Solution", qty: 50, price: 15000, date: "2026-05-12", supplier: "PT Mahakam Beta" },
];

// Mock data barang - dalam implementasi real akan dari database
const mockItemData = {
  "8992761123456": {
    name: "Paracetamol 500mg",
    type: "Obat",
    currentStock: 500,
    units: ["Strip", "Box", "Tablet", "Suppositoria"],
    defaultUnit: "Strip",
    isObat: true
  },
  "8992761567890": {
    name: "Sarung Tangan Latex L",
    type: "Alat Sekali Pakai",
    currentStock: 1000,
    units: ["Box", "Pcs", "Pack"],
    defaultUnit: "Box",
    isObat: false
  }
};

export default function StockIn() {
  const [barcode, setBarcode] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Barang Masuk</h1>
        <p className="text-sm text-muted-foreground mt-1">Restock barang yang sudah ada di inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Form Barang Masuk</h3>
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
                    Stok saat ini: {selectedItem.currentStock} {selectedItem.defaultUnit}
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

              {/* Quantity Input with Unit */}
              <div>
                <label className="block text-sm mb-2">Jumlah Masuk ({selectedUnit}) *</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* New Purchase Price */}
              <div>
                <label className="block text-sm mb-2">Harga Beli Terbaru (per {selectedUnit}) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Expiry Date - Only for Obat */}
              {selectedItem.isObat && (
                <div>
                  <label className="block text-sm mb-2">Tanggal Expired *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      pattern="\d{2}/\d{2}/\d{4}"
                      className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      onInput={(e) => {
                        let value = e.currentTarget.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        if (value.length >= 5) {
                          value = value.slice(0, 5) + '/' + value.slice(5, 9);
                        }
                        e.currentTarget.value = value;
                      }}
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: dd/mm/yyyy (contoh: 31/12/2026) - Wajib diisi untuk barang obat
                  </p>
                </div>
              )}

              {/* Info for Non-Obat */}
              {!selectedItem.isObat && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    ℹ️ Tanggal expired tidak diperlukan untuk barang non-obat
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                className="w-full py-3 px-6 rounded-xl bg-success text-success-foreground shadow-lg shadow-success/20 hover:bg-success/90 transition-all"
              >
                Proses Barang Masuk
              </button>
            </div>
          )}
        </div>

        {/* Recent History */}
        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold">Riwayat Barang Masuk</h3>
            <p className="text-sm text-muted-foreground">Transaksi terbaru hari ini</p>
          </div>
          <div className="divide-y divide-border">
            {recentStockIn.map((item) => (
              <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mt-1">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.item}</p>
                      <p className="text-sm text-muted-foreground">{item.supplier}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                        <span className="text-xs text-success">+{item.qty} unit</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground">per unit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Link
              href="/stockinhistory"
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
