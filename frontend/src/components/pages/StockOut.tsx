'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Hash, MapPin, Package, Search, TrendingDown } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';
import { apiUrl } from "@/lib/api";
import type { StockOutItem, StockOutBatchOption, RecentStockOut } from "@/types/stockOut";

const destinations = [
  { value: "Apotek", label: "Apotek", priceKey: "harga_apotek" },
  { value: "Umum", label: "Umum", priceKey: "harga_umum" },
  { value: "Utama (BPJS)", label: "Utama (BPJS)", priceKey: "harga_utama" },
] as const;

const formatNumberInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
};

const parseNumber = (value: string) => Number(value.replace(/\./g, "") || 0);
const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const getBatchValue = (batch: StockOutBatchOption) => `${batch.no_batch}||${batch.no_faktur}`;

const getPriceByDestination = (item: StockOutItem | null, destination: string) => {
  const selectedDestination = destinations.find((option) => option.value === destination);
  if (!selectedDestination) {
    return Number(item?.sell_price || 0);
  }

  const itemPrice = Number(item?.[selectedDestination.priceKey] || 0);

  return itemPrice || Number(item?.sell_price || 0);
};

const readJson = async <T,>(response: Response): Promise<T> => {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 160) || "Respons server tidak valid");
  }
};

export default function StockOut() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StockOutItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockOutItem | null>(null);
  const [batches, setBatches] = useState<StockOutBatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<StockOutBatchOption | null>(null);
  const [recentStockOut, setRecentStockOut] = useState<RecentStockOut[]>([]);
  const [qty, setQty] = useState("");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedQty = parseNumber(qty);
  const realtimeStock = selectedBatch
    ? Number(selectedBatch.sisa || 0)
    : Number(selectedItem?.stok || 0);
  const stockError = Boolean(selectedItem && selectedQty > realtimeStock);
  const selectedUnitPrice = getPriceByDestination(selectedItem, destination);

  useEffect(() => {
    let ignore = false;

    async function loadRecentStockOut() {
      try {
        const res = await fetch(apiUrl("/api/stock-out/recent"));
        const data = await readJson<{ data?: RecentStockOut[] }>(res);

        if (!ignore) {
          setRecentStockOut(data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadRecentStockOut();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    if (keyword.length < 2 || selectedItem) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/stock-out/items?search=${encodeURIComponent(keyword)}`), { signal: controller.signal });
        const data = await readJson<{ data?: StockOutItem[] }>(res);
        setItems(data.data || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedItem]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const kodeBrng = selectedItem.kode_brng;
    let ignore = false;

    async function loadBatches() {
      try {
        const res = await fetch(apiUrl(`/api/stock-out/batches?kode_brng=${encodeURIComponent(kodeBrng)}`));
        const data = await readJson<{ data?: StockOutBatchOption[]; error?: string }>(res);
        if (!ignore) {
          const nextBatches = data.data || [];
          setBatches(nextBatches);
          setSelectedBatch(nextBatches[0] || null);
        }
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setBatches([]);
          setSelectedBatch(null);
        }
      }
    }

    loadBatches();

    return () => {
      ignore = true;
    };
  }, [selectedItem]);

  const fetchRecentStockOut = async () => {
    try {
      const res = await fetch(apiUrl("/api/stock-out/recent"));
      const data = await readJson<{ data?: RecentStockOut[] }>(res);
      setRecentStockOut(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const showTemporaryMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const selectItem = (item: StockOutItem) => {
    setBatches([]);
    setSelectedBatch(null);
    setSelectedItem(item);
    setSearch(`${item.kode_brng} - ${item.nama_brng}`);
    setItems([]);
  };

  const resetForm = () => {
    setSearch("");
    setItems([]);
    setSelectedItem(null);
    setBatches([]);
    setSelectedBatch(null);
    setQty("");
    setDestination("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedItem || selectedQty <= 0 || !destination) {
      showTemporaryMessage("Pilih barang, isi jumlah, dan pilih tujuan penggunaan");
      return;
    }

    if (selectedItem.has_batch && !selectedBatch) {
      showTemporaryMessage("Pilih batch terlebih dahulu");
      return;
    }

    if (stockError) {
      showTemporaryMessage("Jumlah keluar melebihi stok batch tersedia");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/stock-out"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode_brng: selectedItem.kode_brng,
          qty: selectedQty,
          no_batch: selectedBatch?.no_batch || null,
          no_faktur: selectedBatch?.no_faktur || null,
          destination,
          note,
        }),
      });
      const data = await readJson<{ error?: string }>(res);

      if (!res.ok) {
        showTemporaryMessage(data.error || "Gagal memproses barang keluar");
        return;
      }

      showTemporaryMessage("Barang keluar berhasil diproses");
      resetForm();
      await fetchRecentStockOut();
    } catch (error) {
      console.error(error);
      showTemporaryMessage("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white ${message.includes("berhasil") ? "bg-green-500" : "bg-red-500"}`}>
          {message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Barang Keluar</h1>
        <p className="text-sm text-muted-foreground mt-1">Catat pengeluaran barang dari inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Form Barang Keluar</h3>
              <p className="text-sm text-muted-foreground">Cari barang berdasarkan nama, kode, atau barcode</p>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Cari Barang</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ketik nama barang, kode, atau barcode..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedItem(null);
                  setBatches([]);
                  setSelectedBatch(null);
                  if (event.target.value.trim().length < 2) {
                    setItems([]);
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {items.length > 0 && (
              <div className="mt-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {items.map((item) => (
                  <button
                    key={item.kode_brng}
                    type="button"
                    onClick={() => selectItem(item)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/40 border-b border-border last:border-b-0"
                  >
                    <p className="font-medium text-sm text-foreground">{item.nama_brng}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.kode_brng} - Stok {Number(item.stok).toLocaleString("id-ID")} {item.satuan || "unit"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{selectedItem.nama_brng}</p>
                  <p className="text-sm text-muted-foreground">
                    Total stok tersedia: {Number(selectedItem.stok).toLocaleString("id-ID")} {selectedItem.satuan || "unit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.supplier || "Supplier tidak tersedia"} {selectedItem.golongan ? `- ${selectedItem.golongan}` : ""}
                  </p>
                </div>
              </div>

              {selectedItem.has_batch && (
                <div>
                  <label className="block text-sm mb-2">Pilih Batch *</label>
                  <select
                    value={selectedBatch ? getBatchValue(selectedBatch) : ""}
                    onChange={(event) => {
                      const batch = batches.find((item) => getBatchValue(item) === event.target.value) || null;
                      setSelectedBatch(batch);
                    }}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Pilih batch</option>
                    {batches.map((batch) => (
                      <option key={getBatchValue(batch)} value={getBatchValue(batch)}>
                        {batch.no_batch} - {batch.no_faktur || "Tanpa Batch & Faktur"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedBatch && selectedItem.has_batch && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">No. Batch</p>
                    <p className="text-sm font-medium text-foreground">{selectedBatch.no_batch || "-"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">No. Faktur</p>
                    <p className="text-sm font-medium text-foreground">{selectedBatch.no_faktur || "-"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">Tanggal Expired</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(selectedBatch.expired) || "-"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">Stok Realtime</p>
                    <p className="text-sm font-medium text-foreground">{Number(selectedBatch.sisa || 0).toLocaleString("id-ID")} {selectedItem.satuan || "unit"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">Harga Apotek</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedBatch.harga_apotek)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">Harga Umum</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedBatch.harga_umum)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border">
                    <p className="text-xs text-muted-foreground">Harga Utama (BPJS)</p>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(selectedBatch.harga_utama)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">Jumlah Keluar ({selectedItem.satuan || "unit"}) *</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={qty}
                    onChange={(event) => setQty(formatNumberInput(event.target.value))}
                    className={`w-full pl-12 pr-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 ${stockError ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"}`}
                  />
                </div>
              </div>

              {stockError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Stok Tidak Mencukupi</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      Jumlah yang diminta melebihi stok batch tersedia ({Number(realtimeStock).toLocaleString("id-ID")} {selectedItem.satuan || "unit"})
                    </p>
                  </div>
                </div>
              )}

              {selectedQty > 0 && !stockError && (!selectedItem.has_batch || selectedBatch) && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground">Harga Satuan</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(selectedUnitPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground">Total Nilai</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(selectedQty * selectedUnitPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2">Tujuan Penggunaan *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Pilih tujuan</option>
                    {destinations.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Catatan</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Contoh: nomor resep, nama ruangan, atau keterangan lain"
                  className="w-full px-4 py-3 min-h-24 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (selectedItem.has_batch && !selectedBatch) || stockError || selectedQty <= 0 || !destination}
                className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Proses Barang Keluar"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold">Riwayat Barang Keluar</h3>
            <p className="text-sm text-muted-foreground">Transaksi terbaru</p>
          </div>
          <div className="divide-y divide-border">
            {recentStockOut.length > 0 ? (
              recentStockOut.map((item, index) => (
                <div key={`${item.kode_brng}-${item.date}-${item.time}-${index}`} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                        <TrendingDown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.nama_brng}</p>
                        <p className="text-sm text-muted-foreground">{item.destination || "Tujuan tidak tersedia"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(item.date)} {item.time}</span>
                          <span className="text-xs text-primary">-{Number(item.qty).toLocaleString("id-ID")} {item.unit || "unit"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(item.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">total</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Belum ada riwayat barang keluar</div>
            )}
          </div>
          <div className="p-4 border-t border-border">
            <Link href="/stockouthistory" className="block w-full py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-center">
              Lihat Semua Riwayat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
