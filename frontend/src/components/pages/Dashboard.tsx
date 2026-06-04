'use client'

import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ShoppingCart,
  Bell,
  X
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend as RechartsLegend
} from "recharts";

const stockData = [
  { month: "Jan", masuk: 240, keluar: 180 },
  { month: "Feb", masuk: 300, keluar: 220 },
  { month: "Mar", masuk: 280, keluar: 260 },
  { month: "Apr", masuk: 350, keluar: 290 },
  { month: "Mei", masuk: 320, keluar: 310 },
];

const defaultCategoryData = [
  { name: "Obat Bebas", value: 450, color: "#00B4D8" },
  { name: "Obat Keras", value: 320, color: "#38A169" },
  { name: "Psiko Narko", value: 120, color: "#DD6B20" },
  { name: "Alat Kesehatan", value: 280, color: "#805AD5" },
];

interface DashboardSummary {
  total_items: number;
  total_stock: number;
  low_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  inventory_value: number;
}

interface DashboardDistribution {
  label: string;
  item_count: number;
  total_stock: number;
}

interface DashboardExpiredItem {
  kode_brng: string;
  nama_brng: string;
  expire: string | null;
}

interface DashboardStockMovement {
  month: string;
  barang_masuk: number;
  barang_keluar: number;
}

interface DashboardResponse {
  summary: DashboardSummary;
  golongan_distribution: DashboardDistribution[];
  location_stock: { location: string; total_stock: number }[];
  stock_movement: DashboardStockMovement[];
  expired_items?: DashboardExpiredItem[];
}

const recentActivities = [
  { id: 1, type: "masuk", item: "Paracetamol 500mg", qty: 100, time: "10 menit lalu" },
  { id: 2, type: "keluar", item: "Amoxicillin 500mg", qty: 50, time: "25 menit lalu" },
  { id: 3, type: "masuk", item: "Vitamin C", qty: 200, time: "1 jam lalu" },
  { id: 4, type: "keluar", item: "Betadine Solution", qty: 15, time: "2 jam lalu" },
  { id: 5, type: "masuk", item: "Sarung Tangan Latex", qty: 500, time: "3 jam lalu" },
];

const notifications = [
  {
    id: 1,
    type: "expired",
    title: "Barang Sudah Expired!",
    message: "Omeprazole 20mg Batch B2023-012 sudah expired sejak 10/05/2026 - Segera tarik dari inventory!",
    time: "2 menit lalu",
    read: false
  },
  {
    id: 2,
    type: "stock",
    title: "Stok Minimum Tercapai",
    message: "Paracetamol 500mg hanya tersisa 20 strip (min: 50)",
    time: "5 menit lalu",
    read: false
  },
  {
    id: 3,
    type: "expired",
    title: "Barang Mendekati Expired",
    message: "Vitamin B Complex akan expired dalam 17 hari (30/05/2026)",
    time: "15 menit lalu",
    read: false
  },
  {
    id: 4,
    type: "stock",
    title: "Stok Kritis",
    message: "Betadine Solution tersisa 15 botol (min: 50)",
    time: "30 menit lalu",
    read: false
  },
  {
    id: 5,
    type: "expired",
    title: "Barang Expired!",
    message: "Insulin Batch A2023-089 expired 15/05/2026 - Harap segera dimusnahkan",
    time: "45 menit lalu",
    read: false
  },
  {
    id: 6,
    type: "price",
    title: "Perubahan Harga",
    message: "Harga beli Amoxicillin 500mg berubah dari Rp 1.200 → Rp 1.350",
    time: "1 jam lalu",
    read: false
  },
  {
    id: 7,
    type: "expired",
    title: "Barang Segera Expired",
    message: "Paracetamol 500mg Batch B2024-001 akan expired dalam 33 hari",
    time: "2 jam lalu",
    read: true
  },
  {
    id: 8,
    type: "price",
    title: "Perubahan Harga",
    message: "Harga jual Vitamin C 1000mg diupdate menjadi Rp 2.200",
    time: "3 jam lalu",
    read: true
  },
];

export default function Dashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expiredCount, setExpiredCount] = useState<number | null>(null);
  const [distribution, setDistribution] = useState<DashboardDistribution[]>([]);
  const [stockMovement, setStockMovement] = useState<DashboardStockMovement[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8081/api/dashboard");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body = await response.json();
        const data = body.data as DashboardResponse;
        setSummary(data.summary);
        setDistribution(data.golongan_distribution || []);
        setStockMovement(data.stock_movement || []);
        setExpiredCount(
          data.summary.expired_count ?? data.expired_items?.length ?? null
        );
        setDashboardError(null);
      } catch (error) {
        setDashboardError("Gagal memuat dashboard dari server");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const categoryData = distribution.length
    ? distribution.map((item, index) => ({
        name: item.label,
        value: Number(item.total_stock),
        color: ["#00B4D8", "#38A169", "#DD6B20", "#805AD5", "#F6AD55", "#4A5568"][index % 6]
      }))
    : defaultCategoryData;

  const stockChartData = stockMovement.length
    ? stockMovement.map((item) => ({
        month: item.month,
        masuk: Number(item.barang_masuk),
        keluar: Number(item.barang_keluar),
      }))
    : stockData;

  const totalStockText = summary?.total_stock != null ? summary.total_stock.toString() : "-";
  const lowStockText = summary?.low_stock_count != null ? summary.low_stock_count.toLocaleString() : "-";
  const expiringText = summary?.expiring_soon_count != null ? summary.expiring_soon_count.toLocaleString() : "-";
  const expiredCountText = expiredCount != null ? expiredCount.toLocaleString() : "-";
  const inventoryText = summary?.inventory_value != null ? `Rp ${summary.inventory_value.toLocaleString()}` : "-";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan sistem inventory Ampelgading Medical Centre</p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />

              {/* Notification Panel */}
              <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div>
                    <h3 className="font-semibold text-foreground">Notifikasi</h3>
                    <p className="text-xs text-muted-foreground">{unreadCount} notifikasi belum dibaca</p>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto max-h-[500px]">
                  {notifications.map((notif) => {
                    const getNotifStyle = () => {
                      switch (notif.type) {
                        case "stock":
                          return {
                            bg: "bg-warning/10",
                            border: "border-warning/20",
                            icon: <AlertTriangle className="w-5 h-5 text-warning" />,
                            iconBg: "bg-warning/10"
                          };
                        case "expired":
                          return {
                            bg: "bg-destructive/10",
                            border: "border-destructive/20",
                            icon: <Calendar className="w-5 h-5 text-destructive" />,
                            iconBg: "bg-destructive/10"
                          };
                        case "price":
                          return {
                            bg: "bg-primary/10",
                            border: "border-primary/20",
                            icon: <DollarSign className="w-5 h-5 text-primary" />,
                            iconBg: "bg-primary/10"
                          };
                        default:
                          return {
                            bg: "bg-muted/10",
                            border: "border-border",
                            icon: <Bell className="w-5 h-5 text-muted-foreground" />,
                            iconBg: "bg-muted"
                          };
                      }
                    };

                    const style = getNotifStyle();

                    return (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-border hover:bg-muted/20 transition-colors cursor-pointer ${
                          !notif.read ? "bg-muted/30" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-foreground">{notif.title}</p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-muted/30">
                  <button className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                    Tandai Semua Sudah Dibaca
                  </button>
                </div>
              </div>
            </>
          )}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stok Barang</p>
                <p className="text-2xl font-semibold mt-1">{totalStockText}</p>
                <p className="text-xs text-success mt-1">+12% dari bulan lalu</p>
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

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nilai Inventory</p>
                <p className="text-2xl font-semibold mt-1">{inventoryText}</p>
                <p className="text-xs text-success mt-1">Keuntungan: Rp 52M</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#718096"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#718096"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "14px"
                  }}
                  cursor={{ fill: 'rgba(0, 180, 216, 0.1)' }}
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
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold">Distribusi Golongan Barang</h3>
            <p className="text-sm text-muted-foreground">Berdasarkan jumlah item</p>
          </div>
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
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold">Aktivitas Transaksi Terbaru</h3>
          <p className="text-sm text-muted-foreground">Riwayat barang masuk dan keluar hari ini</p>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
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
                    <p className="font-medium text-foreground">{activity.item}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type === "masuk" ? "Barang Masuk" : "Barang Keluar"} • {activity.qty} unit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
