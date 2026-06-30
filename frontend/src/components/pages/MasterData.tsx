'use client'

import { useEffect, useMemo, useState } from "react";
import { Edit, Layers3, Plus, Ruler, Search, Tags, Trash2, X } from "lucide-react";
import { apiUrl } from "@/lib/api";
import type { MasterType, MasterRecord, MasterConfig, MasterApiResponse } from "@/types/master";

const configs: MasterConfig[] = [
  {
    type: "golongan",
    title: "Golongan",
    description: "Kelola klasifikasi golongan barang",
    codeLabel: "Kode Golongan",
    nameLabel: "Nama Golongan",
    icon: Tags
  },
  {
    type: "jenis",
    title: "Jenis",
    description: "Kelola jenis atau bentuk barang",
    codeLabel: "Kode Jenis",
    nameLabel: "Nama Jenis",
    icon: Layers3
  },
  {
    type: "satuan",
    title: "Satuan",
    description: "Kelola satuan pemakaian barang",
    codeLabel: "Kode Satuan",
    nameLabel: "Nama Satuan",
    icon: Ruler
  }
];

const emptyForm = { code: "", name: "" };

export default function MasterData() {
  const [activeType, setActiveType] = useState<MasterType>("golongan");
  const [records, setRecords] = useState<Record<MasterType, MasterRecord[]>>({
    golongan: [],
    jenis: [],
    satuan: []
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<MasterRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const activeConfig = configs.find((item) => item.type === activeType) || configs[0];
  const ActiveIcon = activeConfig.icon;

  useEffect(() => {
    let ignore = false;

    async function loadMasters() {
      try {
        setLoading(true);
        const res = await fetch(apiUrl("/api/masters"));
        const data = (await res.json()) as MasterApiResponse;

        if (!ignore) {
          setRecords({
            golongan: (data.golongan || []).map((item) => ({
              code: item.kode,
              name: item.nama
            })),
            jenis: (data.jenis || []).map((item) => ({
              code: item.kdjns,
              name: item.nama
            })),
            satuan: (data.satuan || []).map((item) => ({
              code: item.kode_sat,
              name: item.satuan
            }))
          });
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setMessage("Gagal memuat master data");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMasters();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let list = [...(records[activeType] || [])];

    // Urutkan berdasarkan kode
    list.sort((a, b) =>
      a.code.localeCompare(
        b.code,
        undefined,
        { numeric: true }
      )
    );

    if (!keyword) return list;

    return list.filter((item) =>
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword)
    );
  }, [activeType, records, searchQuery]);

  const refreshMasters = async () => {
    const res = await fetch(apiUrl("/api/masters"));
    const data = (await res.json()) as MasterApiResponse;

    setRecords({
      golongan: (data.golongan || []).map((item) => ({
        code: item.kode,
        name: item.nama
      })),
      jenis: (data.jenis || []).map((item) => ({
        code: item.kdjns,
        name: item.nama
      })),
      satuan: (data.satuan || []).map((item) => ({
        code: item.kode_sat,
        name: item.satuan
      }))
    });
  };

  const generateNextCode = (type: MasterType) => {
    const list = records[type] || [];
  
    if (list.length === 0) {
      if (type === "golongan") return "G01";
      if (type === "jenis") return "J001";
      return "";
    }
  
    const lastCode = [...list]
      .sort((a, b) =>
        a.code.localeCompare(
          b.code,
          undefined,
          { numeric: true }
        )
      )
      .pop()?.code || "";
  
    const number =
      parseInt(lastCode.replace(/\D/g, "")) + 1;
  
    if (type === "golongan") {
      return `G${String(number).padStart(2, "0")}`;
    }
  
    if (type === "jenis") {
      return `J${String(number).padStart(3, "0")}`;
    }
  
    return "";
  };

  const openAdd = () => {
    setEditingRecord(null);
  
    setForm({
      code:
        activeType === "satuan"
          ? ""
          : generateNextCode(activeType),
      name: "",
    });
  
    setShowModal(true);
  };

  const openEdit = (record: MasterRecord) => {
    setEditingRecord(record);
    setForm(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const showTemporaryMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    try {
      const isEditing = editingRecord !== null;
      const url = isEditing
        ? apiUrl(`/api/masters/${activeType}/${encodeURIComponent(editingRecord.code)}`)
        : apiUrl(`/api/masters/${activeType}`);

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim()
        })
      });

      const data = await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        showTemporaryMessage(data.error || "Gagal menyimpan master data");
        return;
      }

      await refreshMasters();
      closeModal();
      showTemporaryMessage(isEditing ? "Master data berhasil diperbarui" : "Master data berhasil ditambahkan");
    } catch (error) {
      console.error(error);
      showTemporaryMessage("Tidak dapat terhubung ke server");
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;

    try {
      const res = await fetch(
        apiUrl(`/api/masters/${activeType}/${encodeURIComponent(deleteRecord.code)}`),
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        showTemporaryMessage(data.error || "Gagal menghapus master data");
        return;
      }

      await refreshMasters();
      setDeleteRecord(null);
      showTemporaryMessage("Master data berhasil dihapus");
    } catch (error) {
      console.error(error);
      showTemporaryMessage("Tidak dapat terhubung ke server");
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Master Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola golongan, jenis, dan satuan barang</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah {activeConfig.title}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {configs.map((item) => {
          const Icon = item.icon;
          const isActive = activeType === item.type;

          return (
            <button
              key={item.type}
              onClick={() => {
                setActiveType(item.type);
                setSearchQuery("");
              }}
              className={`rounded-2xl border p-5 text-left shadow-sm transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                  : "border-border bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-white/20" : "bg-primary/10"
                }`}>
                  <Icon className={`w-6 h-6 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                </div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className={`text-sm mt-1 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {records[item.type].length} data
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm">
        <div className="p-6 border-b border-border flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <ActiveIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Data {activeConfig.title}</h2>
              <p className="text-sm text-muted-foreground">{activeConfig.description}</p>
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Cari ${activeConfig.title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="w-[200px] px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {activeConfig.codeLabel}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {activeConfig.nameLabel}
                </th>
                <th className="w-[120px] px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-muted-foreground">
                    Memuat master data...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-muted-foreground">
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.code} className="hover:bg-muted/20 transition-colors">
                    <td className="w-[200px] px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {record.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-foreground">
                        {record.name}
                      </span>
                    </td>
                    <td className="w-[120px] px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(record)}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteRecord(record)}
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

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="px-6 py-14 text-center text-muted-foreground">
              Memuat master data...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-6 py-14 text-center text-muted-foreground">
              Data tidak ditemukan
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.code} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{activeConfig.codeLabel}</p>
                    <p className="font-mono text-sm font-medium text-foreground truncate">
                      {record.code}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => openEdit(record)}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteRecord(record)}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{activeConfig.nameLabel}</p>
                  <p className="text-sm text-foreground">{record.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editingRecord ? `Edit ${activeConfig.title}` : `Tambah ${activeConfig.title}`}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">{activeConfig.description}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {activeConfig.codeLabel} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  disabled={
                    !editingRecord &&
                    (activeType === "golongan" ||
                      activeType === "jenis")
                  }
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {activeConfig.nameLabel} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
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
                disabled={!form.code.trim() || !form.name.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteRecord(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground text-center">Hapus {activeConfig.title}?</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
              Data <span className="font-medium text-foreground">{deleteRecord.name}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteRecord(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
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

