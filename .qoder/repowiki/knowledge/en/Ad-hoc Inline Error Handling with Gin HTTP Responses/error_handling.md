## Overview

This repository uses an **ad-hoc, inline error handling approach** without any centralized error management system. Errors are handled directly within each controller function using Gin's `c.JSON()` method to return HTTP responses. There is no dedicated error package, no custom error types, no error middleware, and no structured error codes.

---

## Backend (Go/Gin) Error Handling

### Approach: Direct c.JSON() Calls in Controllers

Every controller handles errors by calling `c.JSON(statusCode, gin.H{...})` directly at each error site. The pattern is consistent but decentralized:

```go
if err != nil {
    c.JSON(500, gin.H{"error": "Gagal mengambil data", "detail": err.Error()})
    return
}
```

### Response Structure

Error responses use two formats:

1. **Simple error** — single `"error"` key with a user-facing message:
   ```json
   {"error": "stok tidak mencukupi"}
   ```

2. **Detailed error** — includes both `"error"` (user message) and `"detail"` (raw Go error):
   ```json
   {"error": "Gagal memperbarui stok", "detail": "sql: ..."}
   ```

Success responses use `{"data": ...}` or `{"message": ...}` keys, creating an inconsistent envelope structure across endpoints.

### HTTP Status Code Usage

| Status | Usage |
|--------|-------|
| `200` | Successful GET/PUT/DELETE operations |
| `201` | Successful POST (create) operations |
| `400` | Validation failures, missing fields, invalid parameters, business rule violations (e.g., duplicate barcode, insufficient stock) |
| `404` | Resource not found (item lookup, batch lookup, master record not found) |
| `500` | Database errors, transaction failures, internal server errors |

### Transaction Error Handling

Controllers that use database transactions (`AddItem`, `AddStockIn`, `AddStockOut`) follow this pattern:

1. Begin transaction with `tx := config.SIK.Begin()`
2. Check `tx.Error` immediately after begin
3. On any operation failure: call `tx.Rollback()` then return error response
4. One notable pattern in `AddItem`: a `defer/recover` block catches panics and rolls back:
   ```go
   defer func() {
       if r := recover(); r != nil {
           tx.Rollback()
           panic(r)
       }
   }()
   ```
   This is the **only** panic/recover usage in the entire backend.

### Dashboard Concurrent Error Handling

The `GetDashboard` controller uses goroutines with a `sync.WaitGroup` and a mutex-protected `firstErr` variable to capture the first error from concurrent queries. If any goroutine fails, it returns a 500 response with the captured error.

### What Is Missing

- **No custom error types** — all errors are raw `error` interface values from GORM or Go stdlib
- **No error codes** — no enum or constant-based error classification
- **No error middleware** — `gin.Default()` provides only the default `Recovery()` middleware; no custom error handler is registered via `r.Use()`
- **No centralized error formatting** — each controller constructs its own JSON response
- **No logging of errors** — errors are returned to the client but never logged server-side
- **Some controllers ignore errors** — e.g., `supplierController.go` does not check `config.SIK.Create()` or `config.SIK.Delete()` errors; `DeleteItem` ignores errors from intermediate deletes

---

## Frontend (Next.js/React) Error Handling

### Approach: Inline try-catch with Manual Message Display

The frontend has **no centralized API client**. Each component makes raw `fetch()` calls and handles errors locally:

```typescript
try {
  const res = await fetch(apiUrl("/api/stock-in"), {...});
  const data = await res.json();
  if (!res.ok) {
    showTemporaryMessage(data.error || "Gagal memproses barang masuk");
    return;
  }
} catch (error) {
  console.error(error);
  showTemporaryMessage("Tidak dapat terhubung ke server");
}
```

### Error Presentation

- Errors are displayed as **temporary toast-like banners** rendered conditionally in each component:
  ```tsx
  {message && (
    <div className={`fixed top-6 right-6 ... ${
      message.includes("berhasil") ? "bg-green-500" : "bg-red-500"}`}>
      {message}
    </div>
  )}
  ```
- The `sonner.tsx` component exists (a toast library wrapper) but is **not integrated** into the layout or used anywhere in the codebase.
- No `Toaster` component is rendered in `layout.tsx`.

### What Is Missing

- **No centralized API client** — no axios instance, no fetch wrapper, no request/response interceptors
- **No error boundary** — no React Error Boundary components
- **No global error state** — no context, store, or hook for managing errors
- **No network error differentiation** — all non-OK responses and network failures produce generic messages
- **Silent failures** — some `useEffect` hooks catch errors with only `console.error()` and no user feedback (e.g., `loadRecentStockIn` in `StockIn.tsx`)

---

## Developer Conventions (Observed Patterns)

1. **Always check `err != nil` after GORM operations** and return a `c.JSON` response with an appropriate status code.
2. **Use 400 for validation/business logic errors**, 404 for not-found, 500 for infrastructure/database errors.
3. **Include `"detail": err.Error()`** in 500 responses to expose the raw error for debugging.
4. **Roll back transactions** on any failure before returning an error response.
5. **Frontend**: check `res.ok` after every fetch, parse `data.error` for the message, and catch network errors separately.
6. **Frontend**: use local `useState` for temporary error/success messages with auto-dismiss timers.

---

## Key Files

- `backend/controllers/itemController.go` — representative inline error handling pattern
- `backend/controllers/addItemController.go` — transaction with panic/recover
- `backend/controllers/stockInController.go` — transaction error handling with rollback
- `backend/controllers/dashboard.go` — concurrent error aggregation pattern
- `backend/controllers/supplierController.go` — example of missing error checks
- `frontend/src/components/pages/StockIn.tsx` — frontend fetch error handling pattern
- `frontend/src/components/pages/AddItem.tsx` — frontend form submission error handling
- `frontend/src/lib/api.ts` — URL builder only, no error handling
- `frontend/src/components/ui/sonner.tsx` — unused toast component