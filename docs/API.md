# Algo Rico REST API

All business endpoints require an authenticated session cookie (`algorico.sid`). Mutating business requests also require `x-csrf-token`.

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

Common status codes: `400`, `401`, `403`, `404`, `409`, `413`, `422`, `429`, `500`.

List endpoints return `{ "data": [], "meta": { "page", "pageSize", "total", "totalPages" } }`. Single-resource endpoints return `{ "data": {} }`.

---

## Auth

### `POST /api/auth/login`

Public. Rate-limited.

Body:

```json
{ "email": "owner@algorico.local", "password": "AlgoRicoDev1!" }
```

Response `200`: `{ "data": { "user": { "id", "email", "active", "createdAt", "updatedAt" }, "csrfToken": "..." } }`

Errors: `401` invalid credentials, `429` too many attempts.

### `POST /api/auth/logout`

Auth required. Clears the session cookie. Response `204`.

### `GET /api/auth/me`

Auth required. Response `200` with the current user and CSRF token. Never includes `passwordHash`.

---

## Clients

Search (`q`) matches name, phone, and Instagram username. Default list excludes archived clients.

### `GET /api/clients`

Query: `page`, `pageSize`, `q`, `needsFollowUp=true|false`, `includeArchived=true|false`

### `POST /api/clients`

Body: `name` required; `phone`, `instagramUsername`, `email`, `notes`, `needsFollowUp` optional.

Response `201`.

### `GET /api/clients/:clientId`

Includes `interactionCount`, `orderCount`, `openTaskCount`.

### `PATCH /api/clients/:clientId`

Any subset of client fields. `archived: true` archives the client instead of deleting historical orders.

---

## Interactions

### `GET /api/clients/:clientId/interactions`

Paginated timeline ordered by `occurredAt` descending. Includes attachment metadata.

### `POST /api/clients/:clientId/interactions`

Body: `{ "channel": "WHATSAPP|INSTAGRAM|PHONE|IN_PERSON|OTHER", "content": "...", "occurredAt": "ISO-8601 optional" }`

Creates a client conversation that is not tied to a specific order (`orderId` is `null`).

### `GET /api/orders/:orderId/interactions`

Paginated timeline of conversations tied to that order, ordered by `occurredAt` descending. Includes attachment metadata.

### `POST /api/orders/:orderId/interactions`

Same body as client interactions. The server sets `clientId` from the order and `orderId` to this order. These conversations also appear on the client timeline.

### `GET /api/interactions/:interactionId`

### `PATCH /api/interactions/:interactionId`

### `DELETE /api/interactions/:interactionId`

Deletes metadata in PostgreSQL, then deletes MinIO objects. MinIO failures are logged.

---

## Attachments

An attachment belongs to **either** an interaction **or** a payment, never both. Use interaction attachments for conversation screenshots and cake references. Use payment attachments for transfer receipts and seña proof.

Multipart field name: `files`. Allowed types: `image/jpeg`, `image/png`, `image/webp`.

### `POST /api/interactions/:interactionId/attachments`

Response `201`: array of attachment metadata. Object keys are generated server-side.

### `POST /api/payments/:paymentId/attachments`

Same upload rules as interaction attachments. Use this for transfer receipts, seña screenshots, and other payment proof. The payment (and parent order) responses include these attachments.

### `GET /api/attachments/:attachmentId`

Auth required. Returns metadata plus a short-lived `downloadUrl`. Does not expose MinIO credentials or make files public.

### `DELETE /api/attachments/:attachmentId`

---

## Orders

`totalAmount` is the order's final price. On create it defaults to quantity × item unit prices. Clients may send `totalAmount` to override that sum. Item add/update/delete does not change the order total. Responses include `paidAmount`, `remainingBalance`, and `paymentStatus` (`UNPAID` | `PARTIALLY_PAID` | `PAID`).

Statuses: `LEAD`, `QUOTED`, `AWAITING_DEPOSIT`, `CONFIRMED`, `IN_PRODUCTION`, `READY`, `DELIVERED`, `PICKED_UP`, `COMPLETED`, `CANCELLED`.

Fulfillment: `PICKUP` or `DELIVERY`.

### `GET /api/orders`

Query: `page`, `pageSize`, `status`, `paymentStatus`, `fulfillmentType`, `clientId`, `q` (client search), `from`, `to` (`YYYY-MM-DD` on `eventDate`)

### `POST /api/clients/:clientId/orders`

Body may include `totalAmount` and `items[]` with `description`, `quantity`, and optional `unitPrice`.

### `GET /api/orders/:orderId`

Includes items, payments, client, and payment summary.

### `PATCH /api/orders/:orderId`

Status changes are validated. Pickup orders cannot be `DELIVERED`; delivery orders cannot be `PICKED_UP`. `totalAmount` can be updated; rejected with `409` if it would fall below existing payments.

### `POST /api/orders/:orderId/items`

### `PATCH /api/orders/:orderId/items/:itemId`

### `DELETE /api/orders/:orderId/items/:itemId`

Does not change the order's `totalAmount`.

---

## Payments

Payments are first-class records. There is no `depositAmount` field on the order.

Types: `DEPOSIT`, `FINAL`, `OTHER`. Methods: `CASH`, `BANK_TRANSFER`, `CARD`, `OTHER`.

Registering a `DEPOSIT` on a `LEAD`, `QUOTED`, or `AWAITING_DEPOSIT` order confirms it (`CONFIRMED`). No deposit percentage is hardcoded.

Overpayment returns `409`.

### `GET /api/orders/:orderId/payments`

### `POST /api/orders/:orderId/payments`

Body: `{ "type", "amount", "paymentMethod", "paidAt?", "notes?", "hasPaymentReceipt?" }`

`hasPaymentReceipt` defaults to `false`. It records whether a payment receipt was received and is independent of the optional receipt image.

Response `201` is the updated order, including recalculated payment summary and status.

### `GET /api/payments/:paymentId`

Includes `hasPaymentReceipt` and payment proof attachments.

### `PATCH /api/payments/:paymentId`

Body may include `hasPaymentReceipt`.

### `POST /api/payments/:paymentId/attachments`

See Attachments. Transfer receipts and seña screenshots belong here.

## Tasks

A task may belong to a client, an order, both, or neither.

### `GET /api/tasks`

Query: `page`, `pageSize`, `completed`, `due=overdue|today|upcoming`, `clientId`, `orderId`, `priority`

### `POST /api/tasks`

### `GET /api/tasks/:taskId`

### `PATCH /api/tasks/:taskId`

`completed: true` sets `completedAt`.

### `DELETE /api/tasks/:taskId`

Follow-up clients are explicit: set `needsFollowUp` on the client. The dashboard lists those clients; the API does not infer follow-up from message text.

---

## Dashboard

### `GET /api/dashboard`

Auth required. Returns today's orders (including pickups/deliveries), overdue and due-today tasks, follow-up clients, confirmed/active orders missing dates or delivery details, upcoming orders/tasks, and outstanding balances.

---

## Calendar

### `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`

Optional `includeCancelled=true`. Returns calendar entries with order id, client name, event date/time, fulfillment, status, and payment summary. Queries are indexed on `eventDate`.

---

## Health

### `GET /api/health`

Public. `{ "data": { "status": "ok" } }`
