## Overview

This repository employs a decoupled dependency management strategy across two distinct ecosystems:
- **Backend**: Go Modules (`go.mod`/`go.sum`) for the Gin-based REST API
- **Frontend**: npm with lockfile v3 (`package.json`/`package-lock.json`) for the Next.js application

Each subsystem manages its own dependencies independently, with no shared monorepo tooling or cross-project dependency orchestration.

---

## Backend: Go Modules

### Manifest Files
- `backend/go.mod`: Declares module name `backend`, Go version `1.26.2`, and all direct/indirect dependencies
- `backend/go.sum`: Cryptographic checksums for every dependency version (99 entries), ensuring reproducible builds

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `github.com/gin-gonic/gin` | v1.12.0 | HTTP web framework |
| `gorm.io/gorm` | v1.31.1 | ORM for database operations |
| `gorm.io/driver/mysql` | v1.6.0 | MySQL driver for GORM |
| `github.com/go-sql-driver/mysql` | v1.8.1 | Low-level MySQL driver |
| `github.com/joho/godotenv` | v1.5.1 | `.env` file loading |
| `github.com/gin-contrib/cors` | v1.7.7 | CORS middleware |
| `github.com/go-playground/validator/v10` | v10.30.1 | Request validation |

### Notable Observations
- **All dependencies marked `// indirect`**: The `go.mod` file lists every dependency with the `// indirect` comment, which is atypical. Normally, only transitive dependencies carry this marker. This suggests either:
  - The module was initialized without explicit `go get` commands for top-level imports, or
  - The `go.mod` was regenerated in a way that lost direct/indirect distinction
- **No vendoring**: No `vendor/` directory exists; dependencies are fetched from the public Go module proxy at build time
- **No private registry configuration**: No `GOPRIVATE`, `GONOSUMDB`, or `.netrc` files detected. All dependencies resolve from public sources
- **Environment variables via `.env`**: Database credentials are managed through `backend/.env` (loaded by `godotenv`), not through dependency-managed configuration

---

## Frontend: npm

### Manifest Files
- `frontend/package.json`: Declares project metadata, scripts, and dependency tree
- `frontend/package-lock.json`: Lockfile v3 format with full dependency resolution (7,164 lines, ~700+ resolved packages)

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.6 | React framework (pinned exact) |
| `react` / `react-dom` | 19.2.4 | UI library (pinned exact) |
| `axios` | ^1.16.1 | HTTP client for API calls |
| `recharts` | ^3.8.1 | Charting/visualization |
| `lucide-react` | ^1.16.0 | Icon library |
| `tailwindcss` | ^4.3.0 | CSS framework |
| `eslint` / `eslint-config-next` | ^9 / 16.2.6 | Linting |

### Dependency Resolution Strategy
- **Lockfile v3**: Uses npm's modern lockfile format with improved workspace support and deterministic resolution
- **Public registry**: All packages resolve from `https://registry.npmjs.org/` (visible in `package-lock.json` `resolved` fields)
- **No private registries**: No `.npmrc` file with custom registry configuration detected
- **No workspaces**: Single-package project; no monorepo workspace configuration

### Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## Architecture & Conventions

### Separation of Concerns
- Backend and frontend maintain **completely independent** dependency trees
- No shared `package.json` or root-level dependency orchestration
- Each subsystem can be built, tested, and deployed independently

### Version Pinning Strategy
- **Backend**: Go modules use semantic versioning with implicit minimum versions (e.g., `v1.12.0` means `>=v1.12.0 <v2.0.0`)
- **Frontend**: Mixed strategy:
  - Framework packages (`next`, `react`, `react-dom`) are **pinned to exact versions** (no `^` or `~`)
  - Utility libraries use **caret ranges** (`^`) allowing minor/patch updates

### Reproducibility
- **Backend**: `go.sum` provides cryptographic integrity verification for every dependency
- **Frontend**: `package-lock.json` ensures identical dependency trees across environments

### Missing Practices
- No CI/CD dependency update automation (e.g., Dependabot, Renovate)
- No vulnerability scanning configuration (e.g., `npm audit` scripts, `govulncheck`)
- No vendor directory for offline builds or supply-chain hardening
- No `.npmrc` or Go environment configuration for private package registries

---

## Rules for Developers

1. **Backend dependency changes**:
   - Use `go get <package>@<version>` to add/update dependencies
   - Run `go mod tidy` after modifying imports to clean up `go.mod`/`go.sum`
   - Commit both `go.mod` and `go.sum` together

2. **Frontend dependency changes**:
   - Use `npm install <package>` or `npm install <package>@<version>`
   - Never manually edit `package-lock.json`
   - Commit both `package.json` and `package-lock.json` together

3. **Version pinning**:
   - Keep framework packages (`next`, `react`) pinned to exact versions to avoid breaking changes
   - Use caret ranges (`^`) for utility libraries to receive non-breaking updates

4. **Environment configuration**:
   - Backend secrets (database credentials) are stored in `backend/.env` — ensure this file is in `.gitignore` and never committed
   - Do not store secrets in dependency manifests

5. **No vendoring**:
   - Dependencies are fetched from public registries at build time
   - Ensure network access to `proxy.golang.org` and `registry.npmjs.org` in deployment environments
