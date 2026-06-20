export interface DashboardSummary {
  total_items: number;
  total_stock: number;
  low_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  inventory_value: number;
}

export interface DashboardDistribution {
  label: string;
  item_count: number;
  total_stock: number;
}

export interface DashboardExpiredItem {
  kode_brng: string;
  nama_brng: string;
  expire: string | null;
}

export interface DashboardStockMovement {
  month: string;
  barang_masuk: number;
  barang_keluar: number;
}

export interface DashboardRecentActivity {
  id: number;
  type: "masuk" | "keluar";
  kode_brng: string;
  nama_brng: string;
  qty: number;
  activity_date: string;
  activity_time: string;
  reference_no: string;
}

export interface DashboardPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface DashboardPaginationMeta {
  golongan: DashboardPagination;
  activities: DashboardPagination;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  golongan_distribution: DashboardDistribution[];
  location_stock: { location: string; total_stock: number }[];
  stock_movement: DashboardStockMovement[];
  recent_activities: DashboardRecentActivity[];
  pagination: DashboardPaginationMeta;
  expired_items?: DashboardExpiredItem[];
}
