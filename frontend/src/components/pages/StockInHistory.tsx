'use client'

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Search, User, Package, RefreshCw } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';
import { apiUrl } from "@/lib/api";
import type { StockInHistoryItem, StockInHistoryResponse } from "@/types/stockIn";

const PAGE_SIZE = 100;

const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

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
  const [selectedDateEnd, setSelectedDateEnd] = useState("");
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [dateTemplate, setDateTemplate] = useState("custom");
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

    // Handle date range
    if (dateTemplate !== "custom" && dateTemplate !== "") {
      const today = new Date();
      let s: Date;
      let e: Date = new Date(today);

      switch (dateTemplate) {
        case "today":      s = new Date(today); break;
        case "7days":      s = new Date(today); s.setDate(today.getDate() - 6); break;
        case "30days":     s = new Date(today); s.setDate(today.getDate() - 29); break;
        case "thismonth":  s = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case "lastmonth":  s = new Date(today.getFullYear(), today.getMonth() - 1, 1); e = new Date(today.getFullYear(), today.getMonth(), 0); break;
        default:           s = new Date(today); break;
      }

      params.set("start_date", s.toISOString().split('T')[0]);
      params.set("end_date", e.toISOString().split('T')[0]);
    } else if (selectedDate && selectedDateEnd) {
      params.set("start_date", selectedDate);
      params.set("end_date", selectedDateEnd);
    } else if (selectedDate) {
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
  }, [page, searchQuery, selectedDate, selectedDateEnd, dateTemplate]);

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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
          <div>
            <label className="block text-sm mb-2">Cari Barang / Petugas</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nama barang, kode, barcode, petugas, supplier..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDate("");
                  setSelectedDateEnd("");
                  setDateTemplate("custom");
                  setDateRangeLabel("");
                  setPage(1);
                }}
                className="h-12 px-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive transition-colors text-sm flex items-center justify-center gap-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[320px] flex-1">
              <label className="block text-sm mb-2">Filter Tanggal (dari - sampai)</label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    min="2000-01-01"
                    max="2100-12-31"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setDateTemplate("custom"); setPage(1); }}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    min="2000-01-01"
                    max="2100-12-31"
                    value={selectedDateEnd}
                    onChange={(e) => { setSelectedDateEnd(e.target.value); setDateTemplate("custom"); setPage(1); }}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="min-w-[200px]">
              <label className="block text-sm mb-2">Template Cepat</label>
              <select
                value={dateTemplate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setDateTemplate("custom");
                    setDateRangeLabel("");
                  } else {
                    const today = new Date();
                    let s, e, label;
                    const fmt = (d: Date) => {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${y}-${m}-${day}`;
                    };
                    switch (val) {
                      case "today":
                        s = new Date(today); e = new Date(today);
                        label = `Hari Ini (${fmt(s)})`;
                        break;
                      case "7days":
                        s = new Date(today); s.setDate(today.getDate() - 6); e = new Date(today);
                        label = `7 Hari Terakhir (${fmt(s)} - ${fmt(e)})`;
                        break;
                      case "30days":
                        s = new Date(today); s.setDate(today.getDate() - 29); e = new Date(today);
                        label = `30 Hari Terakhir (${fmt(s)} - ${fmt(e)})`;
                        break;
                      case "thismonth":
                        s = new Date(today.getFullYear(), today.getMonth(), 1);
                        e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        label = `Bulan Ini (${fmt(s)} - ${fmt(e)})`;
                        break;
                      case "lastmonth":
                        s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        e = new Date(today.getFullYear(), today.getMonth(), 0);
                        label = `Bulan Lalu (${fmt(s)} - ${fmt(e)})`;
                        break;
                      default: s = new Date(today); e = new Date(today); label = "";
                    }
                    setSelectedDate(fmt(s));
                    setSelectedDateEnd(fmt(e));
                    setDateTemplate(val);
                    setDateRangeLabel(label);
                    setPage(1);
                  }
                }}
                className="w-full pl-4 pr-10 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="custom">Rentang Khusus (pilih manual)</option>
                <option value="today">Hari Ini</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="30days">30 Hari Terakhir</option>
                <option value="thismonth">Bulan Ini</option>
                <option value="lastmonth">Bulan Lalu</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {dateRangeLabel && (
        <div className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary text-center">
          {dateRangeLabel}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[90vh]">
          <table className="w-full">
            <thead className="bg-muted border-b border-border sticky top-0 z-10">
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