import { useState } from "react";
import { Search, Plus, Edit, Trash2, Building2, X, Phone, MapPin, Map } from "lucide-react";
import { useEffect } from "react";

interface Supplier {
  id: number;
  nama_industri: string;
  alamat: string;
  kota: string;
  no_telp: string;
}

const ITEMS_PER_PAGE = 10;

const emptyForm = { nama_industri: "", alamat: "", kota: "", no_telp: "" };

export default function Supplier() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  const fetchSuppliers = async () => {
  
    try {
  
      const res =
        await fetch(
          "http://localhost:8081/api/suppliers"
        );
  
      const data =
        await res.json();
  
      setSuppliers(
        data.data || []
      );
  
    } catch (err) {
  
      console.error(err);
  
    }
  
  };

  const filtered = suppliers.filter(
    (s) =>
      s.nama_industri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kota.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.alamat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setForm({ nama_industri: s.nama_industri, alamat: s.alamat, kota: s.kota, no_telp: s.no_telp });
    setEditingId(s.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {

    if (
      !form.nama_industri.trim() ||
      !form.kota.trim()
    ) return;
  
    try {
  
      const url =
        editingId !== null
          ? `http://localhost:8081/api/suppliers/${editingId}`
          : "http://localhost:8081/api/suppliers";
  
      const method =
        editingId !== null
          ? "PUT"
          : "POST";
  
      await fetch(url,{
        method,
  
        headers:{
          "Content-Type":
          "application/json"
        },
  
        body: JSON.stringify(form)
      });
  
      await fetchSuppliers();
  
      closeModal();
  
      setCurrentPage(1);
  
      window.scrollTo({
        top:0,
        behavior:"smooth"
      });
  
    } catch (err) {
  
      console.error(err);
  
    }
  
  };

  const handleDelete = async (
    id:number
  ) => {
  
    try {
  
      await fetch(
        `http://localhost:8081/api/suppliers/${id}`,
        {
          method:"DELETE"
        }
      );
  
      await fetchSuppliers();
  
      setDeleteConfirmId(null);
  
    } catch (err) {
  
      console.error(err);
  
    }
  
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Data Supplier</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data industri dan distributor farmasi</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Supplier
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Supplier</p>
            <p className="text-2xl font-bold text-foreground">{suppliers.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Map className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kota Asal</p>
            <p className="text-2xl font-bold text-foreground">
              {new Set(suppliers.map((s) => s.kota)).size}
            </p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Search className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hasil Pencarian</p>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Search bar */}
        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama supplier, kota, atau alamat..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Kode Industri
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nama Industri
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Alamat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kota
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  No Telp
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginated.length === 0 ? (
                <tr key="empty-row">
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">Tidak ada supplier ditemukan</p>
                      <p className="text-sm text-muted-foreground">Coba ubah kata kunci pencarian</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((supplier, idx) => (
                  <tr key={supplier.kode_supplier || supplier.kode_industri || idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                          {supplier.kode_industri}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground text-sm">{supplier.nama_industri}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{supplier.alamat}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {supplier.kota}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{supplier.no_telp}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(supplier)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(supplier.id)}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Menampilkan {paginated.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} supplier
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border border-border hover:bg-muted/50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editingId !== null ? "Edit Supplier" : "Tambah Supplier Baru"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingId !== null ? "Perbarui data supplier" : "Isi data industri farmasi"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Industri <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama_industri}
                  onChange={(e) => setForm((f) => ({ ...f, nama_industri: e.target.value }))}
                  placeholder="Contoh: PT Kimia Farma"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Alamat
                </label>
                <input
                  type="text"
                  value={form.alamat}
                  onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Contoh: Jl. Veteran No. 9"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Kota <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.kota}
                  onChange={(e) => setForm((f) => ({ ...f, kota: e.target.value }))}
                  placeholder="Contoh: Jakarta"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  No Telp
                </label>
                <input
                  type="text"
                  value={form.no_telp}
                  onChange={(e) => setForm((f) => ({ ...f, no_telp: e.target.value }))}
                  placeholder="Contoh: 021-3847108"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!form.nama_industri.trim() || !form.kota.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId !== null ? "Simpan Perubahan" : "Tambah Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center">Hapus Supplier?</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
              Data{" "}
              <span className="font-medium text-foreground">
                {suppliers.find((s) => s.id === deleteConfirmId)?.nama_industri}
              </span>{" "}
              akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-3 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
