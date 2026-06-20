# Backend Architecture

<cite>
**Referenced Files in This Document**
- [main.go](file://backend/main.go)
- [database.go](file://backend/config/database.go)
- [routes.go](file://backend/routes/routes.go)
- [go.mod](file://backend/go.mod)
- [itemController.go](file://backend/controllers/itemController.go)
- [masterController.go](file://backend/controllers/masterController.go)
- [stockInController.go](file://backend/controllers/stockInController.go)
- [stockOutController.go](file://backend/controllers/stockOutController.go)
- [supplierController.go](file://backend/controllers/supplierController.go)
- [dashboard.go](file://backend/controllers/dashboard.go)
- [monitoringStockB.go](file://backend/controllers/monitoringStockB.go)
- [expireFilters.go](file://backend/controllers/expireFilters.go)
- [addItemController.go](file://backend/controllers/addItemController.go)
- [stockQuery.go](file://backend/controllers/stockQuery.go)
- [item.go](file://backend/models/item.go)
- [stockin.go](file://backend/models/stockin.go)
- [stockout.go](file://backend/models/stockout.go)
- [supplier.go](file://backend/models/supplier.go)
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
This document describes the backend architecture of the PPA system, focusing on the Model-View-Controller (MVC) pattern, Gin framework routing, and GORM ORM integration. It explains database connection management, auto-migration processes, model relationships, controller-layer business logic organization, middleware usage, and API endpoint structure. Architectural decisions, design patterns, system boundaries, scalability considerations, performance optimization strategies, and security implementations are documented alongside the data flow across the backend.

## Project Structure
The backend follows a layered structure:
- Entry point initializes the HTTP server, database connection, CORS middleware, and routes.
- Routes define the API surface and bind handlers from controllers.
- Controllers encapsulate business logic and orchestrate data access via GORM.
- Models represent domain entities and table mappings.
- Config manages database connectivity and schema initialization.

```mermaid
graph TB
Main["main.go<br/>Server bootstrap"] --> Routes["routes.go<br/>Route registration"]
Routes --> Controllers["Controllers<br/>(item, master, stock-in/out, supplier, dashboard, monitoring)"]
Controllers --> GORM["GORM DB Session<br/>config/database.go"]
GORM --> MySQL["MySQL Database"]
Controllers --> Models["Models<br/>(item, stockin, stockout, supplier)"]
```

**Diagram sources**
- [main.go:12-32](file://backend/main.go#L12-L32)
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [database.go:13-83](file://backend/config/database.go#L13-L83)

**Section sources**
- [main.go:12-32](file://backend/main.go#L12-L32)
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [database.go:13-83](file://backend/config/database.go#L13-L83)

## Core Components
- Server Bootstrap and Middleware
  - Initializes Gin router, registers CORS, health check endpoint, and mounts routes.
  - Uses default Gin middleware stack plus CORS.
- Database Layer
  - Establishes a persistent GORM session to MySQL.
  - Performs auto-migrations for core tables and ensures critical indexes.
- Routing Layer
  - Defines RESTful endpoints for items, masters, suppliers, stock-in, stock-out, dashboard, and monitoring.
- Controller Layer
  - Implements business logic for CRUD operations, transactions, and analytics.
  - Uses GORM for queries and updates, with manual SQL for complex aggregations.
- Models
  - Define JSON and GORM column mappings aligned with legacy table names.

**Section sources**
- [main.go:12-32](file://backend/main.go#L12-L32)
- [database.go:13-83](file://backend/config/database.go#L13-L83)
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)
- [dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [monitoringStockB.go:83-375](file://backend/controllers/monitoringStockB.go#L83-L375)
- [item.go:3-33](file://backend/models/item.go#L3-L33)
- [stockin.go:3-57](file://backend/models/stockin.go#L3-L57)
- [stockout.go:3-60](file://backend/models/stockout.go#L3-L60)
- [supplier.go:3-14](file://backend/models/supplier.go#L3-L14)

## Architecture Overview
The system adheres to MVC:
- Model: GORM-backed structs mapped to legacy MySQL tables.
- View: JSON responses produced by controllers.
- Controller: Orchestrates requests, validates payloads, executes transactions, and returns structured responses.
- Router: Gin routes map HTTP verbs and paths to controller handlers.
- Persistence: GORM handles ORM operations; manual SQL used for analytics and joins.

```mermaid
graph TB
subgraph "HTTP Layer"
R["Gin Router"]
end
subgraph "Application Layer"
C_Item["Item Controller"]
C_Master["Master Controller"]
C_StockIn["Stock-In Controller"]
C_StockOut["Stock-Out Controller"]
C_Supplier["Supplier Controller"]
C_Dashboard["Dashboard Controller"]
C_Monitoring["Monitoring Controller"]
end
subgraph "Persistence Layer"
G["GORM Session"]
DB["MySQL"]
end
R --> C_Item
R --> C_Master
R --> C_StockIn
R --> C_StockOut
R --> C_Supplier
R --> C_Dashboard
R --> C_Monitoring
C_Item --> G
C_Master --> G
C_StockIn --> G
C_StockOut --> G
C_Supplier --> G
C_Dashboard --> G
C_Monitoring --> G
G --> DB
```

**Diagram sources**
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)
- [dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [monitoringStockB.go:83-375](file://backend/controllers/monitoringStockB.go#L83-L375)
- [database.go:13-83](file://backend/config/database.go#L13-L83)

## Detailed Component Analysis

### Database Connection Management and Auto-Migration
- Connection
  - Opens a GORM session to MySQL using a hardcoded DSN.
  - Exposes a global session pointer for use across packages.
- Auto-Migration
  - Migrates core tables during startup.
  - Ensures presence of critical indexes for dashboard and inventory analytics.
- Index Management
  - Utility checks and conditionally creates indexes to optimize analytics queries.

```mermaid
sequenceDiagram
participant Boot as "main.go"
participant DB as "config/database.go"
participant GORM as "GORM"
participant SQL as "MySQL"
Boot->>DB : ConnectDatabase()
DB->>GORM : Open(mysql DSN)
GORM-->>DB : *gorm.DB
DB->>GORM : AutoMigrate(models...)
GORM->>SQL : CREATE TABLE IF NOT EXISTS
DB->>SQL : ensureIndex(idx_rbm_dashboard_recent)
DB->>SQL : ensureIndex(idx_gudangbarang_bangsal_brng)
DB->>SQL : ensureIndex(idx_databarang_expire)
DB->>SQL : ensureIndex(idx_databarang_kode_golongan)
DB-->>Boot : Ready
```

**Diagram sources**
- [main.go:12-32](file://backend/main.go#L12-L32)
- [database.go:13-83](file://backend/config/database.go#L13-L83)

**Section sources**
- [database.go:13-83](file://backend/config/database.go#L13-L83)
- [main.go:12-32](file://backend/main.go#L12-L32)

### Routing Structure and Middleware
- Routes
  - Register GET/POST/PUT/DELETE endpoints under /api for items, masters, suppliers, stock-in, stock-out, dashboard, and monitoring.
- Middleware
  - CORS enabled globally via default Gin router.
  - No additional middleware registered in the bootstrap.

```mermaid
flowchart TD
Start(["Startup"]) --> CORS["Enable CORS"]
CORS --> MountRoutes["Mount Routes"]
MountRoutes --> Items["GET/POST/PUT/DELETE /api/items/*"]
MountRoutes --> Masters["GET/POST/PUT/DELETE /api/masters/*"]
MountRoutes --> Suppliers["GET/POST/PUT/DELETE /api/suppliers/*"]
MountRoutes --> StockIn["GET/POST /api/stock-in/*"]
MountRoutes --> StockOut["GET/POST /api/stock-out/*"]
MountRoutes --> Dashboard["GET /api/dashboard"]
MountRoutes --> Monitoring["GET /api/monitoring-stock*"]
Items --> Handlers["Controller Handlers"]
Masters --> Handlers
Suppliers --> Handlers
StockIn --> Handlers
StockOut --> Handlers
Dashboard --> Handlers
Monitoring --> Handlers
```

**Diagram sources**
- [main.go:15-24](file://backend/main.go#L15-L24)
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)

**Section sources**
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)
- [main.go:15-24](file://backend/main.go#L15-L24)

### Controller-Layer Business Logic Organization
- Item Management
  - Fetch single item with extensive joins and computed fields.
  - List items with pagination-like grouping and optional search.
  - Update and delete with barcode synchronization and cascading deletes.
- Master Data
  - Generic master endpoints for golongan, jenis, satuan with dynamic table resolution.
  - Validation and CRUD with duplicate checks.
- Stock Operations
  - Stock-in: transactional updates to gudangbarang, data_batch, riwayat_barang_medis; supports price and expiry updates.
  - Stock-out: transactional deduction with batch selection and history logging.
- Suppliers
  - CRUD for supplier entities backed by industrifarmasi table.
- Dashboard
  - Concurrent aggregation of summary metrics, expiry stats, distribution, location stock, movement, and recent activities with in-process caching.
- Monitoring
  - Period-aware stock monitoring with thresholds, turnover, and coverage calculations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Router as "Gin Router"
participant Ctrl as "StockIn Controller"
participant DB as "GORM/MySQL"
Client->>Router : POST /api/stock-in
Router->>Ctrl : AddStockIn(payload)
Ctrl->>Ctrl : Validate payload
Ctrl->>DB : Begin transaction
Ctrl->>DB : Query gudangbarang (stok awal)
Ctrl->>DB : Update/Create gudangbarang (stok akhir)
Ctrl->>DB : Snapshot prices from databarang
Ctrl->>DB : Upsert data_batch
Ctrl->>DB : Insert riwayat_barang_medis
DB-->>Ctrl : Commit
Ctrl-->>Client : 201 Created (data)
```

**Diagram sources**
- [stockInController.go:235-383](file://backend/controllers/stockInController.go#L235-L383)
- [routes.go:29](file://backend/routes/routes.go#L29)

**Section sources**
- [itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [masterController.go:51-206](file://backend/controllers/masterController.go#L51-L206)
- [stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [supplierController.go:10-80](file://backend/controllers/supplierController.go#L10-L80)
- [dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [monitoringStockB.go:83-375](file://backend/controllers/monitoringStockB.go#L83-L375)

### Model Relationships and Data Flow
- Models
  - Item: maps to databarang with joined fields for supplier, unit, category, and batch info.
  - StockIn/StockOut: DTOs for item search, history, summaries, and payloads.
  - Supplier: maps to industrifarmasi.
- Data Flow
  - Controllers issue GORM queries and raw SQL to legacy tables (databarang, gudangbarang, data_batch, riwayat_barang_medis, kodesatuan, jenis, golongan_barang, barcode_obat, industrifarmasi).
  - Transactions ensure atomicity for stock movements.

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
GUDANGBARANG {
varchar kode_brng FK
varchar kd_bangsal
float stok
varchar no_batch
varchar no_faktur
}
DATA_BATCH {
varchar no_batch
varchar kode_brng FK
date tgl_beli
date tgl_kadaluarsa
varchar no_faktur
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
varchar kode_brng FK
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
KODESATUAN {
varchar kode_sat PK
varchar satuan
}
JENIS {
varchar kdjns PK
varchar nama
}
GOLONGAN_BARANG {
varchar kode PK
varchar nama
}
BARCODE_OBAT {
varchar kode_brng FK
varchar barcode
}
INDUSTRI_FARMASI {
varchar kode_industri PK
varchar nama_industri
varchar alamat
varchar kota
varchar no_telp
}
DATABARANG ||--o{ GUDANGBARANG : "has stock"
DATABARANG ||--o{ DATA_BATCH : "batch records"
DATABARANG ||--o{ RIWAYAT_BARANG_MEDIS : "transactions"
DATABARANG }o--|| KODESATUAN : "unit"
DATABARANG }o--|| JENIS : "type"
DATABARANG }o--|| GOLONGAN_BARANG : "category"
DATABARANG }o--|| BARCODE_OBAT : "barcode"
DATABARANG }o--|| INDUSTRI_FARMASI : "supplier"
```

**Diagram sources**
- [item.go:3-33](file://backend/models/item.go#L3-L33)
- [stockin.go:3-57](file://backend/models/stockin.go#L3-L57)
- [stockout.go:3-60](file://backend/models/stockout.go#L3-L60)
- [supplier.go:3-14](file://backend/models/supplier.go#L3-L14)
- [itemController.go:22-284](file://backend/controllers/itemController.go#L22-L284)
- [stockInController.go:13-383](file://backend/controllers/stockInController.go#L13-L383)
- [stockOutController.go:13-349](file://backend/controllers/stockOutController.go#L13-L349)
- [dashboard.go:43-305](file://backend/controllers/dashboard.go#L43-L305)
- [monitoringStockB.go:83-375](file://backend/controllers/monitoringStockB.go#L83-L375)

**Section sources**
- [item.go:3-33](file://backend/models/item.go#L3-L33)
- [stockin.go:3-57](file://backend/models/stockin.go#L3-L57)
- [stockout.go:3-60](file://backend/models/stockout.go#L3-L60)
- [supplier.go:3-14](file://backend/models/supplier.go#L3-L14)

### API Endpoint Structure
- Items
  - GET /api/items
  - POST /api/items
  - GET /api/items/:kodeBrng
  - PUT /api/items/:kodeBrng
  - DELETE /api/items/:kodeBrng
- Masters
  - GET /api/masters
  - POST /api/masters/:type
  - PUT /api/masters/:type/:code
  - DELETE /api/masters/:type/:code
- Suppliers
  - GET /api/suppliers
  - POST /api/suppliers
  - PUT /api/suppliers/:id
  - DELETE /api/suppliers/:id
- Stock-In
  - GET /api/stock-in/items
  - GET /api/stock-in/recent
  - GET /api/stock-in/history
  - POST /api/stock-in
- Stock-Out
  - GET /api/stock-out/items
  - GET /api/stock-out/batches
  - GET /api/stock-out/recent
  - GET /api/stock-out/history
  - POST /api/stock-out
- Dashboard
  - GET /api/dashboard
- Monitoring
  - GET /api/monitoring-stock
  - GET /api/monitoring-stock/details

**Section sources**
- [routes.go:9-35](file://backend/routes/routes.go#L9-L35)

## Dependency Analysis
- Internal Dependencies
  - main.go depends on config, models, and routes.
  - routes.go depends on controllers.
  - controllers depend on config.SIK and models.
- External Dependencies
  - Gin for HTTP routing and middleware.
  - GORM with MySQL driver for ORM.
  - MySQL driver for database connectivity.

```mermaid
graph LR
main_go["backend/main.go"] --> routes_go["backend/routes/routes.go"]
routes_go --> controllers["backend/controllers/*.go"]
controllers --> config_db["backend/config/database.go"]
controllers --> models["backend/models/*.go"]
main_go --> gin["github.com/gin-gonic/gin"]
config_db --> gorm["gorm.io/gorm"]
gorm --> mysql_driver["gorm.io/driver/mysql"]
```

**Diagram sources**
- [main.go:3-10](file://backend/main.go#L3-L10)
- [routes.go:3-7](file://backend/routes/routes.go#L3-L7)
- [database.go:3-9](file://backend/config/database.go#L3-L9)
- [go.mod:5-44](file://backend/go.mod#L5-L44)

**Section sources**
- [go.mod:5-44](file://backend/go.mod#L5-L44)
- [main.go:3-10](file://backend/main.go#L3-L10)
- [routes.go:3-7](file://backend/routes/routes.go#L3-L7)
- [database.go:3-9](file://backend/config/database.go#L3-L9)

## Performance Considerations
- Concurrency and Caching
  - Dashboard controller uses goroutines to parallelize multiple analytics queries and caches responses with TTL to reduce repeated heavy computations.
- Query Optimization
  - Pre-aggregations and indexed views (e.g., gudang AP stock join) minimize expensive joins and improve throughput.
  - Index creation for dashboard and inventory analytics ensures fast filtering and sorting.
- Pagination and Limits
  - Stock history endpoints support page and limit parameters with enforced upper bounds to prevent excessive loads.
- Transactional Integrity
  - Stock-in and stock-out operations wrap multiple writes in a single transaction to maintain consistency and rollback on errors.
- Manual SQL for Analytics
  - Controllers use raw SQL for complex aggregations and time-series analytics to leverage database capabilities efficiently.

**Section sources**
- [dashboard.go:27-305](file://backend/controllers/dashboard.go#L27-L305)
- [stockInController.go:248-383](file://backend/controllers/stockInController.go#L248-L383)
- [stockOutController.go:201-349](file://backend/controllers/stockOutController.go#L201-L349)
- [stockQuery.go:5-15](file://backend/controllers/stockQuery.go#L5-L15)
- [database.go:50-83](file://backend/config/database.go#L50-L83)

## Troubleshooting Guide
- Database Connectivity
  - Verify DSN correctness and network access to MySQL.
  - Check for panic on connection failure during startup.
- Migration Failures
  - Review migration logs and ensure target tables are writable.
  - Confirm index creation does not conflict with existing definitions.
- Controller Errors
  - Binding errors return 400 with error details.
  - Transaction rollbacks on constraint violations or insufficient stock.
  - Analytics queries return 500 with detailed error messages when aggregation fails.
- CORS Issues
  - Ensure client requests include appropriate headers; CORS is enabled globally.

**Section sources**
- [database.go:13-83](file://backend/config/database.go#L13-L83)
- [itemController.go:221-225](file://backend/controllers/itemController.go#L221-L225)
- [stockInController.go:248-272](file://backend/controllers/stockInController.go#L248-L272)
- [stockOutController.go:201-234](file://backend/controllers/stockOutController.go#L201-L234)

## Conclusion
The PPA backend employs a clean MVC separation with Gin and GORM, targeting a legacy MySQL schema. It emphasizes transactional integrity for stock operations, concurrent analytics for dashboards, and pragmatic SQL for performance-critical queries. The architecture balances simplicity with robustness, enabling scalable enhancements through modular controllers and reusable query helpers.

## Appendices

### Security Considerations
- Transport Security
  - Deploy behind TLS termination (not shown here) to encrypt traffic.
- Input Validation
  - Controllers validate payloads and enforce constraints (e.g., positive quantities, required fields).
- Access Control
  - No authentication/authorization middleware is present; consider adding JWT/session middleware and route guards as needed.

### Scalability Recommendations
- Horizontal Scaling
  - Stateless controllers; scale out behind a load balancer.
- Database Scaling
  - Add read replicas for analytics-heavy endpoints; partition large tables if growth demands.
- Caching
  - Expand cache coverage for frequently accessed lists and dashboards.
- Observability
  - Instrument endpoints with metrics and structured logs for latency and error rates.