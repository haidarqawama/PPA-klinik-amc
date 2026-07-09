'use client'

import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Banknote,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Legend as RechartsLegend
} from "recharts";
import { apiUrl } from "@/lib/api";
import type {
  DashboardSummary,
  DashboardDistribution,
  DashboardStockMovement,
  DashboardRecentActivity,
  DashboardPaginationMeta,
  DashboardResponse
} from "@/types/dashboard";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expiredCount, setExpiredCount] = useState<number | null>(null);
  const [distribution, setDistribution] = useState<DashboardDistribution[]>([]);
  const [stockMovement, setStockMovement] = useState<DashboardStockMovement[]>([]);
  const [recentActivities, setRecentActivities] = useState<DashboardRecentActivity[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [golonganPage, setGolonganPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [pagination, setPagination] = useState<DashboardPaginationMeta | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          golongan_page: String(golonganPage),
          golongan_limit: String(itemsPerPage),
          activities_page: String(activitiesPage),
          activities_limit: String(itemsPerPage),
        });
        const response = await fetch(apiUrl(`/api/dashboard?${params.toString()}`));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body = await response.json();
        const data = body.data as DashboardResponse;
        setSummary(data.summary);
        setDistribution(data.golongan_distribution || []);
        setStockMovement(data.stock_movement || []);
        setRecentActivities(data.recent_activities || []);
        setPagination(data.pagination || null);
        setExpiredCount(
          data.summary.expired_count ?? data.expired_items?.length ?? null
        );
        setDashboardError(null);
      } catch (error) {
        setSummary(null);
        setDistribution([]);
        setStockMovement([]);
        setRecentActivities([]);
        setPagination(null);
        setExpiredCount(null);
        setDashboardError("Gagal memuat dashboard dari server");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [golonganPage, activitiesPage]);

  const categoryData = distribution.length
    ? distribution.map((item, index) => ({
        name: item.label,
        value: Number(item.total_stock),
        color: ["#00B4D8", "#38A169", "#DD6B20", "#805AD5", "#F6AD55", "#4A5568"][index % 6]
      }))
    : [];

  const stockChartData = stockMovement.length
    ? stockMovement.map((item) => ({
        month: new Intl.DateTimeFormat("id-ID", {
          month: "short",
          year: "numeric"
        }).format(new Date(`${item.month}-01T00:00:00`)),
        masuk: Number(item.barang_masuk),
        keluar: Number(item.barang_keluar),
      }))
    : [];

  const formatActivityDate = (value: string) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(`${value}T00:00:00`));
  };

  const formatActivityDateTime = (activity: DashboardRecentActivity) => {
    const date = formatActivityDate(activity.activity_date);

    return activity.activity_time ? `${date} ${activity.activity_time}` : date;
  };

  const totalStockText = summary?.total_stock != null ? Number(summary.total_stock).toLocaleString("id-ID") : "-";
  const lowStockText = summary?.low_stock_count != null ? summary.low_stock_count.toLocaleString() : "-";
  const expiringText = summary?.expiring_soon_count != null ? summary.expiring_soon_count.toLocaleString() : "-";
  const expiredCountText = expiredCount != null ? expiredCount.toLocaleString() : "-";
  const inventoryText = summary?.inventory_value != null ? `Rp${summary.inventory_value.toLocaleString("id-ID")}` : "-";

  // Calculate profit from stock movement (total masuk - total keluar)
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan sistem inventory Ampelgading Medical Centre</p>
        </div>

      </div>

      {/* KPI Cards */}
      {dashboardError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {dashboardError}
        </div>
      )}

      {loading && !dashboardError ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
          Memuat data dashboard...
        </div>
      ) : (
        <>
          {/* Row 1: 2 cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Stok Barang</p>
                  <p className="text-2xl font-semibold mt-1">{totalStockText}</p>
                  {summary?.stock_change_percent != null ? (
                    <p className={`text-xs mt-1 ${summary.stock_change_percent >= 0 ? "text-success" : "text-destructive"}`}>
                      {summary.stock_change_percent >= 0 ? "+" : ""}{summary.stock_change_percent.toFixed(1)}% dari bulan lalu
                    </p>
                  ) : null}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stok Hampir Habis</p>
                  <p className="text-2xl font-semibold mt-1 text-warning">{lowStockText}</p>
                  <p className="text-xs text-warning mt-1">Perlu restock segera</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: 2 cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Obat Sudah Expired</p>
                  <p className="text-2xl font-semibold mt-1 text-destructive">{expiredCountText}</p>
                  <p className="text-xs text-destructive mt-1">Dari tabel data barang</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mendekati Expired</p>
                  <p className="text-2xl font-semibold mt-1 text-destructive">{expiringText}</p>
                  <p className="text-xs text-destructive mt-1">Dalam 30 hari ke depan</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: 1 card full width */}
          <div className="w-full">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nilai Inventory</p>
                  <p className="text-2xl font-semibold mt-1">{inventoryText}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Movement Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold">Pergerakan Stok</h3>
              <p className="text-sm text-muted-foreground">Barang masuk vs keluar (5 bulan terakhir)</p>
            </div>
          </div>
          <div className="h-[280px]">
            {stockChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stockChartData}
                  >
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#718096" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#718096" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 180, 216, 0.08)" }}
                    formatter={(value, name) => [
                      Number(value).toLocaleString("id-ID"),
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      padding: "12px"
                    }}
                  />
                  <RechartsLegend
                    verticalAlign="bottom"
                    height={36}
                    iconType="rect"
                    iconSize={12}
                  />
                  <Bar
                    dataKey="masuk"
                    fill="#00B4D8"
                    name="Barang Masuk"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="keluar"
                    fill="#38A169"
                    name="Barang Keluar"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                Belum ada data pergerakan stok
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Distribusi Golongan Barang</h3>
            <p className="text-sm text-muted-foreground">Berdasarkan jumlah item</p>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) =>
                    `${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry) => (
                    <Cell key={`pie-cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    Number(value).toLocaleString("id-ID")
                  }
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px"
                  }}
                />
                <RechartsLegend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Belum ada data distribusi golongan barang
            </div>
          )}
          {pagination && pagination.golongan.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Halaman {golonganPage} dari {pagination.golongan.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGolonganPage(p => Math.max(1, p - 1))}
                  disabled={golonganPage === 1 || loading}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setGolonganPage(p => Math.min(pagination.golongan.total_pages, p + 1))}
                  disabled={golonganPage === pagination.golongan.total_pages || loading}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Aktivitas Transaksi Terbaru</h3>
          <p className="text-sm text-muted-foreground">Riwayat barang masuk dan keluar hari ini</p>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
            <div key={`${activity.type}-${activity.reference_no}-${activity.kode_brng}-${index}`} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "masuk"
                      ? "bg-success/10"
                      : "bg-primary/10"
                  }`}>
                    {activity.type === "masuk" ? (
                      <TrendingUp className={`w-5 h-5 text-success`} />
                    ) : (
                      <TrendingDown className={`w-5 h-5 text-primary`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.nama_brng}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === "masuk" ? "Barang Masuk" : "Barang Keluar"} - {activity.qty.toLocaleString()} unit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-sm text-muted-foreground">{formatActivityDateTime(activity)}</span>
                </div>
              </div>
            </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada aktivitas transaksi hari ini
            </div>
          )}
        </div>
        {pagination && pagination.activities.total_pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {activitiesPage} dari {pagination.activities.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setActivitiesPage(p => Math.max(1, p - 1))}
                disabled={activitiesPage === 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setActivitiesPage(p => Math.min(pagination.activities.total_pages, p + 1))}
                disabled={activitiesPage === pagination.activities.total_pages || loading}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
