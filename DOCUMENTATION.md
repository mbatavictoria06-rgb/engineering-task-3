# Product Engineering Task 3 — API Design and Data Modeling

## 1. Project Overview

The **Handmade Fashion Marketplace** is a platform connecting independent artisans and creators with customers looking for unique, handmade clothing and accessories. 

**Problem it solves:** Independent creators often struggle with the technical overhead of running a bespoke e-commerce site, while buyers struggle to discover decentralized creators. This marketplace centralizes discovery, inventory management, and order tracking.

**Scope:** The scope of this design includes user management, product listing creation, inventory tracking, order placement, order lifecycle management (state machine), and post-purchase reviews.

**Out of Scope:** Payment processing and transaction capturing are intentionally outside the scope of this project. Order state transitions omit payment authorization logic.

**Distinction from simple CRUD:** Unlike a basic CRUD app, this system relies on strict transactional boundaries, historical immutability (e.g., locking purchase prices separate from active listing prices), deliberate data denormalization for read-path optimization, strict concurrency protection (idempotency keys), and a rigidly enforced state machine for order fulfillment.

---

## 2. Requirements

### 2.1 What the Product Does
The product facilitates a two-sided marketplace. Sellers list handcrafted items with specific inventory counts. Buyers can browse these listings, place them into an order, track the shipment lifecycle of that order, and leave quality reviews on completed purchases.

### 2.2 Users
* **Buyer**: Responsible for browsing, purchasing, and reviewing items.
* **Seller**: Responsible for maintaining storefront details, managing product listings (titles, pricing, and available inventory), and updating order shipment statuses.

### 2.3 Five Core User Actions

#### 1. Buyer browses and filters listings
* **Actor:** Buyer
* **Goal:** Discover items to purchase based on category or availability.
* **Required data:** Category filter, pagination offset.
* **Expected outcome:** A paginated list of active listings with `quantity_available > 0`.
* **Important business rules:** Listings with 0 quantity or that are soft-deleted should not be displayed in browse views.

#### 2. Seller creates/updates a listing
* **Actor:** Seller
* **Goal:** Add new products or modify existing prices and inventory.
* **Required data:** Title, description, minor-unit price, currency, available quantity, category.
* **Expected outcome:** The catalog is updated, and buyers can immediately see the new/updated listing.
* **Important business rules:** Price must be positive. Quantity cannot be negative.

#### 3. Buyer places an order
* **Actor:** Buyer
* **Goal:** Purchase one or more listings.
* **Required data:** Buyer ID, Listing IDs, quantities, idempotency key.
* **Expected outcome:** A new `Order` is created, `OrderItem`s are attached, and inventory on `Listing` is decremented.
* **Important business rules:** Must be idempotent to prevent double-charging network retries. Cannot purchase more than `quantity_available`.

#### 4. Buyer views order status/history
* **Actor:** Buyer
* **Goal:** Check if their items have shipped or arrived.
* **Required data:** Buyer ID.
* **Expected outcome:** A chronological list of past and present orders with their current statuses and total amounts.
* **Important business rules:** Must be fast to load (read-optimized).

#### 5. Buyer reviews a completed order
* **Actor:** Buyer
* **Goal:** Leave feedback to help other buyers.
* **Required data:** Order ID, Listing ID, rating (1-5), optional comment.
* **Expected outcome:** A review is attached to the listing.
* **Important business rules:** A buyer can only review an item they actually purchased, and only if the order is `DELIVERED`. Only one review per buyer per listing.

---

## 3. Data Model

### 3.1 Entity Overview

| Entity | Purpose | Identifier | Important Relationships |
|--------|---------|------------|-------------------------|
| **Buyer** | Represents a purchasing customer. | `id` (UUID) | 1:N with Order, 1:N with Review |
| **Seller** | Represents an artisan storefront. | `id` (UUID) | 1:N with Listing |
| **Listing** | Represents a sellable product. | `id` (UUID) | 1:N with OrderItem, 1:N with Review |
| **Order** | Represents a purchase transaction. | `id` (UUID) | 1:N with OrderItem |
| **OrderItem** | A specific line-item in an Order. | `id` (UUID) | N:1 with Order, N:1 with Listing |
| **Review** | Feedback left by a Buyer. | `id` (UUID) | N:1 with Buyer, N:1 with Listing |

### 3.2 Detailed Entity Definitions

#### Buyer
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Uniquely identifies a buyer. |
| `name` | String | Yes | No | - | Display name. |
| `email` | String | Yes | Yes | - | Login and communication. |
| `created_at` | DateTime | Yes | No | - | Audit trail. |
| `updated_at` | DateTime | Yes | No | - | Audit trail. |
| `deleted_at` | DateTime | No | No | - | Soft deletion flag. |

#### Seller
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Uniquely identifies a seller. |
| `name` | String | Yes | No | - | Personal name. |
| `email` | String | Yes | Yes | - | Login and communication. |
| `store_name` | String | Yes | No | - | Public-facing brand name. |
| `created_at` | DateTime | Yes | No | - | Audit trail. |
| `updated_at` | DateTime | Yes | No | - | Audit trail. |
| `deleted_at` | DateTime | No | No | - | Soft deletion flag. |

#### Listing
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Uniquely identifies a product. |
| `seller_id` | UUID | Yes | No | FK (Seller) | Links product to creator. |
| `title` | String | Yes | No | - | Display title. |
| `description` | String | No | No | - | Detailed text. |
| `price_minor` | Int | Yes | No | - | Cost in minor units (e.g. cents). |
| `currency` | String | Yes | No | - | e.g. "USD". |
| `quantity_available`| Int | Yes | No | - | Current stock. |
| `category` | String | No | No | - | Grouping for browse filters. |
| `created_at` | DateTime | Yes | No | - | Sorting/Audit. |
| `updated_at` | DateTime | Yes | No | - | Sorting/Audit. |
| `deleted_at` | DateTime | No | No | - | Soft deletion flag. |

#### Order
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Uniquely identifies a transaction. |
| `buyer_id` | UUID | Yes | No | FK (Buyer) | Customer who placed order. |
| `status` | Enum | Yes | No | - | PENDING, PROCESSING, etc. |
| `total_amount_minor`| Int | Yes | No | - | Pre-calculated total cost. |
| `currency` | String | Yes | No | - | e.g. "USD". |
| `idempotency_key` | String | Yes | Yes | - | Prevents duplicate charges. |
| `created_at` | DateTime | Yes | No | - | Sorting/Audit. |
| `updated_at` | DateTime | Yes | No | - | Audit trail. |

#### OrderItem
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Line item ID. |
| `order_id` | UUID | Yes | No | FK (Order) | Parent order. |
| `listing_id` | UUID | Yes | No | FK (Listing) | Product purchased. |
| `quantity` | Int | Yes | No | - | Amount purchased. |
| `price_at_purchase_minor`| Int | Yes | No | - | Locked historical price. |
| `currency` | String | Yes | No | - | e.g. "USD". |
| `created_at` | DateTime | Yes | No | - | Audit trail. |
| `updated_at` | DateTime | Yes | No | - | Audit trail. |

#### Review
| Field | Type | Required | Unique | Identifier/FK | Purpose |
|-------|------|----------|--------|---------------|---------|
| `id` | UUID | Yes | Yes | PK | Review identifier. |
| `buyer_id` | UUID | Yes | No | FK (Buyer) | Customer writing review. |
| `listing_id` | UUID | Yes | No | FK (Listing) | Product being reviewed. |
| `rating` | Int | Yes | No | - | Score (1-5). |
| `comment` | String | No | No | - | Optional text. |
| `created_at` | DateTime | Yes | No | - | Sorting/Audit. |
| `updated_at` | DateTime | Yes | No | - | Audit trail. |
| `deleted_at` | DateTime | No | No | - | Soft deletion flag. |

### 3.3 Relationships and Cardinality

* **Buyer → Order (1:N)**: A buyer can place many orders over time.
* **Buyer → Review (1:N)**: A buyer can leave many reviews.
* **Seller → Listing (1:N)**: A seller creates many listings for their store.
* **Order → OrderItem (1:N)**: A single cart/checkout creates one Order containing multiple line items.
* **Listing → OrderItem (1:N)**: A popular listing will be purchased by many buyers, generating many order items across different orders.
* **Listing → Review (1:N)**: A listing accumulates reviews from multiple buyers.

**Why Order and Listing form a Many-to-Many via OrderItem:**
An `Order` cannot belong to a single `Listing` because a buyer might purchase three different hats in one checkout. A `Listing` cannot belong to a single `Order` because multiple buyers will buy the same popular hat over time. The `OrderItem` table resolves this Many-to-Many by acting as the associative bridge, capturing the specific quantity and price *at the exact moment* that specific buyer purchased that specific listing.

### 3.4 Identifier Strategy
All entities use universally unique identifiers (**UUIDs**).
* **Generation**: Handled via PostgreSQL default `gen_random_uuid()`.
* **Why not sequential IDs?**: Sequential integers (e.g. `1, 2, 3`) allow competitors to execute enumeration attacks (Insecure Direct Object Reference). A competitor could see `Order #1050` and deduce the platform's exact sales volume, or scrape all user profiles by incrementing a loop. UUIDs are mathematically unguessable.

### 3.5 ER Diagram
Reference: [evidence/01-erd.png](evidence/01-erd.png)

---

## 4. Hard Data-Modeling Questions

### 4.1 Normalization
Most data is stored in strict 3rd Normal Form (3NF). A fact lives in exactly one place (e.g., a buyer's email is only on the `Buyer` table). This prevents update anomalies where changing a fact in one table requires hunting down scattered duplicates. 

### 4.2 Deliberate Denormalization
Two strict exceptions to 3NF were implemented for read-heavy performance optimization:

1. **`Order.total_amount_minor`**
   * **What is duplicated:** The mathematical sum of all child `OrderItem.quantity * price_at_purchase_minor`.
   * **Why it exists:** Rendering a user's "Order History" page requires showing the total cost of each order.
   * **Performance Benefit:** Prevents executing an expensive `SUM()` aggregation join across millions of `OrderItem` rows every time an order list is viewed.
   * **Consistency Risk:** If an `OrderItem` is added/removed after creation, the total drifts out of sync.
   * **How consistency is maintained:** Orders are treated as immutable after checkout creation. Application logic prohibits altering order items after the transaction commits.

2. **`Listing.quantity_available`**
   * **What is duplicated:** The net sum of total initial inventory minus all quantities sold in `OrderItem`s.
   * **Why it exists:** The highest-traffic action on the platform is "Buyer browses listings," which must filter out out-of-stock items.
   * **Performance Benefit:** Prevents querying the entire order history of a product just to determine if it can be shown on the homepage.
   * **Consistency Risk:** Race conditions during checkout could result in overselling or drift between actual stock and displayed stock.
   * **How consistency is maintained:** Inventory deductions occur inside strict database transactions during order placement. The `CHECK (quantity_available >= 0)` constraint guarantees the database will instantly reject a transaction that attempts to oversell the denormalized value.

### 4.3 Money Representation
* **Minor Units / Integer Storage**: Financial values are stored as integers (`price_minor`) representing the smallest denomination (e.g., cents). 
* **Currency Column**: Accompanies the amount to provide explicit ISO context (e.g., "USD").
* **Why avoid floating-point?**: Floats introduce binary rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`), which is unacceptable for financial data.
* **Why historical `OrderItem` price is preserved:** `Listing.price_minor` can be updated by the seller at any time. `OrderItem.price_at_purchase_minor` acts as an immutable snapshot of the price at the moment of checkout, ensuring historical receipts never alter.

### 4.4 Order State Machine

| Status | Allowed Transitions To | Forbidden Transitions | Terminal |
|--------|-----------------------|-----------------------|----------|
| **PENDING** | PROCESSING, CANCELLED | SHIPPED, DELIVERED | No |
| **PROCESSING** | SHIPPED, CANCELLED | PENDING, DELIVERED | No |
| **SHIPPED** | DELIVERED, CANCELLED | PENDING, PROCESSING | No |
| **DELIVERED** | None | PENDING, PROCESSING, SHIPPED, CANCELLED | Yes |
| **CANCELLED** | None | PENDING, PROCESSING, SHIPPED, DELIVERED | Yes |

* **Enforcement mechanism:** The database utilizes a PostgreSQL Enum (`OrderStatus`) restricting values. However, valid *transitions* (e.g., preventing SHIPPED → PROCESSING) are enforced at the application tier prior to the database `UPDATE` query.

Reference: [evidence/02-order-state-machine.png](evidence/02-order-state-machine.png)

### 4.5 Time and Deletion
* **`created_at` / `updated_at`**: Maintained on every entity for chronological sorting and auditability.
* **`deleted_at`**: Supports soft deletion on `Buyer`, `Seller`, `Listing`, and `Review`.
* **Why `Order` and `OrderItem` are not soft-deleted**: Financial and transaction records must never be deleted, even softly, for accounting and legal integrity.
* **Historical preservation**: If a `Listing` is soft-deleted, it vanishes from the browse API, but past `OrderItem`s referencing it remain perfectly intact, allowing a buyer's order history to render flawlessly.

### 4.6 Constraints

| Entity | Constraint | Type | Invalid state prevented | Enforcement |
|--------|------------|------|-------------------------|-------------|
| Buyer | `Buyer_pkey` | PK | Duplicate/Null IDs | PostgreSQL |
| Buyer | `Buyer_email_key` | UNIQUE | Duplicate accounts | PostgreSQL |
| Listing | `listing_price_minor_positive` | CHECK | Negative product pricing | PostgreSQL |
| Listing | `listing_quantity_available_nonnegative` | CHECK | Overselling / negative inventory | PostgreSQL |
| Order | `Order_idempotency_key_key` | UNIQUE | Duplicate identical checkouts | PostgreSQL |
| OrderItem | `order_item_quantity_positive` | CHECK | Checking out with 0 items | PostgreSQL |
| OrderItem | `order_item_price_minor_positive`| CHECK | Negative receipt prices | PostgreSQL |
| Review | `review_rating_valid` | CHECK | Ratings outside 1-5 boundary | PostgreSQL |
| Review | `Review_buyer_id_listing_id_key` | UNIQUE | Spamming multiple reviews per listing | PostgreSQL |
| (All) | Foreign Keys | FK | Orphaned relationships | PostgreSQL |

### 4.7 Index Strategy

| Core action | Query pattern | Index | Why it helps |
|-------------|---------------|-------|--------------|
| Browse listings | `WHERE category = ? ORDER BY created_at` | `Listing_category_created_at_idx` | Avoids sequential scanning the entire catalog; sorts natively on the B-Tree. |
| View order history | `WHERE buyer_id = ? ORDER BY created_at` | `Order_buyer_id_created_at_idx` | Instantly retrieves a user's past orders chronologically without full table scans. |
| View reviews | `JOIN ON listing_id WHERE order_id = ?` | `OrderItem_order_id_listing_id_idx` | Accelerates the join resolution needed to verify a buyer actually purchased an item before allowing a review. |

**Why not index every column?**
Indexes consume disk space and slow down writes (`INSERT`, `UPDATE`, `DELETE`) because the B-Tree must be rebalanced on every mutation. We heavily index read-patterns and strategically omit indexes on volatile or low-cardinality columns (like `status`).

---

## 5. API Design

### 5.1 API Principles
* **REST**: Representational State Transfer mapping entities to standard URIs.
* **Versioning**: Base paths use `/api/v1` to allow non-breaking future upgrades.
* **JSON**: Strictly `application/json` for requests and responses.
* **Consistent Error Contract**: All errors follow an exact schema envelope.
* **Idempotency**: Critical mutations support safe retries via headers.
* **Pagination, Filtering, Sorting**: Standardized query parameters (e.g., `?page=1&limit=20&sort=-created_at`).

### 5.2 Error Contract
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "quantity must be greater than 0",
    "details": { "field": "quantity" }
  }
}
```
* **400 Bad Request**: Malformed JSON, missing fields, or validation failures (e.g., rating = 6).
* **404 Not Found**: Entity (UUID) does not exist or is soft-deleted.
* **409 Conflict**: State machine transition violation or unique constraint violation (e.g., double review).
* **422 Unprocessable Entity**: Business rule violation (e.g., insufficient stock).
* **500 Internal Server Error**: Unhandled crashes or database connection drops.

### 5.3 Pagination Contract
**Request**: `GET /api/v1/listings?limit=20&offset=40`
**Response**:
```json
{
  "data": [ { ... } ],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_next": true
  }
}
```

### 5.4 Entity Operations Overview

| Entity | Method | Path | Purpose | Request | Response | Idempotent |
|--------|--------|------|---------|---------|----------|------------|
| Listing| GET | `/v1/listings` | Browse | Filters via query args | `List<Listing>` | Yes (Safe) |
| Listing| POST | `/v1/listings` | Create | Listing body | `Listing` | No |
| Listing| PATCH | `/v1/listings/:id` | Update | Partial body | `Listing` | Yes |
| Order | POST | `/v1/orders` | Checkout| Items + quantities | `Order` | **Yes (via Header)** |
| Order | GET | `/v1/orders` | History | Query args | `List<Order>` | Yes (Safe) |
| Review | POST | `/v1/listings/:id/reviews` | Review | Rating + Comment | `Review` | Yes (via UNIQUE) |

*Note: Orders and OrderItems do not expose `PATCH` or `DELETE` endpoints, strictly adhering to transaction immutability rules.*

### 5.5 Five Core Actions (API Deep Dive)

#### 1. Buyer browses and filters listings
* **Endpoint:** `GET /api/v1/listings?category=Accessories&sort=-created_at`
* **Request Example:** N/A (GET)
* **Response Example:** `{ "data": [{ "id": "...", "title": "Scarf", "price_minor": 2500 }] }`
* **Success Status:** 200 OK
* **Errors:** 400 (Invalid sort param)
* **Idempotency:** Safe.
* **Relevant Indexes:** `Listing_category_created_at_idx`

#### 2. Seller creates/updates a listing
* **Endpoint:** `PATCH /api/v1/listings/:id`
* **Request Example:** `{ "price_minor": 2000, "quantity_available": 15 }`
* **Response Example:** `{ "id": "...", "price_minor": 2000 }`
* **Success Status:** 200 OK
* **Errors:** 404 (Not Found), 400 (Validation `listing_price_minor_positive`)
* **Idempotency:** Yes.

#### 3. Buyer places an order
* **Endpoint:** `POST /api/v1/orders`
* **Request Example:** `{ "items": [ { "listing_id": "...", "quantity": 1 } ] }` (Header: `Idempotency-Key: uuid-string`)
* **Response Example:** `{ "id": "...", "status": "PENDING", "total_amount_minor": 2500 }`
* **Success Status:** 201 Created
* **Errors:** 422 (Out of stock), 409 (Idempotency conflict)
* **Relevant Constraints:** `Order_idempotency_key_key`, `listing_quantity_available_nonnegative`

#### 4. Buyer views order status/history
* **Endpoint:** `GET /api/v1/orders`
* **Request Example:** N/A (Authorization identifies buyer)
* **Response Example:** `{ "data": [ { "id": "...", "status": "SHIPPED", "total_amount_minor": 4500 } ] }`
* **Success Status:** 200 OK
* **Relevant Indexes:** `Order_buyer_id_created_at_idx`

#### 5. Buyer reviews a completed order
* **Endpoint:** `POST /api/v1/listings/:id/reviews`
* **Request Example:** `{ "rating": 5, "comment": "Great!" }`
* **Response Example:** `{ "id": "...", "rating": 5 }`
* **Success Status:** 201 Created
* **Errors:** 403 (Did not purchase), 409 (Already reviewed), 400 (Invalid rating)
* **Relevant Constraints:** `Review_buyer_id_listing_id_key`, `review_rating_valid`

---

## 6. Idempotency

**Why Order Creation Needs It:**
Mobile clients traversing unstable networks (e.g., trains, tunnels) often experience timeouts after sending a `POST /api/v1/orders` request. If the client retries, they risk creating a duplicate order, draining inventory twice, and double-billing. 

**Mechanism:**
1. The client generates a UUID and sends it in the `Idempotency-Key` header.
2. The server attempts to map it to the database `Order.idempotency_key` column.
3. Because this column has a `UNIQUE` constraint, a duplicate retry will be instantly rejected by PostgreSQL, preventing the duplicate order creation and redundant stock deduction.
4. *Distinction*: `GET` requests are inherently safe/idempotent. Mutations (`POST`) require explicit architectural idempotency keys.

---

## 7. REST vs GraphQL

### Over-fetching Example
When a mobile app renders a minimal "Order Tracking" screen, it only needs the Order ID and current Status.

**REST Response (Over-fetching):**
```json
{
  "id": "fef415a5-e507-4cf1-a33d-895ba3815465",
  "buyer_id": "7f54e9d3-af94-4b05-915d-0647ba05e256",
  "status": "DELIVERED",
  "total_amount_minor": 4000,
  "currency": "USD",
  "created_at": "2026-09-27T05:47:57.449Z",
  "items": [
    { "listing_id": "...", "quantity": 1, "price": 2000 }
  ]
}
```

**Equivalent GraphQL Query:**
```graphql
query {
  order(id: "fef415a5-e507-4cf1-a33d-895ba3815465") {
    id
    status
  }
}
```

**GraphQL Response:**
```json
{
  "data": {
    "order": {
      "id": "fef415a5-e507-4cf1-a33d-895ba3815465",
      "status": "DELIVERED"
    }
  }
}
```

**Why REST remains the MVP choice:**
REST was selected due to lower infrastructure complexity, excellent native HTTP caching, and ubiquitous tooling. The payload size of an over-fetched order in this domain is currently mere kilobytes, making the performance impact completely negligible.

**When to justify GraphQL later:**
GraphQL will be justified when system signals change: an explosion in client diversity (mobile, tablet, desktop, 3rd party POS), severe bandwidth constraints, or when endpoint maintenance complexity (e.g., maintaining `/v1/orders/minimal`, `/v1/orders/full`) creates excessive technical debt for the backend team.

---

## 8. Real-Time Updates

**Requirement:** Buyers need to be informed when their order transitions from PENDING to PROCESSING to SHIPPED.

**Server-Sent Events (SSE) vs WebSockets:**
WebSockets establish a heavy, full-duplex, bi-directional tunnel. SSE establishes a lightweight, unidirectional (Server → Client) HTTP connection. Because order status updates only ever flow from the backend to the client, SSE is the superior architectural choice, dramatically simplifying load balancing and reconnection logic.

**Example Event payload:**
```json
event: order_status_changed
data: {"order_id": "fef4...", "new_status": "SHIPPED"}
```

---

## 9. Proof the Model Holds

### 9.1 Schema and Migration
The data model was fully implemented using Prisma targeting PostgreSQL, executing schema updates via structured migration files enforcing rigorous Data Definition Language (DDL) constraints.

### 9.2 Seed Dataset
The database successfully accommodated seed data:
* **Buyer**: 2
* **Seller**: 2
* **Listing**: 4
* **Order**: 2
* **OrderItem**: 3
* **Review**: 1

### 9.3 Five Core Queries
1. **Browse**: Successfully retrieved 2 available "Accessories". Proves filtering and sorting.
2. **Seller Listings**: Retrieves a specific seller's catalog. Proves FK integrity.
3. **Checkout Prep**: Retrieves listing inventory/price. Proves read capability prior to mutation.
4. **Order History**: Retrieves buyer's past orders. Proves chronological rendering.
5. **Review Validation**: Joins Order and OrderItem. Proves the system can verify a delivered purchase exists before allowing a review.

### 9.4 Query Plan Evidence
* `evidence/03-query-plan-listings.txt`: Shows PostgreSQL executing a **Bitmap Index Scan** on `Listing_category_created_at_idx`, proving highly optimized catalog browsing.
* `evidence/04-query-plan-review.txt`: Shows a **Bitmap Index Scan** on `Order_buyer_id_created_at_idx` and an **Index Only Scan** on `OrderItem_order_id_listing_id_idx`, proving fast verification of historical purchases.

### 9.5 Rejected Invalid States

The database correctly and actively protected data integrity by explicitly rejecting all three invalid insert attempts via `CHECK` constraints:

| Invalid input | Expected constraint | Actual result | Evidence |
|---------------|---------------------|---------------|----------|
| Listing price = -1 | `listing_price_minor_positive` | Rejected | `evidence/05-invalid-listing-price.txt` |
| OrderItem quantity = 0 | `order_item_quantity_positive` | Rejected | `evidence/06-invalid-orderitem-quantity.txt` |
| Review rating = 6 | `review_rating_valid` | Rejected | `evidence/07-invalid-review-rating.txt` |

---

## 10. Design Defence (Questions an Engineer Could Ask)

1. **Where does one fact live and why?** Facts live in their respective normalized 3NF tables (e.g. buyer names in `Buyer`) to ensure a single source of truth and avoid multi-table update anomalies.
2. **What database constraint prevents negative listing prices?** The PostgreSQL `CHECK` constraint `listing_price_minor_positive`.
3. **What prevents an OrderItem from having zero quantity?** The `CHECK` constraint `order_item_quantity_positive`.
4. **What prevents a review rating outside 1–5?** The `CHECK` constraint `review_rating_valid`.
5. **What prevents duplicate reviews by the same buyer for the same listing?** A composite `UNIQUE` index on `Review(buyer_id, listing_id)`.
6. **Why does OrderItem store price_at_purchase_minor?** To create an immutable receipt. If a seller raises the listing price tomorrow, historical orders must reflect what the user actually paid.
7. **Why does Listing store quantity_available?** Denormalized for read performance. Constantly re-aggregating thousands of order items on every homepage catalog view would be prohibitively slow.
8. **Why does Order store total_amount_minor?** Denormalized to quickly render order history lists for buyers without executing expensive math/joins across all line items.
9. **What prevents invalid Order status values?** The `OrderStatus` database Enum.
10. **How are invalid status transitions prevented?** Transitions (e.g. SHIPPED -> PENDING) are restricted by application-tier logic before the database update executes.
11. **Why are UUIDs used?** To prevent IDOR vulnerabilities and competitor sales-volume scraping via sequential ID guessing.
12. **Why isn’t everything indexed?** Indexes penalize write performance (inserts/updates) and consume RAM/Disk. Only critical, high-volume read access paths are indexed.
13. **Why REST instead of GraphQL for the MVP?** REST is simple, natively cacheable, universally understood, and over-fetching is currently minimal in payload size.
14. **What would justify GraphQL later?** An explosion in client variability (mobile, web, watches, 3rd party integrations) requiring vastly different payloads per screen, resulting in unacceptable endpoint sprawl.
15. **Why SSE instead of WebSockets?** Order updates flow in one direction (Server → Client). SSE handles unidirectional streaming over standard HTTP effortlessly, avoiding the heavy duplex overhead of WebSockets.

---

## 11. Evidence Index

| File | What it Proves |
|------|----------------|
| [evidence/01-erd.png](evidence/01-erd.png) | Data Model requirements, 6 entities, Many-to-Many architecture. |
| [evidence/02-order-state-machine.png](evidence/02-order-state-machine.png) | Order state machine constraints and transitions. |
| [evidence/03-query-plan-listings.txt](evidence/03-query-plan-listings.txt) | Index strategy validation for browsing catalogs. |
| [evidence/04-query-plan-review.txt](evidence/04-query-plan-review.txt) | Index strategy validation for reviewing orders. |
| [evidence/05-invalid-listing-price.txt](evidence/05-invalid-listing-price.txt) | DB level rejection of negative money. |
| [evidence/06-invalid-orderitem-quantity.txt](evidence/06-invalid-orderitem-quantity.txt) | DB level rejection of zero/negative quantities. |
| [evidence/07-invalid-review-rating.txt](evidence/07-invalid-review-rating.txt) | DB level rejection of out-of-bounds ratings. |

---

## 12. Task 3 Completion Checklist

* [x] **What it does / Who uses it / 5 Actions**: Addressed in Sections 1 & 2.
* [x] **Data Model (Entities, Types, Required, UUIDs, Relationships, M:M)**: Addressed in Section 3.
* [x] **Reference to ERD**: Addressed in Section 3.5 & 11.
* [x] **Hard Questions (Normalization, Denormalization, Money, States, Soft Deletes, UUID security, Constraints, Indexes)**: Addressed comprehensively in Section 4.
* [x] **API Design (REST, Versioning, Errors, Pagination, 5 Actions)**: Addressed in Section 5.
* [x] **REST vs GraphQL Analysis**: Addressed in Section 7.
* [x] **Real-time (SSE vs WebSockets)**: Addressed in Section 8.
* [x] **Proof the Model Holds**: Addressed in Section 9.
* [x] **Evidence List**: Addressed in Section 11.
* [x] **Defence / Design Decisions**: Addressed in Section 10.

---

## 13. Conclusion

The Handmade Fashion Marketplace data architecture was designed strictly from business requirements first. Deliberate decisions regarding normalization, identifier strategies, and transactional immutability were made to ensure long-term stability and security. The design was thoroughly tested against real PostgreSQL constraints, proving that the foundation remains highly performant via index optimization and actively resilient against bad data entering the system.
