# SchoolWear PL Application Technical Overview

## 1. Purpose and Product Context

The SchoolWear PL Application is a Next.js 14 application used to prepare, review, and publish school-specific product lists into BigCommerce. In practice, the application sits between an internal catalog and an external ecommerce platform. Users build a store workspace, select products and designs, review the resulting product list, and then trigger a publish workflow that creates or modifies catalog objects in BigCommerce.

The application serves three main business goals:

1. Allow internal users to create and manage school-specific stores.
2. Translate internal product and design data into BigCommerce-compatible catalog payloads.
3. Maintain an audit trail of what was attempted, created, changed, rejected, or removed.

The codebase combines three responsibilities in one product:

- authenticated internal web UI
- Supabase-backed application and workflow state
- BigCommerce catalog orchestration

This means the system is not only a CRUD frontend. It is also an integration layer, a workflow engine, and an operational reporting tool.

## 2. Technology Stack and Runtime Model

The application is built on the following core stack:

- Next.js 14 with the App Router
- React 18 for UI composition
- TypeScript across the application
- Supabase for authentication, database access, RPCs, storage, and session support
- Zustand for client-side store workspace state
- React Query for server-state caching around product search
- BigCommerce Catalog APIs for category, product, and variant management
- Zod for admin-side product validation

At runtime, the system is split into three execution modes:

### 2.1 Server-rendered application shell

The root layout in `app/layout.tsx` creates the global application shell. It initializes the Supabase server client, reads the current authenticated user, renders the shared header, and wraps the tree with the React Query provider.

This layer is responsible for:

- bootstrapping authenticated rendering
- rendering shared layout, toast notifications, and devtools
- exposing the authenticated user to UI chrome

### 2.2 Middleware-authenticated routing

The middleware in `app/middleware.ts` enforces route protection and admin access rules. It refreshes Supabase sessions using `getUser()`, redirects unauthenticated users to `/login`, and restricts `/admin` and `/api/admin/*` routes to users whose `user_roles` record is `admin`.

This means authorization is not delegated only to the UI. It is enforced at the routing boundary, which is important for both page requests and API routes.

### 2.3 API and service orchestration

The application uses App Router API routes under `app/api/*` for operational workflows such as:

- searching products
- loading initial store state
- creating stores in BigCommerce
- generating signed download URLs
- bulk admin product import

These routes call service modules under `services/*`, handlers under `handlers/*`, and supporting utilities under `utils/*`.

## 3. Core Domain Model

Even though the schema is spread across Supabase tables and TypeScript interfaces, the domain model is fairly consistent. The most important entities are:

### 3.1 Store

A store is the top-level business object. It contains metadata such as:

- `store_code`
- `store_name`
- contact and account manager information
- creation period dates
- workflow status
- BigCommerce category linkage
- `maximum_offset` used for SKU generation continuity

Stores move through statuses such as draft, pending, modify, approved, and disabled.

### 3.2 Design

Designs are associated with a store and act as grouping containers for products and notes. In the UI and reporting flows, products are commonly grouped by `Design_ID`.

### 3.3 Store product selection

The table `stores_products_designs_2` appears to be the core workflow table for selected products. It links:

- store code
- design ID
- source catalog product (`sage_code`)
- naming metadata
- size variations
- workflow status
- BigCommerce identifiers such as `new_product_id` and `new_sku`

This table effectively bridges internal catalog data and external publish state.

### 3.4 Catalog source products

The internal source catalog is read from tables and views such as:

- `new_all_products_4`
- `most_selling_products`
- RPC-backed result sets such as `get_filtered_store_products_v2` and `get_products_to_create_v2`

These source products are normalized into application-level `StoreProduct` and related types before being displayed or transformed into BigCommerce payloads.

## 4. Main User Flows

### 4.1 Authentication and access control

Authentication is handled through Supabase Auth. The login action in `app/login/actions.ts` uses the server-side Supabase client to call `signInWithPassword`. The middleware then determines whether the user may reach the requested route.

Role enforcement works as follows:

- all non-public routes require an authenticated user
- `/admin` and `/api/admin/*` additionally require a `user_roles.role === "admin"`
- store creation permission is slightly broader and is checked in `app/actions/userActions.ts`
- `checkUserCreatePermission()` allows `admin` and `supervisor`

This creates two access boundaries:

- admin-only catalog management
- broader create-store permissions for publishing workflows

### 4.2 Store list and discovery

The store list page in `app/list/page.tsx` loads initial summaries server-side and hands them to the client component `StoreList.tsx`. The client then applies local filtering by store code and store name.

This page is intentionally lightweight:

- server fetch for initial data
- client-side search interaction
- transition-based UI updates

### 4.3 Product selection and store workspace

The page at `app/[store_code]/page.tsx` loads store context and design guidelines, then renders `ProductDisplay`. The exact UI implementation lives in components and hooks, but the architecture is clear:

- store-specific browsing happens under a dynamic route
- products are filtered by design, category, text search, and pagination
- selected products are held in a persisted client-side Zustand store

The key client-side workspace lives in `app/store/useStoreState.ts`.

This Zustand store is the central store-creation workspace and persists:

- current store metadata
- design list
- category list
- grouped added products
- initialization state

Important design decisions in this store:

- it persists enough state to survive navigation
- it explicitly resets when `store_code` changes
- `isInitialized` is intentionally not trusted across reloads
- product categories are derived from the actual selected product set

This is a good example of separating:

- server-backed truth
- local workflow state
- transient hydration state

### 4.4 Product browsing, query state, and caching

The product-search flow uses:

- `lib/products/fetchProducts.ts`
- `app/hooks/useProducts.ts`
- `app/hooks/useProductsQueryState.ts`
- `services/products/productServices.ts`

The request path is:

1. URL search params are normalized into a `ProductsQuery` object.
2. React Query calls `/api/search_products`.
3. The backend delegates to a Supabase RPC (`get_filtered_store_products_v2`).
4. RPC results are normalized into `StoreProduct`.

Notable behavior:

- search state is URL-driven, so the screen is deep-linkable
- changing design or category resets pagination to page 1
- category filters are included in the React Query cache key in sorted order, which avoids duplicate cache entries when the same categories are selected in a different click order
- design ID `"0"` is treated as “no design selected”, and the query is disabled in that case

### 4.5 Report and review workflow

The report screen under `app/[store_code]/report/*` reads the Zustand workspace and gives users a structured review of:

- grouped products by design
- design notes
- categories
- store metadata
- downloadable logs and reports

This screen also supports:

- inline name editing
- report and log retrieval through signed URLs
- rollback of pending modifications via `discardUpdates()`

The rollback path uses a Supabase RPC and is important because “modify” mode is not a purely client-side concept. It represents a database-backed change state that can be reverted.

## 5. BigCommerce Publish Pipeline

The publish pipeline is the most important subsystem in the codebase.

### 5.1 Entry point

The main entry point is `app/api/store_creation/bigcommerce/route.ts`.

This route:

- checks create-store permission
- initializes the logger and report generator
- calls `handleCreateStore()`
- saves logs and reports
- uploads artifacts to Supabase Storage
- returns signed URLs for the generated log and CSV report

A notable operational decision is that logs and reports are persisted both on success and on failure. This is useful in a business workflow where partial results and postmortem visibility matter.

### 5.2 Orchestration

The orchestration logic lives in `handlers/bigcommerce/createStoreHandler.ts`.

The handler performs the following steps:

1. Create the main BigCommerce category/store shell.
2. Fetch the prepared store product set from Supabase.
3. In modify mode, fetch already-created SKUs to avoid duplicates.
4. Create related subcategories.
5. Transform grouped products into BigCommerce operation configs.
6. Process those configs batch by batch.
7. Update store status and offset metadata after successful completion.
8. Finalize logs and report summaries.

This handler distinguishes between different operation categories:

- create product
- remove product
- add variant
- remove variant

The sequence matters:

- product removals occur before creates
- variant removals occur before variant additions

That ordering prevents collisions with stale BigCommerce catalog state.

### 5.3 Product transformation rules

Payload generation happens in `utils/bigcommerce/productMappings.ts`.

This file is effectively the domain translation layer between internal products and BigCommerce payloads. Its responsibilities include:

- grouping related products by type
- reusing or deriving offset numbers for SKU creation
- determining whether a row is new, modified, removed, or already added
- generating full BigCommerce `ProductCreationProps`
- generating variant add/remove payloads for modify flows

A few business rules are especially important:

- products with status `added` are skipped from recreation
- products with status `removed` are converted into delete payloads
- products with status `modify` are converted into variant diff payloads
- size changes are derived by comparing persisted `notes` with current `size_variations`
- SKU continuity depends on `maximum_offset` and previously assigned `new_sku` values

This is the main place where business workflow turns into API intent.

### 5.4 BigCommerce product services

BigCommerce catalog writes are implemented in `services/bigCommerce/products/bigCommerceProductServices.ts`.

These services are responsible for:

- product creation
- product deletion
- variant addition
- variant deletion
- syncing status and identifiers back into Supabase

Important operational behavior:

- most external operations retry up to three times
- duplicate product URL conflicts are treated as non-retriable skips
- deleting a missing product (`404`) is treated as already-synchronized state
- variant creation may create the `Size` option and value on demand if they do not exist yet
- successful creates update `stores_products_designs_2` with `new_product_id`, `new_sku`, and status
- failed creates mark the row as `rejected`

This subsystem is where external side effects and internal workflow state are reconciled.

## 6. Logging, Reporting, and Artifact Persistence

The application has first-class operational reporting support.

### 6.1 StoreCreationLogger

`utils/logging/storeCreationLogger.ts` provides a structured in-memory audit log. It captures:

- timestamps
- severity levels
- messages
- structured details
- final summary statistics

It can also render a human-readable text report. This is useful for both debugging and business review, since non-developer users often need a readable summary of what happened during store creation.

### 6.2 StoreReportGenerator

`utils/reports/storeReportGenerator.ts` creates the CSV-style business report. It stores products grouped by design and can render:

- raw report data
- CSV export
- HTML table output

The report is processed before BigCommerce writes are executed, so it reflects the attempted publish payload, not just successful external outcomes.

### 6.3 Artifact lifecycle

Artifacts are managed via `LogManager` and storage helpers. The flow is:

1. create logger and report generator
2. populate them during orchestration
3. save them to an in-memory manager
4. upload them to Supabase Storage
5. generate signed URLs for download

This gives the application durable, user-downloadable operational evidence for each store creation attempt.

## 7. Admin Catalog Management

The admin subsystem under `app/admin/products/*` supports catalog maintenance outside the main store-publish workflow.

Key capabilities include:

- add a single product
- bulk upload products by CSV
- add color code records
- edit catalog products

The admin actions use:

- `productSchema` for validation and normalization
- `createClientbyRole()` for elevated or role-aware access
- `import_logs` to keep a unified audit trail for admin changes

This is important because the application depends on source catalog quality. If the product base is wrong, the store-publish pipeline will produce invalid or incomplete BigCommerce output.

## 8. Data Access Patterns and Security Model

The codebase uses a mix of direct table queries, RPC calls, and role-aware clients.

### 8.1 Supabase SSR clients

There are separate client factories for:

- browser client
- server client
- admin/service-role client

The server and middleware paths are especially important because auth and RLS are enforced through them.

### 8.2 Role-aware writes

Many server-side mutations use `createClientbyRole()`, which returns:

- a Supabase client
- whether the caller is admin
- the current user ID

This lets the code conditionally apply `user_id` filters when the caller is not admin, which helps satisfy RLS while preserving elevated behavior for administrators.

### 8.3 RPC-heavy workflow queries

Several critical read and mutation flows use Supabase RPC functions, including:

- store category lookup
- discard updates
- product search
- added product initialization
- product-to-create retrieval

This suggests the business logic is split across:

- TypeScript orchestration in the app
- SQL or PL/pgSQL functions in Supabase

Any future documentation or maintenance plan should treat the database RPC layer as part of the application code, even though it is not fully visible in this repository snapshot.

## 9. Architectural Strengths and Risks

### Strengths

- clear separation between UI, services, and integration handlers
- strong workflow orientation around store creation and modification
- practical auditability through logs and reports
- route-level authorization in middleware
- good use of persisted client state for multi-step workflows

### Risks and maintenance concerns

- business logic is distributed between TypeScript and Supabase RPCs, which can make debugging harder without schema-level documentation
- some status transitions are string-based and would benefit from central enums
- BigCommerce payload defaults such as price, inventory, and visibility are currently hard-coded in places
- several files still contain verbose console logging and testing traces
- the root layout fetches `getUser()` on every render path, so external auth connectivity issues affect the whole app

## 10. Recommended Next Documentation Artifacts

This document is a strong starting point, but the next useful artifacts would be:

1. A database schema and RPC catalog.
2. A sequence diagram for the store publish flow.
3. A status-transition matrix for stores and products.
4. A BigCommerce field mapping reference.
5. An operational runbook for failed publishes and rollback behavior.

## 11. Summary

This application is best understood as an internal orchestration platform for schoolwear product-list publishing. Its frontend enables authenticated users to build a store-specific workspace, its Supabase layer persists and secures workflow state, and its BigCommerce services execute the final external catalog changes.

The most important architectural idea is that the system does not publish directly from transient UI state. Instead, it builds a persisted intermediate model of store, design, and product selections; derives a publish plan from that model; then executes BigCommerce operations while logging and reporting every step. That design gives the team traceability, rollback support, and a workable modify flow, which are all essential for a business process that mixes internal review with external catalog mutation.
