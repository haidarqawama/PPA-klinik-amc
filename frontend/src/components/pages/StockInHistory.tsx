'use client'

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Search, User, Package, RefreshCw } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';
import { apiUrl } from "@/lib/api";

const PAGE_SIZE = 100;

type StockInHistoryItem = {
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

const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

type StockInHistoryResponse = {
  data?: StockInHistoryItem[];
  error?: string;
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  total_qty?: number;
  total_value?: number;
};

const readApiResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {} as StockInHistoryResponse;
  }

  try {
    return JSON.parse(text) as StockInHistoryResponse;
  } catch {
    if (response.status === 404) {
      throw new Error("Endpoint riwayat barang masuk belum aktif. Restart backend lalu muat ulang halaman.");
    }

    throw new Error(text.slice(0, 160) || "Respons server tidak valid");
  }
};

export default function StockInHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [history, setHistory] = useState<StockInHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    if (selectedDate) {
      params.set("date", selectedDate);
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/api/stock-in/history?${params.toString()}`), { signal });
      const data = await readApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil riwayat barang masuk");
      }

      const rows = data.data || [];

      setHistory(rows);
      setPage(data.page || page);
      setTotalRows(data.total ?? rows.length);
      setTotalPages(data.total_pages ?? (rows.length > 0 ? 1 : 0));
      setTotalQty(data.total_qty ?? 0);
      setTotalValue(data.total_value ?? 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      console.error(err);
      setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server");
      setHistory([]);
      setTotalRows(0);
      setTotalPages(0);
      setTotalQty(0);
      setTotalValue(0);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [page, searchQuery, selectedDate]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchHistory(controller.signal);
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchHistory]);

  const firstRow = totalRows === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, totalRows);
  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((pageNumber) => (
    pageNumber === 1 ||
    pageNumber === totalPages ||
    Math.abs(pageNumber - page) <= 1
  ));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/stock-in"
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Kembali ke barang masuk"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Riwayat Barang Masuk</h1>
          <p className="text-sm text-muted-foreground mt-1">Semua transaksi barang masuk lengkap dengan petugas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-semibold text-foreground">{totalRows.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Unit Masuk</p>
              <p className="text-xl font-semibold text-foreground">{totalQty.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai Pembelian</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-4 items-end">
          <div>
            <label className="block text-sm mb-2">Cari Barang / Petugas</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nama barang, kode, barcode, petugas, supplier..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Filter Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedDate("");
              setPage(1);
            }}
            className="h-12 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Waktu</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Barang</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Harga Beli</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Expired</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Petugas</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Memuat riwayat barang masuk...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && history.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada riwayat barang masuk yang sesuai filter
                  </td>
                </tr>
              )}

              {!loading && !error && history.map((item, index) => (
                <tr key={`${item.kode_brng}-${item.date}-${item.time}-${index}`} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(item.date)}</p>
                      <p className="text-xs text-muted-foreground">{item.time || "-"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.nama_brng}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.barcode || item.kode_brng}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-success">
                      +{Number(item.qty || 0).toLocaleString('id-ID')} {item.unit || "unit"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatCurrency(item.buy_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {formatCurrency(item.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(item.expired)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{item.supplier || "-"}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-foreground">{item.operator || "-"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground">{item.note || "-"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-border flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {firstRow.toLocaleString('id-ID')}-{lastRow.toLocaleString('id-ID')} dari {totalRows.toLocaleString('id-ID')} transaksi
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={loading || page <= 1}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>

            {visiblePages.map((pageNumber, index) => {
              const previousPage = visiblePages[index - 1];
              const showGap = previousPage && pageNumber - previousPage > 1;

              return (
                <div key={pageNumber} className="flex items-center gap-2">
                  {showGap && <span className="text-sm text-muted-foreground">...</span>}
                  <button
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    disabled={loading || pageNumber === page}
                    className={`min-w-10 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      pageNumber === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted/50"
                    } disabled:cursor-default`}
                  >
                    {pageNumber}
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              disabled={loading || totalPages === 0 || page >= totalPages}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>

            <button
              type="button"
              onClick={() => fetchHistory()}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              Muat ulang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}