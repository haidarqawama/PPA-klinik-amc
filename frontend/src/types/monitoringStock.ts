export type MonitoringPeriod = "day" | "month" | "year" | "all";

export interface MonitoringStockSummary {
  critical_stock_count: number;
  restock_needed_count: number;
  expiring_soon_count: number;
  expired_count: number;
}

export interface MonitoringStockLowItem {
  kode_brng: string;
  nama_brng: string;
  stok: number;
  golongan: string;
  status: "critical" | "warning";
  satuan?: string;
}

export interface MonitoringStockExpiringItem {
  kode_brng: string;
  nama_brng: string;
  expire: string;
  days_left: number;
  batch: string;
  status: "expired" | "expiring_soon" | "normal";
}

export interface MonitoringStockTurnover {
  kode_brng: string;
  nama_brng: string;
  barang_keluar: number;
  persediaan_awal: number;
  persediaan_akhir: number;
  rata_rata_persediaan: number;
  turnover_ratio: number;
  satuan?: string;
}

export interface MonitoringStockCoverage {
  kode_brng: string;
  nama_brng: string;
  stok_saat_ini: number;
  rata_rata_pemakaian_harian: number;
  coverage_days: number;
  status: "critical" | "warning" | "good";
  satuan?: string;
}

export interface MonitoringStockGolonganStat {
  golongan: string;
  total_stock: number;
}

export interface MonitoringStockGolonganValue {
  golongan: string;
  item_count: number;
  total_stock: number;
  inventory_value: number;
}

export interface MonitoringStockResponse {
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
