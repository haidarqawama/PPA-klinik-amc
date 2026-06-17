'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, TrendingUp, Calendar, DollarSign, Search, Hash } from "lucide-react";
import { formatDate } from '@/utils/dateFormat';
import { apiUrl } from "@/lib/api";

type StockInItem = {
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

type RecentStockIn = {
  kode_brng: string;
  nama_brng: string;
  qty: number;
  price: number;
  date: string;
  time: string;
  supplier: string;
  note: string;
};

const formatNumberInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
};

const formatCurrencyInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (value: string) => Number(value.replace(/\./g, "") || 0);

export default function StockIn() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StockInItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockInItem | null>(null);
  const [recentStockIn, setRecentStockIn] = useState<RecentStockIn[]>([]);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [expired, setExpired] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadRecentStockIn() {
      try {
        const res = await fetch(apiUrl("/api/stock-in/recent"));
        const data = await res.json();

        if (!ignore) {
          setRecentStockIn(data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadRecentStockIn();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    if (keyword.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/stock-in/items?search=${encodeURIComponent(keyword)}`), {
          signal: controller.signal,
        });
        const data = await res.json();
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
  }, [search]);

  const fetchRecentStockIn = async () => {
    try {
      const res = await fetch(apiUrl("/api/stock-in/recent"));
      const data = await res.json();
      setRecentStockIn(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const showTemporaryMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const selectItem = (item: StockInItem) => {
    setSelectedItem(item);
    setSearch(`${item.kode_brng} - ${item.nama_brng}`);
    setItems([]);
    setPrice(item.h_beli > 0 ? formatCurrencyInput(String(Math.round(item.h_beli))) : "");
    setExpired(item.expire || "");
  };

  const resetForm = () => {
    setSearch("");
    setItems([]);
    setSelectedItem(null);
    setQty("");
    setPrice("");
    setExpired("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedItem || parseNumber(qty) <= 0) {
      showTemporaryMessage("Pilih barang dan isi jumlah masuk");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/stock-in"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode_brng: selectedItem.kode_brng,
          qty: parseNumber(qty),
          price: parseNumber(price),
          expired: expired || null,
          note,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showTemporaryMessage(data.error || "Gagal memproses barang masuk");
        return;
      }

      showTemporaryMessage("Barang masuk berhasil diproses");
      resetForm();
      await fetchRecentStockIn();
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
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white ${
          message.includes("berhasil") ? "bg-green-500" : "bg-red-500"
        }`}>
          {message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Barang Masuk</h1>
        <p className="text-sm text-muted-foreground mt-1">Restock barang yang sudah ada di inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Form Barang Masuk</h3>
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
                      {item.kode_brng} {item.barcode ? `- ${item.barcode}` : ""} - Stok {Number(item.stok).toLocaleString("id-ID")} {item.satuan || "unit"}
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
                    Stok saat ini: {Number(selectedItem.stok).toLocaleString("id-ID")} {selectedItem.satuan || "unit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.supplier || "Supplier tidak tersedia"} {selectedItem.golongan ? `- ${selectedItem.golongan}` : ""}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Jumlah Masuk ({selectedItem.satuan || "unit"}) *</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={qty}
                    onChange={(event) => setQty(formatNumberInput(event.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Harga Beli Terbaru</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={price}
                    onChange={(event) => setPrice(formatCurrencyInput(event.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Tanggal Expired</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    min="2000-01-01"
                    max="2100-12-31"
                    value={expired}
                    onChange={(event) => setExpired(event.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Catatan</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Contoh: Restock rutin, nomor faktur, atau keterangan lain"
                  className="w-full px-4 py-3 min-h-24 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || parseNumber(qty) <= 0}
                className="w-full py-3 px-6 rounded-xl bg-success text-success-foreground shadow-lg shadow-success/20 hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Proses Barang Masuk"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-semibold">Riwayat Barang Masuk</h3>
            <p className="text-sm text-muted-foreground">Transaksi terbaru</p>
          </div>
          <div className="divide-y divide-border">
            {recentStockIn.length > 0 ? (
              recentStockIn.map((item, index) => (
                <div key={`${item.kode_brng}-${item.date}-${item.time}-${index}`} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mt-1">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.nama_brng}</p>
                        <p className="text-sm text-muted-foreground">{item.supplier || "Supplier tidak tersedia"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(item.date)} {item.time}</span>
                          <span className="text-xs text-success">+{Number(item.qty).toLocaleString("id-ID")} unit</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        Rp {Number(item.price || 0).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">harga beli</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Belum ada riwayat barang masuk
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border">
            <Link
              href="/stockinhistory"
              className="block w-full py-2.5 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-center"
            >
              Lihat Semua Riwayat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
