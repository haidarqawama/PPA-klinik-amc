export type FilterOption = {
  id: string;
  name: string;
  color?: string;
};

export type MasterGolongan = {
  kode: string;
  nama: string;
};

export type MasterJenis = {
  kdjns: string;
  nama: string;
};

export type InventoryItem = {
  kode_brng: string;
  nama_brng: string;
  barcode?: string | null;
  golongan?: string | null;
  jenis?: string | null;
  stok: number;
  satuan?: string | null;
  supplier?: string | null;
  h_beli: number;
  beliluar?: number;
  ralan?: number;
  utama?: number;
  expire?: string | null;
  no_batch?: string | null;
  no_faktur?: string | null;
  tgl_beli?: string | null;
  tgl_kadaluarsa?: string | null;
};
