export type StockOutItem = {
  kode_brng: string;
  nama_brng: string;
  barcode: string;
  stok: number;
  has_batch: boolean;
  sell_price: number;
  harga_apotek: number;
  harga_umum: number;
  harga_utama: number;
  satuan: string;
  supplier: string;
  golongan: string;
  jenis: string;
  expire: string;
};

export type StockOutBatchOption = {
  no_batch: string;
  no_faktur: string;
  expired: string;
  sisa: number;
  h_beli: number;
  sell_price: number;
  harga_apotek: number;
  harga_umum: number;
  harga_utama: number;
  tgl_beli: string;
};

export type RecentStockOut = {
  kode_brng: string;
  nama_brng: string;
  qty: number;
  unit: string;
  sell_price: number;
  total_revenue: number;
  date: string;
  time: string;
  destination: string;
  note: string;
};

export type StockOutHistoryItem = {
  kode_brng: string;
  nama_brng: string;
  barcode: string;
  qty: number;
  unit: string;
  sell_price: number;
  total_revenue: number;
  date: string;
  time: string;
  destination: string;
  operator: string;
  note: string;
};

export type StockOutHistoryResponse = {
  data?: StockOutHistoryItem[];
  error?: string;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  total_qty?: number;
  total_value?: number;
};
