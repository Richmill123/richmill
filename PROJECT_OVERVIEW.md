# Rice Mill Management System — Backend Server

## Table of Contents
1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Authentication](#authentication)
5. [API Reference](#api-reference)
   - [Admin APIs](#admin-apis)
   - [Employee APIs](#employee-apis)
   - [Order APIs](#order-apis)
   - [Sale APIs](#sale-apis)
   - [Wage APIs](#wage-apis)
   - [Stock APIs](#stock-apis)
   - [Expense APIs](#expense-apis)
   - [Income APIs](#income-apis)
   - [Purchase APIs](#purchase-apis)
   - [Billing APIs](#billing-apis)
   - [Preference APIs](#preference-apis)
6. [Security Features](#security-features)
7. [Error Responses](#error-responses)

---

## Project Structure

```
rice-mill-server/
├── src/
│   ├── app.js                          # Express app entry point
│   ├── config/
│   │   ├── db.js                       # MongoDB connection & index setup
│   │   ├── database.js                 # Enhanced production DB config
│   │   └── security.js                 # Helmet, CORS, rate limiting, sanitization
│   ├── controllers/
│   │   ├── adminController.js          # Admin CRUD + auth + dashboard
│   │   ├── employeeController.js       # Employee CRUD
│   │   ├── orderController.js          # Order CRUD
│   │   ├── saleController.js           # Sale CRUD + stock adjustment
│   │   ├── wageController.js           # Wage CRUD
│   │   ├── stockController.js          # Stock inventory CRUD
│   │   ├── expenseController.js        # Expense CRUD
│   │   ├── incomeController.js         # Income CRUD
│   │   ├── purchaseController.js       # Purchase CRUD
│   │   ├── billingController.js        # Invoice CRUD
│   │   └── preferenceController.js     # App preferences CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js           # JWT protect + role authorize
│   │   └── validationMiddleware.js     # express-validator rule sets
│   ├── models/
│   │   ├── adminModel.js               # Admin schema (type, role, auth, 2FA-ready)
│   │   ├── employeeModel.js            # Employee schema
│   │   ├── orderModel.js               # Order schema (6-stage status)
│   │   ├── saleModel.js                # Sale schema (items array, auto-total)
│   │   ├── wageModel.js                # Wage schema (balance auto-calc)
│   │   ├── stockModel.js               # Stock schema (unique per client+itemType)
│   │   ├── expenseModel.js             # Expense schema
│   │   ├── incomeModel.js              # Income schema
│   │   ├── purchaseModel.js            # Purchase schema
│   │   ├── billingModel.js             # Invoice schema (auto-increment INV###)
│   │   └── preferenceModel.js          # App preference schema
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── wageRoutes.js
│   │   ├── stockRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── incomeRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── billingRoutes.js
│   │   └── preferenceRoutes.js
│   └── utils/
│       └── generateToken.js            # JWT access/refresh token utilities
├── .env                                # Environment variables (not committed)
├── .env.example                        # Environment template
├── package.json
└── PROJECT_OVERVIEW.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4.x |
| Database | MongoDB Atlas via Mongoose 8.x |
| Auth | JWT (jsonwebtoken) — access + refresh token pair |
| Password hashing | bcryptjs (12 rounds) |
| Validation | express-validator |
| Security headers | helmet |
| Rate limiting | express-rate-limit (in-memory store) |
| Logging | morgan |
| Environment | dotenv |

---

## Architecture

- **Multi-tenant**: Every data model carries a `clientId` field. All queries are scoped to the requesting client's ID, ensuring data isolation between tenants.
- **MVC pattern**: Models → Controllers → Routes, with middleware for cross-cutting concerns.
- **Token pattern**: Short-lived access token (15 min) + long-lived refresh token (7 days). Logout blacklists the access token in memory.
- **Account locking**: 5 consecutive failed login attempts locks the account for 2 hours.

---

## Authentication

All protected routes require the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Token is obtained from the login response. Use the refresh-token endpoint to renew an expired access token.

### Admin `type` values & access
| Type | Access |
|---|---|
| `merchant_mill` | Full access — can manage other admins, dashboard, all business data |
| `custom_milling` | Dashboard + all business data |
| `hybrid` | Dashboard + all business data |

---

## API Reference

Base URL: `http://localhost:5000/api`

---

### Admin APIs

#### POST `/admins/login` — PUBLIC
Login and receive JWT tokens.

**Request Body**
```json
{
  "username": "john_admin",
  "password": "Pass@1234"
}
```

**Response 200**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "John Doe",
  "username": "john_admin",
  "email": "john@example.com",
  "type": "merchant_mill",
  "active": true,
  "lastLogin": "2026-05-03T10:00:00.000Z",
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "expiresIn": "15m"
}
```

---

#### POST `/admins/forgot-password` — PUBLIC
Initiate password reset. Sends a reset token (returned in development mode).

**Request Body**
```json
{
  "email": "john@example.com"
}
```

**Response 200**
```json
{
  "message": "Password reset token sent to email",
  "resetToken": "<token>"
}
```

---

#### POST `/admins/reset-password` — PUBLIC
Reset password using the token received from forgot-password.

**Request Body**
```json
{
  "token": "<resetToken>",
  "password": "NewPass@5678"
}
```

**Response 200**
```json
{
  "message": "Password reset successful"
}
```

---

#### POST `/admins/refresh-token` — PUBLIC
Exchange a valid refresh token for a new token pair.

**Request Body**
```json
{
  "refreshToken": "<refreshToken>"
}
```

**Response 200**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "expiresIn": "15m"
}
```

---

#### POST `/admins/logout` — PROTECTED
Blacklist the current access token.

**Headers**: `Authorization: Bearer <accessToken>`

**Response 200**
```json
{
  "message": "Logged out successfully"
}
```

---

#### GET `/admins/dashboard` — PROTECTED (admin, super_admin, manager)
Full analytics dashboard with revenue, expenses, profit, stock, and order status breakdowns.

**Query Parameters**
| Param | Required | Type | Description |
|---|---|---|---|
| `clientId` | Yes | MongoId | Tenant identifier |
| `startDate` | No | ISO8601 | Range start (default: 1st of current month) |
| `endDate` | No | ISO8601 | Range end (default: end of current month) |
| `year` | No | Number | Year for monthly breakdown (default: current year) |
| `month` | No | Number (1–12) | Specific month filter |

**Response 200**
```json
{
  "revenue": { "orders": 0, "sales": 0, "total": 0 },
  "expense": { "wages": 0, "salary": 0, "other": 0, "total": 0 },
  "profit": 0,
  "todaySummary": {
    "totalOrder": 0,
    "paddyTaken": 0,
    "newOrder": 0,
    "output": 0
  },
  "paddyProcessed": { "totalBags": 0, "paidBags": 0 },
  "sales": {
    "byItemType": {
      "bran": { "quantity": 0, "amount": 0 },
      "husk": { "quantity": 0, "amount": 0 },
      "black rice": { "quantity": 0, "amount": 0 },
      "broken rice": { "quantity": 0, "amount": 0 },
      "other": { "quantity": 0, "amount": 0 }
    }
  },
  "stock": {
    "available": {
      "bran": 0, "husk": 0, "black rice": 0,
      "broken rice": 0, "other": 0, "Karika": 0
    }
  },
  "orderStatuses": {
    "initialStocking": { "totalBags": 0, "count": 0 },
    "boilingCompleted": { "totalBags": 0, "count": 0 },
    "splittingCompleted": { "totalBags": 0, "count": 0 },
    "packedReady": { "totalBags": 0, "count": 0 }
  },
  "yearly": {
    "year": 2026,
    "months": [
      {
        "month": 1,
        "revenue": { "orders": 0, "sales": 0, "total": 0 },
        "expense": { "wages": 0, "salary": 0, "other": 0, "total": 0 },
        "profit": 0,
        "sales": { "byItemType": {} }
      }
    ]
  }
}
```

---

#### GET `/admins/profile` — PROTECTED
Get a specific admin's profile.

**Query Parameters**
| Param | Required | Description |
|---|---|---|
| `adminId` | Yes | MongoDB ObjectId of the admin |

**Response 200**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "John Doe",
  "username": "john_admin",
  "email": "john@example.com",
  "type": "merchant_mill",
  "active": true,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "lastLogin": "2026-05-03T10:00:00.000Z"
}
```

---

#### POST `/admins` — PROTECTED (super_admin only)
Create a new admin.

**Request Body**
```json
{
  "name": "Jane Smith",
  "username": "jane_smith",
  "password": "Pass@1234",
  "type": "admin",
  "role": "admin",
  "email": "jane@example.com"
}
```

| Field | Required | Type | Values |
|---|---|---|---|
| `name` | Yes | String | 2–50 chars |
| `username` | Yes | String | 3–20 chars, alphanumeric + `_` |
| `password` | Yes | String | min 8 chars, must have upper, lower, digit, special |
| `type` | No | String | `merchant_mill`, `custom_milling`, `hybrid` (default: `merchant_mill`) |
| `email` | No | String | valid email |

**Response 201**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
  "name": "Jane Smith",
  "username": "jane_smith",
  "type": "merchant_mill",
  "active": true
}
```

---

#### GET `/admins` — PROTECTED (super_admin only)
List all admins (passwords excluded).

**Response 200** — Array of admin objects (no `password` field).

---

#### DELETE `/admins/:id` — PROTECTED (super_admin only)
Delete an admin by ID.

**URL Params**: `:id` — MongoDB ObjectId

**Response 200**
```json
{ "message": "Admin removed" }
```

---

#### PUT `/admins/:id/active` — PROTECTED (super_admin only)
Toggle an admin's active status.

**URL Params**: `:id` — MongoDB ObjectId

**Response 200**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "John Doe",
  "username": "john_admin",
  "type": "merchant_mill",
  "active": false
}
```

---

### Employee APIs

Base: `/api/employees` — All routes require `clientId`.

#### POST `/employees`
Create a new employee.

**Request Body**
```json
{
  "name": "Ravi Kumar",
  "gender": "Male",
  "address": "123 Main St, Chennai",
  "dob": "1990-06-15",
  "phoneNumber": "9876543210",
  "emergencyContactNumber": "9876543211",
  "salary": 15000,
  "advanceAmount": 0,
  "debtAmount": 0,
  "isActive": true,
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

**Response 201** — Created employee object.

---

#### GET `/employees?clientId=<id>`
List all employees for a client.

**Query Parameters**: `clientId` (required)

**Response 200** — Array of employee objects.

---

#### PUT `/employees/:id`
Update an employee.

**Request Body** — Any subset of employee fields + `clientId`.

**Response 200** — Updated employee object.

---

#### DELETE `/employees/:id?clientId=<id>`
Delete an employee.

**Query Parameters**: `clientId` (required)

**Response 200**
```json
{ "message": "Employee removed" }
```

---

### Order APIs

Base: `/api/orders`

#### POST `/orders`
Create a paddy processing order.

**Request Body**
```json
{
  "name": "Senthil Murugan",
  "villageName": "Thanjavur",
  "address": "45 Temple St",
  "phoneNumber": "9876543210",
  "numberOfBags": 50,
  "totalAmount": 25000,
  "advanceAmount": 5000,
  "status": "CREATED",
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

**Status values**: `CREATED` | `INITIAL STOCKING` | `BOILING PROCESS COMPLETED` | `SPLITTING PROCESS COMPLETED` | `PACKED & READY` | `PAID & CLOSE`

**Response 201** — Created order object.

---

#### GET `/orders?clientId=<id>`
List orders for a client.

**Query Parameters**
| Param | Required | Description |
|---|---|---|
| `clientId` | Yes | Tenant ID |
| `startDate` | No | ISO8601 filter start |
| `endDate` | No | ISO8601 filter end |

**Response 200** — Array of order objects.

---

#### PUT `/orders/:id`
Update an order.

**Request Body** — Any subset of order fields + `clientId`.

**Response 200** — Updated order object.

---

#### DELETE `/orders/:id?clientId=<id>`
Delete an order.

**Response 200**
```json
{ "message": "Order removed" }
```

---

### Sale APIs

Base: `/api/sales`

#### POST `/sales`
Create a sale. Automatically deducts stock for each item.

**Request Body**
```json
{
  "customerName": "Murugan Stores",
  "phoneNumber": "9876543210",
  "items": [
    {
      "itemType": "bran",
      "quantity": 10,
      "rate": 500,
      "amount": 5000
    },
    {
      "itemType": "husk",
      "quantity": 5,
      "rate": 200,
      "amount": 1000
    }
  ],
  "paymentStatus": "Paid",
  "paymentMethod": "Cash",
  "mydebt": 0,
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

**itemType values**: `bran` | `husk` | `black rice` | `broken rice` | `others` | `Karika`

**paymentStatus values**: `Paid` | `Pending` | `Partially Paid`

**paymentMethod values**: `Cash` | `Online` | `Cheque`

**Response 201** — Created sale object with auto-calculated `totalAmount`.

---

#### GET `/sales?clientId=<id>`
List sales for a client.

**Query Parameters**
| Param | Required | Description |
|---|---|---|
| `clientId` | Yes | Tenant ID |
| `startDate` | No | ISO8601 filter start |
| `endDate` | No | ISO8601 filter end |
| `mydebt` | No | `true` to filter only debt sales |

**Response 200** — Array of sale objects.

---

#### PUT `/sales/:id`
Update a sale. Restores old stock quantities and deducts new ones.

**Request Body** — Any subset of sale fields + `clientId`.

**Response 200** — Updated sale object.

---

#### DELETE `/sales/:id?clientId=<id>`
Delete a sale and restore stock quantities.

**Response 200**
```json
{ "message": "Sale removed" }
```

---

### Wage APIs

Base: `/api/wages`

#### POST `/wages`
Record a wage entry.

**Request Body**
```json
{
  "employeeId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "employeeName": "Ravi Kumar",
  "totalWage": 800,
  "advanceWage": 200,
  "bags": 40,
  "typeOfWork": "boiling",
  "machineType": "Electric",
  "advancedebtamount": 0,
  "note": "Regular shift",
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

**typeOfWork values**: `boiling` | `splitting` | `other`

**machineType values**: `Electric` | `Manual` | `Hybrid`

**Response 201** — Created wage object with auto-calculated `balanceWage = totalWage - advanceWage`.

---

#### GET `/wages?clientId=<id>`
List wage records for a client.

**Query Parameters**: `clientId` (required), `startDate`, `endDate`

**Response 200** — Array of wage objects.

---

#### PUT `/wages/:id`
Update a wage record.

**Request Body** — Any subset of wage fields + `clientId`.

**Response 200** — Updated wage object.

---

#### DELETE `/wages/:id?clientId=<id>`
Delete a wage record.

**Response 200**
```json
{ "message": "Wage removed" }
```

---

### Stock APIs

Base: `/api/stock`

#### GET `/stock?clientId=<id>`
List all stock items for a client.

**Query Parameters**: `clientId` (required), `startDate`, `endDate`

**Response 200**
```json
[
  {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
    "itemType": "bran",
    "availableQuantity": 150,
    "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
    "lastUpdated": "2026-05-03T10:00:00.000Z"
  }
]
```

---

#### POST `/stock`
Add a new stock item (unique per client + itemType).

**Request Body**
```json
{
  "itemType": "bran",
  "availableQuantity": 0,
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

**Response 201** — Created stock item object.

---

#### PUT `/stock/:id`
Update the available quantity of a stock item.

**Request Body**
```json
{
  "quantity": 200,
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1"
}
```

**Response 200** — Updated stock item object.

---

#### DELETE `/stock/:id?clientId=<id>`
Delete a stock item.

**Response 200**
```json
{ "message": "Stock item removed" }
```

---

### Expense APIs

Base: `/api/expenses`

#### POST `/expenses`
Log a new expense.

**Request Body**
```json
{
  "item": "Diesel",
  "description": "Generator fuel",
  "amount": 3500,
  "category": "Fuel",
  "date": "2026-05-03",
  "paymentMethod": "Cash",
  "receiptNumber": "REC001",
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-03T00:00:00.000Z"
}
```

**Response 201** — Created expense object.

---

#### GET `/expenses?clientId=<id>`
List expenses for a client.

**Query Parameters**: `clientId` (required), `category`, `startDate`, `endDate`

**Response 200** — Array of expense objects sorted by date descending.

---

#### PUT `/expenses/:id`
Update an expense.

**Request Body** — Any subset of expense fields + `clientId`.

**Response 200** — Updated expense object.

---

#### DELETE `/expenses/:id?clientId=<id>`
Delete an expense.

**Response 200**
```json
{ "message": "Expense removed" }
```

---

### Income APIs

Base: `/api/income`

#### POST `/income`
Log an income entry.

**Request Body**
```json
{
  "item": "Paddy Processing Fee",
  "description": "Processing for Senthil order",
  "amount": 5000,
  "category": "Processing",
  "date": "2026-05-03",
  "paymentMethod": "Cash",
  "receiptNumber": "INC001",
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-03T00:00:00.000Z"
}
```

**Response 201** — Created income object.

---

#### GET `/income?clientId=<id>`
List income entries for a client.

**Query Parameters**: `clientId` (required), `category`, `startDate`, `endDate`

**Response 200** — Array of income objects sorted by date descending.

---

#### PUT `/income/:id`
Update an income entry.

**Request Body** — Any subset of income fields + `clientId`.

**Response 200** — Updated income object.

---

#### DELETE `/income/:id?clientId=<id>`
Delete an income entry.

**Response 200**
```json
{ "message": "Income removed" }
```

---

### Purchase APIs

Base: `/api/purchases`

#### POST `/purchases`
Record a supplier purchase.

**Request Body**
```json
{
  "itemName": "Raw Paddy",
  "supplierName": "Krishnamurthy Farms",
  "phoneNumber": "9876543210",
  "quality": "A Grade",
  "price": 45000,
  "paidAmount": 30000,
  "balanceAmount": 15000,
  "rate": 900,
  "billNumber": "BILL-001",
  "purchaseDate": "2026-05-01",
  "transportCost": 1500,
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

**Response 201** — Created purchase object.

---

#### GET `/purchases?clientId=<id>`
List purchases for a client.

**Query Parameters**: `clientId` (required), `supplierName`, `startDate`, `endDate`

**Response 200** — Array of purchase objects sorted by date descending.

---

#### PUT `/purchases/:id`
Update a purchase.

**Request Body** — Any subset of purchase fields + `clientId`.

**Response 200** — Updated purchase object.

---

#### DELETE `/purchases/:id?clientId=<id>`
Delete a purchase.

**Response 200**
```json
{ "message": "Purchase removed" }
```

---

### Billing APIs

Base: `/api/billing`

#### POST `/billing`
Create an invoice. `invoiceNo` is auto-generated (`INV001`, `INV002`, …).

**Request Body**
```json
{
  "customer": {
    "name": "Murugan Rice Traders",
    "phone": "9876543210",
    "address": "12 Market St, Trichy"
  },
  "items": [
    {
      "item": "Bran",
      "rate": 500,
      "quantity": 20
    },
    {
      "item": "Husk",
      "rate": 200,
      "quantity": 10
    }
  ],
  "invoiceDate": "2026-05-03",
  "paymentMethod": "Cash",
  "status": "Unpaid",
  "clientId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "createdAt": "2026-05-03T00:00:00.000Z"
}
```

**status values**: `Paid` | `Unpaid` | `Partial`

**Response 201** — Created invoice object with auto-calculated `totalAmount` and auto-generated `invoiceNo`.

---

#### GET `/billing?clientId=<id>`
List invoices for a client.

**Query Parameters**
| Param | Required | Description |
|---|---|---|
| `clientId` | Yes | Tenant ID |
| `customerName` | No | Partial match search |
| `status` | No | `Paid`, `Unpaid`, `Partial` |
| `startDate` | No | ISO8601 filter start |
| `endDate` | No | ISO8601 filter end |

**Response 200** — Array of invoice objects sorted by date descending.

---

#### PUT `/billing/:id`
Update an invoice.

**Request Body** — Any subset of invoice fields + `clientId`. Items array will recalculate `totalAmount`.

**Response 200** — Updated invoice object.

---

#### DELETE `/billing/:id?clientId=<id>`
Delete an invoice.

**Response 200**
```json
{ "message": "Invoice removed" }
```

---

### Preference APIs

Base: `/api/preferences` — All routes are **PROTECTED**.

#### POST `/preferences`
Create an application preference record.

**Request Body**
```json
{
  "name": "Sri Balaji Rice Mill",
  "logo": "https://example.com/logo.png",
  "address": "45 Mill Road, Thanjavur",
  "phoneNumber": "9876543210",
  "bagInKg": 75,
  "salesBagInKg": 50,
  "gstPercentage": 5,
  "output": ["White Rice", "Bran", "Husk"],
  "stages": ["Cleaning", "Boiling", "Drying", "Milling", "Packing"]
}
```

**Response 201** — Created preference object.

---

#### GET `/preferences`
List all preference records.

**Response 200** — Array of preference objects.

---

#### GET `/preferences/:id`
Get a single preference by ID.

**Response 200** — Preference object.

---

#### PUT `/preferences/:id`
Update a preference.

**Request Body** — Any subset of preference fields.

**Response 200** — Updated preference object.

---

#### DELETE `/preferences/:id`
Delete a preference.

**Response 200**
```json
{ "message": "Preference removed" }
```

---

## Security Features

| Feature | Detail |
|---|---|
| Security headers | helmet with CSP, HSTS (1 year), XCTO, XFO |
| CORS | Origin allowlist from `ALLOWED_ORIGINS` env var |
| Rate limiting | Auth endpoints: 5 req/15 min · General: 100 req/15 min · Strict: 20 req/15 min |
| Auth rate limit | `/api/admins` uses auth rate limit (5/15 min) |
| JWT | Access token: 15 min · Refresh token: 7 days |
| Token blacklist | Logged-out tokens are blacklisted in-memory (use Redis in production) |
| Password hashing | bcryptjs — 12 salt rounds |
| Account locking | 5 failed logins → locked for 2 hours |
| Input sanitization | XSS pattern removal on all request body/query/params |
| Admin protection | `POST /admins`, `GET /profile`, `PUT /:id/active` all require `protect` middleware |
| Request body limit | 1 MB maximum payload size |

### Environment Variables

```
MONGODB_URI=            # MongoDB connection string
JWT_SECRET=             # Access token secret
JWT_REFRESH_SECRET=     # Refresh token secret
JWT_EXPIRE=15m          # Access token TTL
JWT_REFRESH_EXPIRE=7d   # Refresh token TTL
JWT_ISSUER=rice-mill-api
JWT_AUDIENCE=rice-mill-client
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
NODE_ENV=development    # or production
PORT=5000
BCRYPT_ROUNDS=12
```

---

## Error Responses

All errors follow this structure:

```json
{
  "error": "Short error category",
  "message": "Human-readable detail (development only)",
  "timestamp": "2026-05-03T10:00:00.000Z"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request / validation failure |
| 401 | Unauthenticated — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Username must be between 3 and 20 characters",
      "path": "username",
      "location": "body"
    }
  ]
}
```

---

## Health Check

```
GET /health
```

**Response 200**
```json
{
  "status": "OK",
  "timestamp": "2026-05-03T10:00:00.000Z",
  "uptime": 1234.56,
  "environment": "development",
  "version": "1.0.0"
}
```
