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
