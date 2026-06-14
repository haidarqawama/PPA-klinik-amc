'use client'

import axios from 'axios'
import { useEffect, useState } from 'react'
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";
import Link from 'next/link'
import { formatDate } from '@/utils/dateFormat';
import { apiUrl } from '@/lib/api';

const categoryColors = [
  "bg-yellow-100 text-yellow-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-red-100 text-red-700"
];

type FilterOption = {
  id: string;
  name: string;
  color?: string;
};

type MasterGolongan = {
  kode: string;
  nama: string;
};

type MasterJenis = {
  kdjns: string;
  nama: string;
};

type InventoryItem = {
  kode_brng: string;
  nama_brng: string;
  barcode?: string;
  golongan?: string;
  jenis?: string;
  stok: number;
  satuan?: string;
  supplier?: string;
  h_beli: number;
  beliluar?: number;
  ralan?: number;
  utama?: number;
  expire?: string | null;
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [medicineTypes, setMedicineTypes] = useState<FilterOption[]>([
    { id: "all", name: "Semua", color: "bg-gray-100 text-gray-700" }
  ]);
  const [itemTypes, setItemTypes] = useState<FilterOption[]>([
    { id: "all", name: "Semua" }
  ]);
  const [deleteConfirmKode, setDeleteConfirmKode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadItems() {
      try {
        const response = await axios.get(apiUrl("/api/items"));

        if (!ignore) {
          setItems(response.data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function loadMasters() {
      try {
        const response = await axios.get(apiUrl("/api/masters"));

        const golonganOptions = (response.data.golongan || [])
          .filter((item: MasterGolongan) => item.nama)
          .map((item: MasterGolongan, index: number) => ({
            id: item.nama,
            name: item.nama,
            color: categoryColors[index % categoryColors.length]
          }));

        const jenisOptions = (response.data.jenis || [])
          .filter((item: MasterJenis) => item.nama)
          .map((item: MasterJenis) => ({
            id: item.nama,
            name: item.nama
          }));

        if (!ignore) {
          setMedicineTypes([
            { id: "all", name: "Semua", color: "bg-gray-100 text-gray-700" },
            ...golonganOptions
          ]);
          setItemTypes([
            { id: "all", name: "Semua" },
            ...jenisOptions
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadItems();
    loadMasters();

    return () => {
      ignore = true;
    };
  }, [])

  const handleDelete = async (
    kodeBrng: string
  ) => {
  
    try {

      await axios.delete(
        `http://localhost:8080/api/items/${kodeBrng}`
      );
      
      setDeleteConfirmKode(null);
      setMessage("✅ Barang berhasil dihapus");
    
      fetchItems();
    
      setTimeout(() => {
        setMessage("");
      }, 3000);
    
    } catch (error) {
    
      setMessage("❌ Gagal menghapus barang");
    
      setTimeout(() => {
        setMessage("");
      }, 3000);
    
      console.error(error);
    }
  }

  const fetchItems = async () => {
    try {
      const response = await axios.get(
        apiUrl("/api/items")
      )

      setItems(response.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const getCategoryBadge = (category: string) => {
    const type = medicineTypes.find(t => t.id === category);
    return type || {
      id: category,
      name: category || "-",
      color: "bg-gray-100 text-gray-700"
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const filteredData = (items || []).filter(item => {
    const matchesSearch =
      item.nama_brng?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode_brng?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      item.golongan === selectedCategory
    const matchesType =
      selectedType === "all" ||
      item.jenis?.trim().toLowerCase() ===
        selectedType.trim().toLowerCase()
    return matchesSearch && matchesCategory && matchesType;
  });

  const itemsPerPage = 100

  const totalPages =
    Math.ceil(filteredData.length / itemsPerPage)

  const paginatedItems =
  filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white ${
            message.includes("berhasil")
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {message}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Data Inventory Barang</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola semua data barang obat dan non-obat</p>
        </div>
        <Link
          href="/add-item"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Filters */}
        <div className="p-6 border-b border-border space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama barang atau barcode..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Golongan Barang</label>
            <div className="flex flex-wrap gap-2">
              {medicineTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedCategory(type.id);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedCategory === type.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : type.color
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Jenis Barang</label>
            <div className="flex flex-wrap gap-2">
            {itemTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedType === type.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {type.name}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kode Barang
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Golongan
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Satuan
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Beli
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Jual Apotek
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Jual Umum
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Harga Jual Utama (BPJS)
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expired
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedItems.map((item, index) => {
                const badge = getCategoryBadge(item.golongan || "all");
                return (
                  <tr key={`${item.kode_brng}-${index}`} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.kode_brng}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.nama_brng}</p>
                          <p className="text-sm text-muted-foreground">{item.supplier || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                      {item.barcode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <span>
                      {item.jenis || "-"}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${item.stok <= 20 ? "text-red-500" : item.stok < 100 ? "text-yellow-500": "text-foreground"}`}>
                        {item.stok}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.satuan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatCurrency(item.h_beli)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(item.beliluar || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(item.ralan || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(item.utama || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatDate(item.expire) || undefined}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                      <Link
                        href={`/inventory/edit/${item.kode_brng}`}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                        <button
                          onClick={() =>
                            setDeleteConfirmKode(item.kode_brng)
                          }
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {deleteConfirmKode !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() =>
                setDeleteConfirmKode(null)
              }
            />

            <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6">

              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-destructive" />
              </div>

              <h3 className="text-lg font-semibold text-center">
                Hapus Barang?
              </h3>

              <p className="text-sm text-center text-muted-foreground mt-2 mb-6">
                Barang dengan kode {" "}
                <span className="font-semibold ml-1">
                  {deleteConfirmKode}
                </span>{" "}
                akan dihapus permanen.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirmKode(null)
                  }
                  className="flex-1 px-4 py-3 rounded-xl border border-border"
                >
                  Batal
                </button>
                <button
                  onClick={() =>
                    handleDelete(
                      deleteConfirmKode
                    )
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
          Menampilkan {
            paginatedItems.length
            } dari {
            filteredData.length
            } barang
          </p>

          <div className="flex gap-2 items-center">

            <button
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1)
                }
              }}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-50"
            >
              Sebelumnya
            </button>

            {Array.from(
              { length: Math.min(5, totalPages) },
              (_, i) => {
                const pageNumber = i + 1

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      page === pageNumber
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted/50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              }
            )}

            {totalPages > 5 && (
              <>
                <span className="px-2">...</span>

                <button
                  onClick={() => setPage(totalPages)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    page === totalPages
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted/50"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (page < totalPages) {
                  setPage(page + 1)
                }
              }}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-50"
            >
              Selanjutnya
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
