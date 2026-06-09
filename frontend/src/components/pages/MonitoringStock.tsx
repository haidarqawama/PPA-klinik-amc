'use client'

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Calendar, Package, Clock, Activity, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDate, isValidExpireDate } from '@/utils/dateFormat';
import { apiUrl } from '@/lib/api';

const MONITORING_REFRESH_MS = 30_000;
const LIST_PREVIEW_LIMIT = 7;

type MonitoringPeriod = "day" | "month" | "year" | "all";

const MONITORING_PERIODS: { value: MonitoringPeriod; label: string }[] = [
  { value: "day", label: "30 Hari" },
  { value: "month", label: "Bulanan" },
  { value: "year", label: "Tahunan" },
  { value: "all", label: "Semua" },
];

const TURNOVER_COLORS = ["#00B4D8", "#38A169", "#805AD5", "#DD6B20", "#E53E3E"];

interface MonitoringStockSummary {
  critical_stock_count: number;
  restock_needed_count: number;
  expiring_soon_count: number;
  expired_count: number;
}

interface MonitoringStockLowItem {
  kode_brng: string;
  nama_brng: string;
  stok: number;
  golongan: string;
  status: "critical" | "warning";
}

interface MonitoringStockExpiringItem {
  kode_brng: string;
  nama_brng: string;
  expire: string;
  days_left: number;
  batch: string;
  status: "expired" | "expiring_soon" | "normal";
}

interface MonitoringStockTurnover {
  kode_brng: string;
  nama_brng: string;
  barang_keluar: number;
  persediaan_awal: number;
  persediaan_akhir: number;
  rata_rata_persediaan: number;
  turnover_ratio: number;
}

interface MonitoringStockCoverage {
  kode_brng: string;
  nama_brng: string;
  stok_saat_ini: number;
  rata_rata_pemakaian_harian: number;
  coverage_days: number;
  status: "critical" | "warning" | "good";
}

interface MonitoringStockGolonganStat {
  golongan: string;
  total_stock: number;
}

interface MonitoringStockGolonganValue {
  golongan: string;
  item_count: number;
  total_stock: number;
  inventory_value: number;
}

interface MonitoringStockResponse {
  summary: MonitoringStockSummary;
  low_stock_items: MonitoringStockLowItem[];
  expiring_items: MonitoringStockExpiringItem[];
  turnover_items: MonitoringStockTurnover[];
  coverage_items: MonitoringStockCoverage[];
  golongan_stats: MonitoringStockGolonganStat[];
  golongan_values: MonitoringStockGolonganValue[];
  observation_days: number;
  observation_period: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

const MAX_REASONABLE_EXPIRE_DAYS = 365 * 30;

function formatExpireDays(daysLeft: number, isExpired: boolean): string {
  const absDays = Math.abs(daysLeft);
  if (absDays > MAX_REASONABLE_EXPIRE_DAYS) {
    return "Tanggal tidak valid";
  }
  if (isExpired) {
    return `${absDays} hari lalu`;
  }
  return `${daysLeft} hari lagi`;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)}K`;
  }
  return `Rp ${formatNumber(value)}`;
}

function getTurnoverStatus(ratio: number): { label: string; className: string } {
  if (ratio >= 0.5) return { label: "Cepat", className: "text-success" };
  if (ratio >= 0.3) return { label: "Normal", className: "text-primary" };
  return { label: "Lambat", className: "text-warning" };
}

function getCoverageDisplay(status: MonitoringStockCoverage["status"]) {
  switch (status) {
    case "critical":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        label: "Kritis - Segera Restock",
        color: "#E53E3E",
      };
    case "warning":
      return {
        bg: "bg-warning/10",
        text: "text-warning",
        label: "Perlu Restock Segera",
        color: "#DD6B20",
      };
    default:
      return {
        bg: "bg-success/10",
        text: "text-success",
        label: "Stok Aman",
        color: "#38A169",
      };
  }
}

export default function MonitoringStock() {
  const [period, setPeriod] = useState<MonitoringPeriod>("month");
  const [data, setData] = useState<MonitoringStockResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);
  const [showAllExpiring, setShowAllExpiring] = useState(false);

  const fetchMonitoring = useCallback(async (options?: { silent?: boolean; period?: MonitoringPeriod }) => {
    const selectedPeriod = options?.period ?? period;
    if (!options?.silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch(
        apiUrl(`/api/monitoring-stock?period=${selectedPeriod}`),
        { cache: "no-store" }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Gagal memuat data (${response.status})`);
      }

      const body = await response.json();
      setData(body.data as MonitoringStockResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMonitoring({ silent: true });
      }
    }, MONITORING_REFRESH_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMonitoring({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchMonitoring]);

  const handlePeriodChange = (nextPeriod: MonitoringPeriod) => {
    setPeriod(nextPeriod);
    fetchMonitoring({ period: nextPeriod });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Memuat data monitoring stok...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-medium mb-2">Gagal memuat monitoring stok</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchMonitoring()}
            className="rounded-xl bg-primary px-6 py-2.5 text-primary-foreground text-sm font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary ?? {
    critical_stock_count: 0,
    restock_needed_count: 0,
    expiring_soon_count: 0,
    expired_count: 0,
  };
  const lowStockItems = data?.low_stock_items ?? [];
  const expiringItems = data?.expiring_items ?? [];
  const visibleLowStockItems = showAllLowStock
    ? lowStockItems
    : lowStockItems.slice(0, LIST_PREVIEW_LIMIT);
  const visibleExpiringItems = showAllExpiring
    ? expiringItems
    : expiringItems.slice(0, LIST_PREVIEW_LIMIT);
  const turnoverItems = data?.turnover_items ?? [];
  const coverageItems = data?.coverage_items ?? [];
  const golonganStats = data?.golongan_stats ?? [];
  const golonganValues = data?.golongan_values ?? [];
  const observationPeriod = data?.observation_period ?? "30 hari terakhir";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Monitoring Stok Real-Time</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau kondisi stok dan status barang (stok dari gudang AP, sama seperti Data Barang)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {MONITORING_PERIODS.map((item) => (
              <button
                key={item.value}
                onClick={() => handlePeriodChange(item.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchMonitoring({ silent: true })}
            disabled={refreshing}
            className="p-2 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-destructive/80">Stok Kritis (&lt; 20)</p>
              <p className="text-2xl font-semibold text-destructive">{summary.critical_stock_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-warning/80">Perlu Restock (&lt; 50)</p>
              <p className="text-2xl font-semibold text-warning">{summary.restock_needed_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-primary/80">Mendekati Expired (1 bulan)</p>
              <p className="text-2xl font-semibold text-primary">{summary.expiring_soon_count}</p>
              {summary.expired_count > 0 && (
                <p className="text-xs text-destructive mt-0.5">{summary.expired_count} sudah expired</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold mb-1">Statistik per Golongan Obat</h3>
        <p className="text-sm text-muted-foreground mb-6">Total stok per golongan dari gudang AP</p>
        {golonganStats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data golongan</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={golonganStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="golongan" stroke="#718096" fontSize={12} />
              <YAxis stroke="#718096" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Bar dataKey="total_stock" fill="#00B4D8" radius={[8, 8, 0, 0]} name="Total Stok" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Inventory Turnover Ratio</h3>
            <p className="text-sm text-muted-foreground">
              Barang Keluar ÷ Rata-rata Persediaan ({observationPeriod})
            </p>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {turnoverItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data perputaran stok</p>
            ) : (
              turnoverItems.map((item, index) => {
                const turnoverStatus = getTurnoverStatus(item.turnover_ratio);
                const color = TURNOVER_COLORS[index % TURNOVER_COLORS.length];

                return (
                  <div key={item.kode_brng} className="p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Package className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.nama_brng}</p>
                          <p className="text-xs text-muted-foreground">
                            Keluar: {formatNumber(item.barang_keluar)} unit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-semibold ${turnoverStatus.className}`}>
                          {item.turnover_ratio.toFixed(2)}×
                        </p>
                        <p className="text-xs text-muted-foreground">{turnoverStatus.label}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-background">
                        <p className="text-muted-foreground">Persediaan Awal</p>
                        <p className="font-medium text-foreground">{formatNumber(item.persediaan_awal)} unit</p>
                      </div>
                      <div className="p-2 rounded-lg bg-background">
                        <p className="text-muted-foreground">Rata-rata Stok</p>
                        <p className="font-medium text-foreground">{formatNumber(item.rata_rata_persediaan)} unit</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(item.turnover_ratio * 100, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Coverage Stok</h3>
            <p className="text-sm text-muted-foreground">
              Estimasi ketahanan stok berdasarkan rata-rata pemakaian harian ({observationPeriod})
            </p>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {coverageItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada data coverage stok</p>
            ) : (
              coverageItems.map((item) => {
                const status = getCoverageDisplay(item.status);
                const coveragePercentage = item.rata_rata_pemakaian_harian > 0
                  ? Math.min((item.coverage_days / 30) * 100, 100)
                  : 100;

                return (
                  <div key={item.kode_brng} className="p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center`}>
                          <Activity className={`w-4 h-4 ${status.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.nama_brng}</p>
                          <p className="text-xs text-muted-foreground">
                            Rata-rata: {formatNumber(item.rata_rata_pemakaian_harian)} unit/hari
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-semibold ${status.text}`}>
                          {item.rata_rata_pemakaian_harian > 0
                            ? `${formatNumber(item.coverage_days)} hari`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{status.label}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Stok: {formatNumber(item.stok_saat_ini)} unit</span>
                        <span>{coveragePercentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${coveragePercentage}%`,
                            backgroundColor: status.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Barang Hampir Habis</h3>
          <p className="text-sm text-muted-foreground">Stok kritis (&lt; 20) dan perlu restock (&lt; 50)</p>
        </div>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Semua stok dalam kondisi aman</p>
        ) : (
          <>
            <div className="divide-y divide-border">
              {visibleLowStockItems.map((item) => {
                const displayStok = Math.max(0, item.stok);
                const percentage = Math.min((displayStok / 50) * 100, 100);
                const isCritical = item.status === "critical";

                return (
                  <div key={item.kode_brng} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCritical ? "bg-destructive/10" : "bg-warning/10"
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            isCritical ? "text-destructive" : "text-warning"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.nama_brng}</p>
                          <p className="text-sm text-muted-foreground">{item.golongan}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          isCritical ? "text-destructive" : "text-warning"
                        }`}>
                          {formatNumber(displayStok)} / 50
                        </p>
                        <p className="text-xs text-muted-foreground">unit</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical ? "bg-destructive" : "bg-warning"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {lowStockItems.length > LIST_PREVIEW_LIMIT && (
              <div className="p-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAllLowStock((prev) => !prev)}
                  className="w-full py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-primary font-medium"
                >
                  {showAllLowStock
                    ? "Tampilkan Lebih Sedikit"
                    : `Lihat Semua (${lowStockItems.length} barang)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Status Expired Barang</h3>
          <p className="text-sm text-muted-foreground">Barang expired dan mendekati expired (1 bulan)</p>
        </div>
        {expiringItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Tidak ada barang mendekati expired</p>
        ) : (
          <>
            <div className="divide-y divide-border">
              {visibleExpiringItems.map((item) => {
                const hasValidExpire = isValidExpireDate(item.expire);
                const isExpired = hasValidExpire && item.days_left < 0;

                return (
                  <div
                    key={`${item.kode_brng}-${item.expire}`}
                    className={`p-4 hover:bg-muted/20 transition-colors ${isExpired ? "bg-destructive/5" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isExpired
                            ? "bg-destructive/20"
                            : item.status === "expiring_soon"
                            ? "bg-destructive/10"
                            : "bg-warning/10"
                        }`}>
                          <Clock className={`w-5 h-5 ${
                            isExpired || item.status === "expiring_soon"
                              ? "text-destructive"
                              : "text-warning"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{item.nama_brng}</p>
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
                          isExpired || item.status === "expiring_soon"
                            ? "text-destructive"
                            : "text-warning"
                        }`}>
                          {hasValidExpire
                            ? formatExpireDays(item.days_left, isExpired)
                            : "Tanggal tidak valid"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.expire)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {expiringItems.length > LIST_PREVIEW_LIMIT && (
              <div className="p-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAllExpiring((prev) => !prev)}
                  className="w-full py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-primary font-medium"
                >
                  {showAllExpiring
                    ? "Tampilkan Lebih Sedikit"
                    : `Lihat Semua (${expiringItems.length} barang)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold mb-4">Nilai Inventory per Golongan</h3>
        {golonganValues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data nilai inventory</p>
        ) : (
          <div className="space-y-3">
            {golonganValues.map((stat) => (
              <div key={stat.golongan} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <p className="font-medium text-foreground">{stat.golongan}</p>
                  <p className="text-sm text-muted-foreground">
                    {stat.item_count} item · {formatNumber(stat.total_stock)} stok
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">
                    {formatCurrency(stat.inventory_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
