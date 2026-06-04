'use client'

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Search, User, Package } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';

const stockInHistory = [
  {
    id: 1,
    date: "2026-05-13",
    time: "14:30",
    item: "Paracetamol 500mg",
    barcode: "8992761123456",
    qty: 100,
    unit: "Strip",
    buyPrice: 500,
    totalCost: 50000,
    expired: "2027-12-31",
    supplier: "PT Kimia Farma",
    operator: "dr. Siti Aminah",
    notes: "Restock rutin"
  },
  {
    id: 2,
    date: "2026-05-13",
    time: "13:15",
    item: "Amoxicillin 500mg",
    barcode: "8992761234567",
    qty: 200,
    unit: "Strip",
    buyPrice: 1200,
    totalCost: 240000,
    expired: "2027-08-15",
    supplier: "PT Kalbe Farma",
    operator: "Ns. Budi Santoso",
    notes: "Stok menipis"
  },
  {
    id: 3,
    date: "2026-05-13",
    time: "10:45",
    item: "Sarung Tangan Latex L",
    barcode: "8992761567890",
    qty: 500,
    unit: "Box",
    buyPrice: 1500,
    totalCost: 750000,
    expired: "-",
    supplier: "PT Medika Supplies",
    operator: "Fitri Handayani, S.Farm",
    notes: "Pembelian bulk"
  },
  {
    id: 4,
    date: "2026-05-12",
    time: "16:20",
    item: "Vitamin C 1000mg",
    barcode: "8992761678901",
    qty: 150,
    unit: "Strip",
    buyPrice: 800,
    totalCost: 120000,
    expired: "2027-06-30",
    supplier: "PT Tempo Scan Pacific",
    operator: "dr. Siti Aminah",
    notes: ""
  },
  {
    id: 5,
    date: "2026-05-12",
    time: "11:30",
    item: "Betadine Solution 60ml",
    barcode: "8992761456789",
    qty: 50,
    unit: "Botol",
    buyPrice: 15000,
    totalCost: 750000,
    expired: "2027-10-10",
    supplier: "PT Mahakam Beta Farma",
    operator: "Ns. Budi Santoso",
    notes: "Urgent restock"
  },
  {
    id: 6,
    date: "2026-05-11",
    time: "15:10",
    item: "Tramadol 50mg",
    barcode: "8992761345678",
    qty: 30,
    unit: "Strip",
    buyPrice: 3000,
    totalCost: 90000,
    expired: "2027-03-20",
    supplier: "PT Sanbe Farma",
    operator: "Fitri Handayani, S.Farm",
    notes: "Psiko/Narko - Dicatat di buku khusus"
  },
  {
    id: 7,
    date: "2026-05-11",
    time: "09:20",
    item: "Masker Medis 3 Ply",
    barcode: "8992761901234",
    qty: 1000,
    unit: "Box",
    buyPrice: 800,
    totalCost: 800000,
    expired: "-",
    supplier: "PT Sensi Indonesia",
    operator: "Ns. Budi Santoso",
    notes: ""
  },
  {
    id: 8,
    date: "2026-05-10",
    time: "14:45",
    item: "Omeprazole 20mg",
    barcode: "8992761012345",
    qty: 80,
    unit: "Strip",
    buyPrice: 1500,
    totalCost: 120000,
    expired: "2027-09-15",
    supplier: "PT Dexa Medica",
    operator: "dr. Siti Aminah",
    notes: ""
  },
];

export default function StockInHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredData = stockInHistory.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.barcode.includes(searchQuery) ||
                         item.operator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || item.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  const totalQty = filteredData.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = filteredData.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/stock-in"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Riwayat Barang Masuk</h1>
          <p className="text-sm text-muted-foreground mt-1">Semua transaksi barang masuk lengkap dengan petugas</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-semibold text-foreground">{filteredData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Unit Masuk</p>
              <p className="text-xl font-semibold text-foreground">{totalQty.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Pembelian</p>
              <p className="text-xl font-semibold text-foreground">
                Rp {(totalValue / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Cari Barang / Petugas</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nama barang, barcode, atau nama petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Filter Tanggal</label>
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
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Waktu</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Barang</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Harga Beli</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Expired</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Petugas</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(item.date)}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.item}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-success">+{item.qty} {item.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    Rp {item.buyPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    Rp {item.totalCost.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(item.expired)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{item.supplier}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-foreground">{item.operator}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground">{item.notes || "-"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredData.length} dari {stockInHistory.length} transaksi
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              Sebelumnya
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              1
            </button>
            <button className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              2
            </button>
            <button className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              3
            </button>
            <button className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
