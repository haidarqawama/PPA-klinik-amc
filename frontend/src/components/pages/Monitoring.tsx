'use client'

import { AlertTriangle, Calendar, TrendingUp, Package, Clock, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatDate } from '@/utils/dateFormat';

const lowStockItems = [
  { name: "Paracetamol 500mg", stock: 20, min: 50, category: "Obat Bebas", status: "critical" },
  { name: "Amoxicillin 500mg", stock: 35, min: 100, category: "Obat Keras", status: "warning" },
  { name: "Sarung Tangan Latex", stock: 45, min: 200, category: "Alat Sekali Pakai", status: "warning" },
  { name: "Betadine Solution", stock: 15, min: 50, category: "Non-obat", status: "critical" },
  { name: "Vitamin C 1000mg", stock: 40, min: 100, category: "Obat Bebas", status: "warning" },
];

const expiringItems = [
  { name: "Omeprazole 20mg", expired: "2026-05-10", daysLeft: -8, batch: "B2023-012", status: "expired" },
  { name: "Insulin", expired: "2026-05-15", daysLeft: -3, batch: "A2023-089", status: "expired" },
  { name: "Vitamin B Complex", expired: "2026-05-30", daysLeft: 17, batch: "B2024-004", status: "warning" },
  { name: "Paracetamol 500mg", expired: "2026-06-15", daysLeft: 33, batch: "B2024-001", status: "normal" },
  { name: "Betadine Solution", expired: "2026-06-30", daysLeft: 48, batch: "B2024-003", status: "normal" },
  { name: "Amoxicillin 500mg", expired: "2026-07-20", daysLeft: 68, batch: "B2024-002", status: "normal" },
];

const stockCoverage = [
  { name: "Paracetamol 500mg", currentStock: 500, avgUsagePerDay: 25, coverageDays: 20, status: "good" },
  { name: "Amoxicillin 500mg", currentStock: 250, avgUsagePerDay: 30, coverageDays: 8, status: "warning" },
  { name: "Vitamin C 1000mg", currentStock: 350, avgUsagePerDay: 15, coverageDays: 23, status: "good" },
  { name: "Betadine Solution", currentStock: 180, avgUsagePerDay: 20, coverageDays: 9, status: "warning" },
  { name: "Sarung Tangan Latex", currentStock: 1000, avgUsagePerDay: 50, coverageDays: 20, status: "good" },
  { name: "Tramadol 50mg", currentStock: 50, avgUsagePerDay: 15, coverageDays: 3, status: "critical" },
];

// Inventory Turnover Data
// Rumus: Inventory Turnover = HPP (Harga Pokok Penjualan) / Rata-rata Persediaan
// HPP = Harga Beli × Jumlah Terjual
// Rata-rata Persediaan = (Persediaan Awal + Persediaan Akhir) / 2 × Harga Beli
const inventoryTurnoverData = [
  {
    name: "Paracetamol",
    soldQty: 300,
    buyPrice: 500,
    startStock: 800,
    endStock: 500,
    hpp: 300 * 500, // 150,000
    avgInventory: ((800 + 500) / 2) * 500, // 325,000
    turnover: (300 * 500) / (((800 + 500) / 2) * 500), // 0.46 kali/bulan
    color: "#00B4D8"
  },
  {
    name: "Amoxicillin",
    soldQty: 200,
    buyPrice: 1200,
    startStock: 450,
    endStock: 250,
    hpp: 200 * 1200, // 240,000
    avgInventory: ((450 + 250) / 2) * 1200, // 420,000
    turnover: (200 * 1200) / (((450 + 250) / 2) * 1200), // 0.57 kali/bulan
    color: "#38A169"
  },
  {
    name: "Vitamin C",
    soldQty: 150,
    buyPrice: 800,
    startStock: 500,
    endStock: 350,
    hpp: 150 * 800, // 120,000
    avgInventory: ((500 + 350) / 2) * 800, // 340,000
    turnover: (150 * 800) / (((500 + 350) / 2) * 800), // 0.35 kali/bulan
    color: "#805AD5"
  },
  {
    name: "Betadine",
    soldQty: 100,
    buyPrice: 15000,
    startStock: 280,
    endStock: 180,
    hpp: 100 * 15000, // 1,500,000
    avgInventory: ((280 + 180) / 2) * 15000, // 3,450,000
    turnover: (100 * 15000) / (((280 + 180) / 2) * 15000), // 0.43 kali/bulan
    color: "#DD6B20"
  },
  {
    name: "Sarung Tangan",
    soldQty: 400,
    buyPrice: 1500,
    startStock: 1400,
    endStock: 1000,
    hpp: 400 * 1500, // 600,000
    avgInventory: ((1400 + 1000) / 2) * 1500, // 1,800,000
    turnover: (400 * 1500) / (((1400 + 1000) / 2) * 1500), // 0.33 kali/bulan
    color: "#E53E3E"
  },
];

const categoryStats = [
  { category: "Obat Bebas", qty: 450, value: 125000000 },
  { category: "Obat Keras", qty: 320, value: 280000000 },
  { category: "Psiko Narko", qty: 120, value: 95000000 },
  { category: "Alat Kesehatan", qty: 280, value: 450000000 },
  { category: "Non-obat", qty: 200, value: 85000000 },
];

export default function Monitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Monitoring Stok Real-Time</h1>
        <p className="text-sm text-muted-foreground mt-1">Pantau kondisi stok dan status barang secara real-time</p>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-destructive/80">Stok Kritis</p>
              <p className="text-2xl font-semibold text-destructive">12</p>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-warning/80">Perlu Restock</p>
              <p className="text-2xl font-semibold text-warning">23</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-primary/80">Mendekati Expired</p>
              <p className="text-2xl font-semibold text-primary">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Stats Chart */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold mb-6">Statistik per Golongan Obat</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="category" stroke="#718096" fontSize={12} />
            <YAxis stroke="#718096" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "12px"
              }}
            />
            <Bar dataKey="qty" fill="#00B4D8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Turnover & Coverage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Turnover */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Inventory Turnover Ratio</h3>
            <p className="text-sm text-muted-foreground">Rasio perputaran inventory per bulan</p>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {inventoryTurnoverData.map((item, index) => {
              const turnoverRate = item.turnover;
              const status = turnoverRate >= 0.5 ? "good" : turnoverRate >= 0.3 ? "normal" : "slow";

              return (
                <div key={index} className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Package className="w-4 h-4" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Terjual: {item.soldQty} unit
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-semibold ${
                        status === "good" ? "text-success" :
                        status === "normal" ? "text-primary" :
                        "text-warning"
                      }`}>
                        {turnoverRate.toFixed(2)}×
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status === "good" ? "Cepat" :
                         status === "normal" ? "Normal" :
                         "Lambat"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-muted-foreground">HPP</p>
                      <p className="font-medium text-foreground">
                        Rp {(item.hpp / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-muted-foreground">Rata-rata Stok</p>
                      <p className="font-medium text-foreground">
                        Rp {(item.avgInventory / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(turnoverRate * 100, 100)}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">Inventory Turnover Formula</p>
                <p className="text-xs text-primary/80 mt-1">
                  HPP ÷ Rata-rata Persediaan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Coverage */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Coverage Stok</h3>
            <p className="text-sm text-muted-foreground">Estimasi berapa lama stok dapat bertahan berdasarkan rata-rata penggunaan</p>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {stockCoverage.map((item, index) => {
            const getCoverageStatus = () => {
              if (item.status === "critical") return {
                bg: "bg-destructive/10",
                text: "text-destructive",
                label: "Kritis - Segera Restock",
                color: "#E53E3E"
              };
              if (item.status === "warning") return {
                bg: "bg-warning/10",
                text: "text-warning",
                label: "Perlu Restock Segera",
                color: "#DD6B20"
              };
              return {
                bg: "bg-success/10",
                text: "text-success",
                label: "Stok Aman",
                color: "#38A169"
              };
            };

            const status = getCoverageStatus();
            const coveragePercentage = Math.min((item.coverageDays / 30) * 100, 100);

              return (
                <div key={index} className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                        <Activity className={`w-4 h-4 ${status.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Rata-rata: {item.avgUsagePerDay} unit/hari
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-semibold ${status.text}`}>
                        {item.coverageDays} hari
                      </p>
                      <p className="text-xs text-muted-foreground">{status.label}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Stok: {item.currentStock} unit</span>
                      <span>{coveragePercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${coveragePercentage}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">Coverage Stock Formula</p>
                <p className="text-xs text-primary/80 mt-1">
                  Stok Saat Ini ÷ Rata-rata Penggunaan Per Hari
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Barang Hampir Habis</h3>
          <p className="text-sm text-muted-foreground">Memerlukan perhatian dan restock segera</p>
        </div>
        <div className="divide-y divide-border">
          {lowStockItems.map((item, index) => {
            const percentage = (item.stock / item.min) * 100;
            return (
              <div key={index} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.status === "critical" ? "bg-destructive/10" : "bg-warning/10"
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        item.status === "critical" ? "text-destructive" : "text-warning"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      item.status === "critical" ? "text-destructive" : "text-warning"
                    }`}>
                      {item.stock} / {item.min}
                    </p>
                    <p className="text-xs text-muted-foreground">unit</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.status === "critical" ? "bg-destructive" : "bg-warning"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expiring Items */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Status Expired Barang</h3>
          <p className="text-sm text-muted-foreground">Barang expired dan mendekati expired</p>
        </div>
        <div className="divide-y divide-border">
          {expiringItems.map((item, index) => {
            const isExpired = item.daysLeft < 0;
            return (
              <div key={index} className={`p-4 hover:bg-muted/20 transition-colors ${
                isExpired ? "bg-destructive/5" : ""
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isExpired
                        ? "bg-destructive/20"
                        : item.daysLeft < 30
                        ? "bg-destructive/10"
                        : "bg-warning/10"
                    }`}>
                      <Clock className={`w-5 h-5 ${
                        isExpired
                          ? "text-destructive"
                          : item.daysLeft < 30
                          ? "text-destructive"
                          : "text-warning"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-semibold">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Batch: {item.batch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      isExpired
                        ? "text-destructive"
                        : item.daysLeft < 30
                        ? "text-destructive"
                        : "text-warning"
                    }`}>
                      {isExpired ? `${Math.abs(item.daysLeft)} hari lalu` : `${item.daysLeft} hari lagi`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.expired)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Value Summary */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4">Nilai Inventory per Golongan</h3>
        <div className="space-y-3">
          {categoryStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div>
                <p className="font-medium text-foreground">{stat.category}</p>
                <p className="text-sm text-muted-foreground">{stat.qty} items</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  Rp {(stat.value / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
