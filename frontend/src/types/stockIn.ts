export type StockInItem = {
  kode_brng: string;
  nama_brng: string;
  barcode: string;
  stok: number;
  h_beli: number;
  satuan: string;
  supplier: string;
  golongan: string;
  expire: string;
};

export type RecentStockIn = {
  kode_brng: string;
  nama_brng: string;
  qty: number;
  price: number;
  date: string;
  time: string;
  supplier: string;
  note: string;
};

export type StockInHistoryItem = {
  kode_brng: string;
  nama_brng: string;
  barcode: string;
  qty: number;
  unit: string;
  buy_price: number;
  total_cost: number;
  expired: string;
  date: string;
  time: string;
  supplier: string;
  operator: string;
  note: string;
};

export type StockInHistoryResponse = {
  data?: StockInHistoryItem[];
  error?: string;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  total_qty?: number;
  total_value?: number;
};
