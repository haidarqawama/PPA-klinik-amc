# Core Features

<cite>
**Referenced Files in This Document**
- [backend/main.go](file://backend/main.go)
- [backend/routes/routes.go](file://backend/routes/routes.go)
- [backend/controllers/dashboard.go](file://backend/controllers/dashboard.go)
- [backend/controllers/itemController.go](file://backend/controllers/itemController.go)
- [backend/controllers/masterController.go](file://backend/controllers/masterController.go)
- [backend/controllers/stockInController.go](file://backend/controllers/stockInController.go)
- [backend/controllers/stockOutController.go](file://backend/controllers/stockOutController.go)
- [backend/controllers/supplierController.go](file://backend/controllers/supplierController.go)
- [backend/models/dashboard.go](file://backend/models/dashboard.go)
- [backend/models/item.go](file://backend/models/item.go)
- [backend/models/stockin.go](file://backend/models/stockin.go)
- [frontend/src/components/pages/Dashboard.tsx](file://frontend/src/components/pages/Dashboard.tsx)
- [frontend/src/components/pages/Inventory.tsx](file://frontend/src/components/pages/Inventory.tsx)
- [frontend/src/lib/api.ts](file://frontend/src/lib/api.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the core features of the PPA inventory management system with a focus on:
- Real-time dashboard analytics
- Inventory management (CRUD and barcode integration)
- Stock operations (in/out with batch tracking)
- Master data management (suppliers and classifications)

It covers feature workflows, user interactions, business logic, feature interdependencies, data relationships, integration patterns, configuration options, customization points, and usage examples.

## Project Structure
The system follows a layered backend (Go/Gin) and a Next.js frontend:
- Backend exposes REST endpoints via Gin, connects to a MySQL-compatible database, and orchestrates controllers and models.
- Frontend consumes the backend APIs, renders dashboards, inventory lists, and transaction histories.

```mermaid
graph TB
subgraph "Frontend (Next.js)"
FE_Dash["Dashboard.tsx"]
FE_Inv["Inventory.tsx"]
FE_API["api.ts"]
end
subgraph "Backend (Go/Gin)"
MAIN["main.go"]
ROUTES["routes.go"]
CTRL_DASH["controllers/dashboard.go"]
CTRL_ITEM["controllers/itemController.go"]
CTRL_MASTER["controllers/masterController.go"]
CTRL_STOCK_IN["controllers/stockInController.go"]
CTRL_STOCK_OUT["controllers/stockOutController.go"]
CTRL_SUPPLIER["controllers/supplierController.go"]
MODELS_DASH["models/dashboard.go"]
MODELS_ITEM["models/item.go"]
MODELS_STOCKIN["models/stockin.go"]
end
FE_Dash --> FE_API
FE_Inv --> FE_API
FE_API --> MAIN
MAIN --> ROUTES
ROUTES --> CTRL_DASH
ROUTES --> CTRL_ITEM
ROUTES --> CTRL_MASTER
ROUTES --> CTRL_STOCK_IN
ROUTES --> CTRL_STOCK_OUT
ROUTES --> CTRL_SUPPLIER
CTRL_DASH --> MODELS_DASH
CTRL_ITEM --> MODELS_ITEM
CTRL_STOCK_IN --> MODELS_STOCKIN
CTRL_STOCK_OUT --> MODELS_STOCKIN
```

**Diagram sources**
- [backend/main.go:12-32](file://backend/main.go#L12-L32)
- [backend/routes/routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [backend/controllers/dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [backend/controllers/itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [backend/controllers/masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [backend/controllers/stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [backend/controllers/stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [backend/controllers/supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)
- [backend/models/dashboard.go:52-60](file://backend/models/dashboard.go#L52-L60)
- [backend/models/item.go:3-33](file://backend/models/item.go#L3-L33)
- [backend/models/stockin.go:42-57](file://backend/models/stockin.go#L42-L57)
- [frontend/src/components/pages/Dashboard.tsx:157-668](file://frontend/src/components/pages/Dashboard.tsx#L157-L668)
- [frontend/src/components/pages/Inventory.tsx:62-606](file://frontend/src/components/pages/Inventory.tsx#L62-L606)
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)

**Section sources**
- [backend/main.go:12-32](file://backend/main.go#L12-L32)
- [backend/routes/routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)

## Core Components
- Dashboard analytics: Aggregates summary metrics, expiring/expired counts, classification distribution, location stock, stock movements, and recent activities with caching and pagination.
- Inventory management: Lists items with filters, updates item attributes and barcode, deletes items and related records.
- Stock operations: Stock-in with batch tracking and pricing updates; stock-out with batch selection and validation.
- Master data: CRUD for classifications (golongan, jenis, satuan) and suppliers.
- Frontend integration: Fetches and displays dashboard data, inventory list, and handles user actions.

**Section sources**
- [backend/controllers/dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [backend/controllers/itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [backend/controllers/stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [backend/controllers/stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [backend/controllers/masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [backend/controllers/supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)
- [frontend/src/components/pages/Dashboard.tsx:157-668](file://frontend/src/components/pages/Dashboard.tsx#L157-L668)
- [frontend/src/components/pages/Inventory.tsx:62-606](file://frontend/src/components/pages/Inventory.tsx#L62-L606)

## Architecture Overview
The backend initializes the database connection, registers routes, and applies model migrations. Controllers implement feature logic and interact with the database through GORM. The frontend calls the backend endpoints and renders data.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant Next as "Next.js Frontend"
participant API as "Gin Routes"
participant Ctrl as "Controllers"
participant DB as "Database"
Browser->>Next : Open "/dashboard" or "/inventory"
Next->>API : GET /api/dashboard or /api/items
API->>Ctrl : Dispatch handler
Ctrl->>DB : Execute queries (SQL joins, aggregations)
DB-->>Ctrl : Rows/Aggregates
Ctrl-->>API : JSON response
API-->>Next : JSON payload
Next-->>Browser : Render charts, tables, forms
```

**Diagram sources**
- [backend/main.go:12-32](file://backend/main.go#L12-L32)
- [backend/routes/routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [backend/controllers/dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [backend/controllers/itemController.go:98-215](file://backend/controllers/itemController.go#L98-L215)
- [frontend/src/lib/api.ts:15-18](file://frontend/src/lib/api.ts#L15-L18)

## Detailed Component Analysis

### Dashboard Analytics
- Real-time metrics aggregation:
  - Total items, total stock, inventory value, low stock threshold.
  - Expiring/expired counts computed from expiration dates.
  - Classification distribution with pagination.
  - Location-wise stock totals.
  - Stock movement trends over a rolling period.
  - Recent activities for the current day with pagination.
- Concurrency and caching:
  - Parallel execution of six metric groups using goroutines and WaitGroup.
  - Shared cache keyed by pagination parameters with TTL.
- Pagination metadata returned alongside data for client-side controls.

```mermaid
flowchart TD
Start(["GET /api/dashboard"]) --> Parse["Parse query params<br/>golongan_page, golongan_limit,<br/>activities_page, activities_limit"]
Parse --> CacheCheck{"Cache hit?"}
CacheCheck --> |Yes| ReturnCache["Return cached response"]
CacheCheck --> |No| Parallel["Launch 6 goroutines"]
Parallel --> Summary["Compute summary metrics"]
Parallel --> Expiry["Compute expiring/expired counts"]
Parallel --> Dist["Fetch classification distribution<br/>with limit/offset"]
Parallel --> Locations["Aggregate location stock"]
Parallel --> Movement["Compute monthly stock movement"]
Parallel --> Activities["Fetch recent activities<br/>with limit/offset"]
Activities --> Merge["Merge all metrics"]
Dist --> Merge
Locations --> Merge
Movement --> Merge
Summary --> Merge
Expiry --> Merge
Merge --> StoreCache["Store in cache"]
StoreCache --> Return["Return JSON response"]
```

**Diagram sources**
- [backend/controllers/dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [backend/models/dashboard.go:52-60](file://backend/models/dashboard.go#L52-L60)

**Section sources**
- [backend/controllers/dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [backend/models/dashboard.go:3-60](file://backend/models/dashboard.go#L3-L60)
- [frontend/src/components/pages/Dashboard.tsx:157-215](file://frontend/src/components/pages/Dashboard.tsx#L157-L215)

### Inventory Management (CRUD + Barcode)
- Retrieve items with search across name, code, barcode, batch, and invoice.
- Retrieve single item with joins to suppliers, units, categories, types, latest batch, and barcode.
- Update item attributes (prices, expiry, unit, classification, supplier) and manage barcode record.
- Delete item cascades to barcode, warehouse stock, and batch records.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "Routes"
participant IC as "itemController"
participant DB as "Database"
FE->>API : GET /api/items?search=...
API->>IC : GetItems()
IC->>DB : SELECT with joins and optional WHERE
DB-->>IC : Items[]
IC-->>API : JSON { total, data }
API-->>FE : Items list
FE->>API : GET /api/items/ : kodeBrng
API->>IC : GetItemByKode()
IC->>DB : SELECT with joins and WHERE kodeBrng
DB-->>IC : Item
IC-->>API : JSON { data : Item }
API-->>FE : Single item
FE->>API : PUT /api/items/ : kodeBrng
API->>IC : UpdateItem()
IC->>DB : UPDATE databarang
IC->>DB : Upsert barcode_obat
DB-->>IC : OK
IC-->>API : JSON { message }
API-->>FE : Success
FE->>API : DELETE /api/items/ : kodeBrng
API->>IC : DeleteItem()
IC->>DB : DELETE barcode_obat, gudangbarang, data_batch
IC->>DB : DELETE databarang
DB-->>IC : OK
IC-->>API : JSON { message }
API-->>FE : Success
```

**Diagram sources**
- [backend/routes/routes.go:10-22](file://backend/routes/routes.go#L10-L22)
- [backend/controllers/itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [backend/models/item.go:3-33](file://backend/models/item.go#L3-L33)

**Section sources**
- [backend/controllers/itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [backend/models/item.go:3-33](file://backend/models/item.go#L3-L33)
- [frontend/src/components/pages/Inventory.tsx:62-132](file://frontend/src/components/pages/Inventory.tsx#L62-L132)

### Stock Operations (In/Out with Batch Tracking)
- Stock-in:
  - Validates presence of item, quantity, batch, invoice, and purchase date.
  - Begins transaction, updates warehouse stock, optionally updates buying price and expiry on item.
  - Maintains batch records with snapshot of pricing and cumulative quantities.
  - Logs history entry with position “Barang Masuk”.
- Stock-out:
  - Validates sufficient stock and matching batch/invoice.
  - Updates warehouse and batch remaining quantities.
  - Logs history entry with position “Barang Keluar”.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "Routes"
participant SI as "stockInController"
participant SO as "stockOutController"
participant DB as "Database"
FE->>API : POST /api/stock-in
API->>SI : AddStockIn(payload)
SI->>DB : BEGIN
SI->>DB : SELECT previous stock by batch
SI->>DB : UPDATE/INSERT gudangbarang
SI->>DB : UPDATE databarang (price/expire if provided)
SI->>DB : UPSERT data_batch (snapshot/prices)
SI->>DB : INSERT riwayat_barang_medis (masuk)
DB-->>SI : COMMIT
SI-->>API : JSON { message, data }
API-->>FE : Success
FE->>API : POST /api/stock-out
API->>SO : AddStockOut(payload)
SO->>DB : BEGIN
SO->>DB : SELECT current stock by batch
alt Insufficient stock
SO->>DB : ROLLBACK
SO-->>API : JSON { error : insufficient }
else Valid
SO->>DB : UPDATE gudangbarang (reduce)
SO->>DB : UPDATE data_batch (sisa)
SO->>DB : INSERT riwayat_barang_medis (keluar)
DB-->>SO : COMMIT
SO-->>API : JSON { message, data }
end
API-->>FE : Success/Error
```

**Diagram sources**
- [backend/routes/routes.go:26-34](file://backend/routes/routes.go#L26-L34)
- [backend/controllers/stockInController.go:235-383](file://backend/controllers/stockInController.go#L235-L383)
- [backend/controllers/stockOutController.go:189-281](file://backend/controllers/stockOutController.go#L189-L281)

**Section sources**
- [backend/controllers/stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [backend/controllers/stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)

### Master Data Management (Classifications and Suppliers)
- Classifications:
  - Retrieve all golongan, jenis, satuan, and suppliers in one call.
  - Add/update/delete classifications via unified handler with type routing.
- Suppliers:
  - CRUD endpoints for supplier entities.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "Routes"
participant MC as "masterController"
participant SC as "supplierController"
participant DB as "Database"
FE->>API : GET /api/masters
API->>MC : GetMasters()
MC->>DB : SELECT golongan, jenis, satuan, suppliers
DB-->>MC : Arrays
MC-->>API : JSON { golongan, jenis, satuan, suppliers }
API-->>FE : Master lists
FE->>API : POST /api/masters/ : type
API->>MC : AddMaster()
MC->>DB : INSERT into target table
DB-->>MC : OK
MC-->>API : JSON { message }
API-->>FE : Created
FE->>API : PUT /api/masters/ : type/ : code
API->>MC : UpdateMaster()
MC->>DB : UPDATE by code
DB-->>MC : OK
MC-->>API : JSON { message }
API-->>FE : Updated
FE->>API : DELETE /api/masters/ : type/ : code
API->>MC : DeleteMaster()
MC->>DB : DELETE by code
DB-->>MC : OK
MC-->>API : JSON { message }
API-->>FE : Deleted
FE->>API : GET /api/suppliers
API->>SC : GetSuppliers()
SC->>DB : SELECT industrifarmasi
DB-->>SC : Array
SC-->>API : JSON { data }
API-->>FE : Suppliers list
```

**Diagram sources**
- [backend/routes/routes.go:13-20](file://backend/routes/routes.go#L13-L20)
- [backend/controllers/masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [backend/controllers/supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)

**Section sources**
- [backend/controllers/masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [backend/controllers/supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)

## Dependency Analysis
- Backend entrypoint initializes database and routes.
- Routes map HTTP verbs to controller handlers.
- Controllers depend on GORM for SQL operations and on shared models for request/response shapes.
- Frontend depends on environment variables to resolve API base URL and calls backend endpoints.

```mermaid
graph LR
MAIN["main.go"] --> ROUTES["routes.go"]
ROUTES --> CTRL_DASH["dashboard.go"]
ROUTES --> CTRL_ITEM["itemController.go"]
ROUTES --> CTRL_MASTER["masterController.go"]
ROUTES --> CTRL_STOCK_IN["stockInController.go"]
ROUTES --> CTRL_STOCK_OUT["stockOutController.go"]
ROUTES --> CTRL_SUPPLIER["supplierController.go"]
FE_API["frontend/api.ts"] --> MAIN
FE_DASH["Dashboard.tsx"] --> FE_API
FE_INV["Inventory.tsx"] --> FE_API
```

**Diagram sources**
- [backend/main.go:12-32](file://backend/main.go#L12-L32)
- [backend/routes/routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)

**Section sources**
- [backend/main.go:12-32](file://backend/main.go#L12-L32)
- [backend/routes/routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)

## Performance Considerations
- Dashboard concurrency: Six parallel queries reduce latency; ensure database supports concurrent reads/writes.
- Dashboard caching: TTL prevents frequent recomputation; adjust TTL based on acceptable staleness.
- Pagination: Limits on classification and activities prevent oversized payloads.
- Stock-in/out summaries: Pre-aggregation by item reduces join costs when no search is applied.
- Frontend rendering: Large tables paginated client-side; consider server-side pagination for very large datasets.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Dashboard errors: Controller captures first error from goroutines and returns a 500 with details.
- Stock-in failures: Transaction rollback on errors; verify batch existence and invoice matching.
- Stock-out failures: Insufficient stock triggers 400; confirm batch selection and invoice match.
- Item deletion: Cascades remove dependent records; ensure no external references.
- Frontend connectivity: Verify NEXT_PUBLIC_API_URL or host/port; ensure CORS allows requests.

**Section sources**
- [backend/controllers/dashboard.go:268-271](file://backend/controllers/dashboard.go#L268-L271)
- [backend/controllers/stockInController.go:248-252](file://backend/controllers/stockInController.go#L248-L252)
- [backend/controllers/stockOutController.go:209-213](file://backend/controllers/stockOutController.go#L209-L213)
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)

## Conclusion
The PPA system integrates a robust backend with concurrent dashboard analytics, comprehensive inventory management, precise stock-in/out operations with batch tracking, and centralized master data maintenance. The frontend leverages typed models and environment-driven API resolution to deliver responsive views. The architecture supports scalability through caching, pagination, and transactional integrity.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Feature Workflows and User Interactions
- Dashboard:
  - Load metrics and render charts; paginate classification and recent activities.
- Inventory:
  - Search, filter by classification/type, view details, update attributes, manage barcode, delete with confirmation.
- Stock-in:
  - Select item by search, enter quantity, batch, invoice, purchase date, optional price/expire; submit to create/update stock and batch records.
- Stock-out:
  - Select item, choose batch/invoice, enter quantity and destination; submit to decrement stock and log history.
- Master data:
  - View lists, add entries with validation, update names, delete codes.

**Section sources**
- [frontend/src/components/pages/Dashboard.tsx:157-668](file://frontend/src/components/pages/Dashboard.tsx#L157-L668)
- [frontend/src/components/pages/Inventory.tsx:62-606](file://frontend/src/components/pages/Inventory.tsx#L62-L606)
- [backend/controllers/stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [backend/controllers/stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [backend/controllers/masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)

### Data Relationships
- Items link to suppliers, units, categories, types, and batch records.
- Warehouse stock is partitioned by batch and invoice.
- History tracks inflows/outflows with timestamps and references.

```mermaid
erDiagram
DATABARANG {
varchar kode_brng PK
varchar nama_brng
float stokminimal
date expire
float h_beli
float ralan
float utama
float beliluar
varchar kode_sat
varchar kode_golongan
varchar kdjns
varchar kode_industri
}
BARCODE_OBAT {
varchar kode_brng
varchar barcode
}
GUDANGBARANG {
varchar kode_brng
varchar kd_bangsal
float stok
varchar no_batch
varchar no_faktur
}
DATA_BATCH {
varchar kode_brng
varchar no_batch
varchar no_faktur
date tgl_beli
date tgl_kadaluarsa
float jumlahbeli
float sisa
float dasar
float h_beli
float ralan
float kelas1
float kelas2
float kelas3
float utama
float vip
float vvip
float beliluar
float jualbebas
float karyawan
}
RIWAYAT_BARANG_MEDIS {
varchar kode_brng
float stok_awal
float masuk
float keluar
float stok_akhir
varchar posisi
date tanggal
time jam
varchar petugas
varchar kd_bangsal
varchar status
varchar no_batch
varchar no_faktur
varchar keterangan
}
DATABARANG ||--o{ GUDANGBARANG : "stock"
DATABARANG ||--o{ DATA_BATCH : "batch"
DATABARANG ||--o{ BARCODE_OBAT : "barcode"
DATABARANG ||--o{ RIWAYAT_BARANG_MEDIS : "transactions"
GUDANGBARANG ||--o{ DATA_BATCH : "batch linkage"
```

**Diagram sources**
- [backend/controllers/itemController.go:22-215](file://backend/controllers/itemController.go#L22-L215)
- [backend/controllers/stockInController.go:235-383](file://backend/controllers/stockInController.go#L235-L383)
- [backend/controllers/stockOutController.go:189-281](file://backend/controllers/stockOutController.go#L189-L281)

### Configuration and Extension Points
- Environment-driven API base URL in frontend.
- Dashboard cache TTL adjustable in controller constants.
- Pagination limits configurable per endpoint.
- Master data handler supports extensible types via table configuration.
- Transaction boundaries in stock operations ensure atomicity.

**Section sources**
- [frontend/src/lib/api.ts:1-19](file://frontend/src/lib/api.ts#L1-L19)
- [backend/controllers/dashboard.go:13-30](file://backend/controllers/dashboard.go#L13-L30)
- [backend/controllers/masterController.go:23-49](file://backend/controllers/masterController.go#L23-L49)
- [backend/controllers/stockInController.go:248-383](file://backend/controllers/stockInController.go#L248-L383)
- [backend/controllers/stockOutController.go:201-281](file://backend/controllers/stockOutController.go#L201-L281)