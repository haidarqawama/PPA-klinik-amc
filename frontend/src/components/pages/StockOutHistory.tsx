'use client'

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, Calendar, Search, User, Package } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';

const stockOutHistory = [
  {
    id: 1,
    date: "2026-05-13",
    time: "15:45",
    item: "Paracetamol 500mg",
    barcode: "8992761123456",
    qty: 50,
    unit: "Strip",
    sellPrice: 1500,
    totalRevenue: 75000,
    destination: "Pasien Umum",
    operator: "Ns. Budi Santoso",
    notes: "Resep dr. Ahmad"
  },
  {
    id: 2,
    date: "2026-05-13",
    time: "14:20",
    item: "Amoxicillin 500mg",
    barcode: "8992761234567",
    qty: 30,
    unit: "Strip",
    sellPrice: 3000,
    totalRevenue: 90000,
    destination: "Rawat Inap - Ruang 201",
    operator: "dr. Siti Aminah",
    notes: "Pasien infeksi saluran napas"
  },
  {
    id: 3,
    date: "2026-05-13",
    time: "13:10",
    item: "Sarung Tangan Latex L",
    barcode: "8992761567890",
    qty: 100,
    unit: "Box",
    sellPrice: 3500,
    totalRevenue: 350000,
    destination: "IGD",
    operator: "Fitri Handayani, S.Farm",
    notes: "Kebutuhan operasional IGD"
  },
  {
    id: 4,
    date: "2026-05-13",
    time: "11:30",
    item: "Betadine Solution 60ml",
    barcode: "8992761456789",
    qty: 10,
    unit: "Botol",
    sellPrice: 28000,
    totalRevenue: 280000,
    destination: "Ruang Operasi",
    operator: "Ns. Budi Santoso",
    notes: "Persiapan operasi"
  },
  {
    id: 5,
    date: "2026-05-12",
    time: "16:50",
    item: "Vitamin C 1000mg",
    barcode: "8992761678901",
    qty: 20,
    unit: "Strip",
    sellPrice: 2000,
    totalRevenue: 40000,
    destination: "Poli Umum",
    operator: "dr. Siti Aminah",
    notes: "Pasien daya tahan tubuh lemah"
  },
  {
    id: 6,
    date: "2026-05-12",
    time: "15:15",
    item: "Masker Medis 3 Ply",
    barcode: "8992761901234",
    qty: 200,
    unit: "Box",
    sellPrice: 1500,
    totalRevenue: 300000,
    destination: "Seluruh Ruangan",
    operator: "Fitri Handayani, S.Farm",
    notes: "Distribusi bulanan"
  },
  {
    id: 7,
    date: "2026-05-12",
    time: "10:20",
    item: "Tramadol 50mg",
    barcode: "8992761345678",
    qty: 5,
    unit: "Strip",
    sellPrice: 8000,
    totalRevenue: 40000,
    destination: "Rawat Inap - Ruang 305",
    operator: "dr. Siti Aminah",
    notes: "Psiko/Narko - Resep khusus, dicatat di buku"
  },
  {
    id: 8,
    date: "2026-05-11",
    time: "14:30",
    item: "Omeprazole 20mg",
    barcode: "8992761012345",
    qty: 15,
    unit: "Strip",
    sellPrice: 3500,
    totalRevenue: 52500,
    destination: "Poli Gastro",
    operator: "Ns. Budi Santoso",
    notes: "Pasien maag kronis"
  },
  {
    id: 9,
    date: "2026-05-11",
    time: "09:45",
    item: "Infus Set",
    barcode: "8992761123789",
    qty: 25,
    unit: "Set",
    sellPrice: 5000,
    totalRevenue: 125000,
    destination: "IGD",
    operator: "Fitri Handayani, S.Farm",
    notes: ""
  },
];

export default function StockOutHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredData = stockOutHistory.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.barcode.includes(searchQuery) ||
                         item.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || item.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  const totalQty = filteredData.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/stock-out"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Riwayat Barang Keluar</h1>
          <p className="text-sm text-muted-foreground mt-1">Semua transaksi barang keluar lengkap dengan petugas</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-semibold text-foreground">{filteredData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Unit Keluar</p>
              <p className="text-xl font-semibold text-foreground">{totalQty.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Penjualan</p>
              <p className="text-xl font-semibold text-success">
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
            <label className="block text-sm mb-2">Cari Barang / Petugas / Tujuan</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nama barang, barcode, petugas, atau tujuan..."
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
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Harga Jual</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Tujuan</th>
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
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.item}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-primary">-{item.qty} {item.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    Rp {item.sellPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success">
                    Rp {item.totalRevenue.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{item.destination}</p>
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
            Menampilkan {filteredData.length} dari {stockOutHistory.length} transaksi
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
