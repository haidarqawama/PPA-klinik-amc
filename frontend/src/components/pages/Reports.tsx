'use client'

import { useState } from "react";
import { FileText, Download, Calendar, Filter, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';

const reportTypes = [
  { id: "stock-in", name: "Laporan Barang Masuk", icon: TrendingUp, color: "text-success" },
  { id: "stock-out", name: "Laporan Barang Keluar", icon: TrendingDown, color: "text-primary" },
  { id: "current-stock", name: "Laporan Stok Saat Ini", icon: FileText, color: "text-foreground" },
  { id: "expired", name: "Laporan Barang Expired", icon: Calendar, color: "text-destructive" },
  { id: "profit", name: "Laporan Keuntungan", icon: DollarSign, color: "text-success" },
];

const sampleData = [
  { date: "2026-05-13", item: "Paracetamol 500mg", qty: 100, buy: 500, sell: 1500, profit: 100000 },
  { date: "2026-05-13", item: "Amoxicillin 500mg", qty: 50, buy: 1200, sell: 3000, profit: 90000 },
  { date: "2026-05-12", item: "Vitamin C 1000mg", qty: 75, buy: 800, sell: 2000, profit: 90000 },
  { date: "2026-05-12", item: "Betadine Solution", qty: 30, buy: 15000, sell: 28000, profit: 390000 },
  { date: "2026-05-11", item: "Sarung Tangan Latex", qty: 200, buy: 1500, sell: 3500, profit: 400000 },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("profit");
  const [startDate, setStartDate] = useState("01/05/2026");
  const [endDate, setEndDate] = useState("13/05/2026");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const totalQty = sampleData.reduce((sum, item) => sum + item.qty, 0);
  const totalRevenue = sampleData.reduce((sum, item) => sum + (item.sell * item.qty), 0);
  const totalCost = sampleData.reduce((sum, item) => sum + (item.buy * item.qty), 0);
  const totalProfit = sampleData.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Laporan & Export Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate dan export laporan inventory dalam berbagai format</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 rounded-2xl border transition-all ${
              selectedReport === report.id
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedReport === report.id
                  ? "bg-white/20"
                  : "bg-muted"
              }`}>
                <report.icon className={`w-6 h-6 ${
                  selectedReport === report.id ? "text-primary-foreground" : report.color
                }`} />
              </div>
              <div className="text-left">
                <p className={`font-medium ${
                  selectedReport === report.id ? "text-primary-foreground" : "text-foreground"
                }`}>
                  {report.name}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Filter Laporan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm mb-2">Tanggal Mulai</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                pattern="\d{2}/\d{2}/\d{4}"
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                onInput={(e) => {
                  let value = e.currentTarget.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  e.currentTarget.value = value;
                  setStartDate(value);
                }}
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Tanggal Akhir</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                pattern="\d{2}/\d{2}/\d{4}"
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                onInput={(e) => {
                  let value = e.currentTarget.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2);
                  }
                  if (value.length >= 5) {
                    value = value.slice(0, 5) + '/' + value.slice(5, 9);
                  }
                  e.currentTarget.value = value;
                  setEndDate(value);
                }}
                maxLength={10}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm mb-2">Golongan Obat</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">Semua Golongan</option>
              <option value="bebas">Obat Bebas</option>
              <option value="terbatas">Obat Bebas Terbatas</option>
              <option value="keras">Obat Keras</option>
              <option value="psiko">Psiko Narko</option>
            </select>
          </div>

          {/* Item Type Filter */}
          <div>
            <label className="block text-sm mb-2">Jenis Barang</label>
            <select className="w-full px-4 py-2.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="all">Semua Jenis</option>
              <option value="obat">Obat</option>
              <option value="non-obat">Non-obat</option>
              <option value="alkes">Alat Kesehatan</option>
              <option value="alat-pakai">Alat Sekali Pakai</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Laporan
          </button>
          <button className="py-3 px-6 rounded-xl bg-success text-success-foreground shadow-lg shadow-success/20 hover:bg-success/90 transition-all flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Total Transaksi</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{totalQty}</p>
          <p className="text-xs text-muted-foreground mt-1">unit</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Total Nilai Beli</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            Rp {(totalCost / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">harga modal</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="text-sm text-muted-foreground">Total Nilai Jual</p>
          <p className="text-2xl font-semibold text-primary mt-1">
            Rp {(totalRevenue / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-success mt-1">+{((totalRevenue / totalCost - 1) * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-success/10 border border-success/20 rounded-2xl p-6">
          <p className="text-sm text-success/80">Total Keuntungan</p>
          <p className="text-2xl font-semibold text-success mt-1">
            Rp {(totalProfit / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-success mt-1">margin {((totalProfit / totalCost) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Preview Laporan</h3>
          <p className="text-sm text-muted-foreground">
            {reportTypes.find(r => r.id === selectedReport)?.name} - Periode {formatDate(startDate)} s/d {formatDate(endDate)}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Nama Barang</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Qty</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Harga Beli</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Harga Jual</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Keuntungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sampleData.map((item, index) => (
                <tr key={index} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formatDate(item.date)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{item.item}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{item.qty}</td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    Rp {item.buy.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    Rp {item.sell.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-success">
                    Rp {item.profit.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30 border-t-2 border-border">
              <tr>
                <td className="px-6 py-4 text-sm font-semibold text-foreground" colSpan={2}>Total</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground">{totalQty}</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground" colSpan={2}>
                  Revenue: Rp {totalRevenue.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-success">
                  Rp {totalProfit.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
