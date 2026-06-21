// ── Generic master option (AddItem) ──
export type MasterOption = {
  kode?: string;
  nama?: string;
  kdjns?: string;
  kode_sat?: string;
  satuan?: string;
  kode_industri?: string;
  nama_industri?: string;
};

// ── Typed master records (EditItem) ──
export type MasterSatuan = {
  kode_sat: string;
  satuan: string;
};

export type MasterGolongan = {
  kode: string;
  nama: string;
};

export type MasterJenis = {
  kdjns: string;
  nama: string;
};

export type MasterSupplier = {
  kode_industri: string;
  nama_industri: string;
};

export type Masters = {
  satuan: MasterSatuan[];
  jenis: MasterJenis[];
  golongan: MasterGolongan[];
  suppliers: MasterSupplier[];
};

// ── Master data page (MasterData) ──
export type MasterType = "golongan" | "jenis" | "satuan";

export type MasterRecord = {
  code: string;
  name: string;
};

export type MasterConfig = {
  type: MasterType;
  title: string;
  description: string;
  codeLabel: string;
  nameLabel: string;
  icon: React.ElementType;
};

export type MasterApiResponse = {
  golongan?: { kode: string; nama: string }[];
  jenis?: { kdjns: string; nama: string }[];
  satuan?: { kode_sat: string; satuan: string }[];
};
