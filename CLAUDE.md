# Rice Mill Management System — Server

Express.js + MongoDB REST API for a multi-tenant rice mill management platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM — `"type": "module"`) |
| Framework | Express 4.x |
| Database | MongoDB Atlas via Mongoose 8.x |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator (installed, not yet wired) |
| Rate limiting | express-rate-limit |

## Project Structure

```
src/
├── app.js                   # Entry point — Express setup, middleware, route mounting
├── config/
│   └── db.js                # MongoDB connection + Stock index initialization
├── middleware/
│   ├── authMiddleware.js    # JWT protect + admin guard
│   └── rateLimiter.js       # generalLimiter (100/15min) + authLimiter (10/15min)
├── models/
│   ├── adminModel.js        # Admin schema, bcrypt pre-save, matchPassword()
│   ├── employeeModel.js
│   ├── orderModel.js
│   ├── saleModel.js         # Pre-save totalAmount calculation
│   ├── wageModel.js         # Pre-save balanceWage calculation
│   ├── expenseModel.js
│   ├── stockModel.js        # Compound unique index: clientId + itemType
│   └── incomeModel.js
├── controllers/
│   ├── adminController.js   # Auth + full dashboard analytics aggregation
│   ├── employeeController.js
│   ├── orderController.js
│   ├── saleController.js    # Stock deduction/restoration on sale CRUD
│   ├── wageController.js
│   ├── expenseController.js
│   ├── stockController.js
│   └── incomeController.js
├── routes/
│   ├── adminRoutes.js       # /api/admins — login, createAdmin, profile, toggleActive public; dashboard/getAdmins/delete protected
│   ├── employeeRoutes.js    # /api/employees — all protected
│   ├── orderRoutes.js       # /api/orders — all protected
│   ├── saleRoutes.js        # /api/sales — all protected
│   ├── wageRoutes.js        # /api/wages — all protected
│   ├── expenseRoutes.js     # /api/expenses — all protected
│   ├── stockRoutes.js       # /api/stock — all protected
│   └── incomeRoutes.js      # /api/income — all protected
└── utils/
    └── generateToken.js     # JWT sign, 30-day expiry
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Min 64-char random string for signing JWTs |
| `NODE_ENV` | No | `development` or `production` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: localhost:3000,5173) |

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Authentication

Most routes require a Bearer token. The table below lists which admin endpoints are public.

**Login flow:**
1. `POST /api/admins/login` → receive `token`
2. Include `Authorization: Bearer <token>` on every subsequent request

Tokens expire after **30 days**. The `protect` middleware validates the token and sets `req.admin` with the authenticated admin object (password excluded).

**Admin route access summary:**

| Endpoint | Auth required |
|---|---|
| `POST /api/admins/login` | No (rate-limited) |
| `POST /api/admins` | No |
| `GET /api/admins/profile` | No |
| `PUT /api/admins/:id/active` | No |
| `GET /api/admins` | Yes |
| `DELETE /api/admins/:id` | Yes |
| `GET /api/admins/dashboard` | Yes |
| All other resource routes | Yes |

---

## API Reference

### Admins — `/api/admins`

#### `POST /api/admins/login` — Public (rate-limited: 10/15min)

Login and receive a JWT.

**Request body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "_id": "string",
  "name": "string",
  "username": "string",
  "type": "string",
  "active": true,
  "token": "string"
}
```

**Response 401:** `{ "error": "Invalid email or password" }`

---

#### `POST /api/admins` — Public

Create a new admin account.

**Request body:**
```json
{
  "name": "string",
  "username": "string",
  "password": "string (min 6 chars)",
  "type": "string"
}
```

**Response 201:**
```json
{
  "_id": "string",
  "name": "string",
  "username": "string",
  "type": "string",
  "active": true,
  "token": "string"
}
```

---

#### `GET /api/admins` — Protected

List all admins (passwords excluded).

**Response 200:** `Admin[]` — each object includes `_id`, `name`, `username`, `type`, `active`, `createdAt`, `updatedAt`

---

#### `DELETE /api/admins/:id` — Protected

Delete an admin by ID.

**Response 200:** `{ "message": "Admin removed" }`

---

#### `PUT /api/admins/:id/active` — Public

Toggle an admin's active status.

**Response 200:**
```json
{
  "_id": "string",
  "name": "string",
  "username": "string",
  "type": "string",
  "active": false
}
```

---

#### `GET /api/admins/profile` — Public

Get an admin's profile by ID.

**Query parameters:**

| Param | Required | Description |
|---|---|---|
| `id` | Yes | Admin `_id` to look up |

**Response 200:**
```json
{
  "_id": "string",
  "name": "string",
  "username": "string",
  "type": "string",
  "active": true
}
```

---

#### `GET /api/admins/dashboard` — Protected

Comprehensive P&L and operational dashboard.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `clientId` | string | **Required.** Tenant identifier |
| `startDate` | ISO date | Filter period start (default: first of current month) |
| `endDate` | ISO date | Filter period end (default: end of current month) |
| `year` | number | Year for yearly breakdown (default: current year) |
| `month` | number | 1–12. If set, returns that month's data only |

**Response 200:**
```json
{
  "revenue": {
    "orders": 0,
    "sales": 0,
    "total": 0
  },
  "expense": {
    "wages": 0,
    "salary": 0,
    "other": 0,
    "total": 0
  },
  "profit": 0,
  "todaySummary": {
    "totalOrder": 0,
    "paddyTaken": 0,
    "newOrder": 0,
    "output": 0
  },
  "paddyProcessed": {
    "totalBags": 0,
    "paidBags": 0
  },
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
      "bran": 0,
      "husk": 0,
      "black rice": 0,
      "broken rice": 0,
      "other": 0,
      "Karika": 0
    }
  },
  "orderStatuses": {
    "initialStocking": { "totalBags": 0, "count": 0 },
    "boilingCompleted": { "totalBags": 0, "count": 0 },
    "splittingCompleted": { "totalBags": 0, "count": 0 },
    "packedReady": { "totalBags": 0, "count": 0 }
  },
  "yearly": {
    "year": 2025,
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

### Employees — `/api/employees` (all Protected)

#### `POST /api/employees`

**Request body:**
```json
{
  "clientId": "string",
  "name": "string",
  "gender": "Male | Female | Other",
  "address": "string",
  "dob": "ISO date",
  "phoneNumber": "string",
  "emergencyContactNumber": "string",
  "maritalStatus": "Single | Married | Divorced | Widowed",
  "salary": 0,
  "advanceAmount": 0,
  "debtAmount": 0
}
```

**Response 201:** Employee object

---

#### `GET /api/employees?clientId=<id>`

Returns all employees for the given client.

**Response 200:** `Employee[]`

---

#### `PUT /api/employees/:id`

Update an employee. All fields optional except `clientId`.

**Request body:**
```json
{
  "clientId": "string",
  "name": "string",
  "gender": "string",
  "address": "string",
  "dob": "ISO date",
  "phoneNumber": "string",
  "emergencyContactNumber": "string",
  "maritalStatus": "string",
  "salary": 0,
  "advanceAmount": 0,
  "debtAmount": 0,
  "isActive": true
}
```

**Response 200:** Updated Employee object

---

#### `DELETE /api/employees/:id?clientId=<id>`

**Response 200:** `{ "message": "Employee removed" }`

---

### Orders — `/api/orders` (all Protected)

Order status lifecycle: `CREATED` → `INITIAL STOCKING` → `BOILING PROCESS COMPLETED` → `SPLITTING PROCESS COMPLETED` → `PACKED & READY` → `PAID & CLOSE`

#### `POST /api/orders`

**Request body:**
```json
{
  "clientId": "string",
  "name": "string",
  "villageName": "string",
  "address": "string",
  "phoneNumber": "string",
  "numberOfBags": 0,
  "totalAmount": 0,
  "advanceAmount": 0,
  "typeOfPaddy": "string",
  "status": "CREATED",
  "splittingincome": 0
}
```

**Response 201:** Order object

---

#### `GET /api/orders?clientId=<id>&startDate=<date>&endDate=<date>`

| Query | Required | Description |
|---|---|---|
| `clientId` | Yes | Tenant filter |
| `startDate` | No | ISO date range start |
| `endDate` | No | ISO date range end |

**Response 200:** `Order[]` sorted by `createdAt` desc

---

#### `PUT /api/orders/:id`

Update any order field. Requires `clientId` in body.

**Response 200:** Updated Order object

---

#### `DELETE /api/orders/:id?clientId=<id>`

**Response 200:** `{ "message": "Order removed" }`

---

### Sales — `/api/sales` (all Protected)

Sales automatically deduct from stock on create and restore stock on delete.

#### `POST /api/sales`

**Request body:**
```json
{
  "clientId": "string",
  "name": "string",
  "phoneNumber": "string",
  "address": "string",
  "items": [
    {
      "itemType": "bran | husk | black rice | broken rice | others | Karika",
      "quantity": 0,
      "rate": 0
    }
  ],
  "paymentStatus": "Paid | Pending | Partially Paid",
  "paymentMethod": "Cash | UPI | Bank Transfer | Other",
  "mydebt": 0
}
```

`totalAmount` is calculated server-side from `items`.

Stock is deducted for each item. Returns 400 if insufficient stock.

**Response 201:** Sale object

---

#### `GET /api/sales?clientId=<id>&startDate=<date>&endDate=<date>`

When date filters are applied, also returns records with outstanding debt (`mydebt > 0` and `mydebt < totalAmount`) regardless of date.

**Response 200:** `Sale[]` sorted by `createdAt` desc

---

#### `PUT /api/sales/:id`

**Request body:**
```json
{
  "clientId": "string",
  "name": "string",
  "phoneNumber": "string",
  "address": "string",
  "paymentStatus": "string",
  "paymentMethod": "string",
  "mydebt": 0,
  "items": []
}
```

If `items` is provided, old items are returned to stock and new items are deducted.

**Response 200:** Updated Sale object

---

#### `DELETE /api/sales/:id?clientId=<id>`

Returns all sale items back to stock before deleting.

**Response 200:** `{ "message": "Sale removed" }`

---

### Wages — `/api/wages` (all Protected)

#### `POST /api/wages`

**Request body:**
```json
{
  "clientId": "string",
  "employeeId": "string",
  "employeeName": "string",
  "totalWage": 0,
  "advanceWage": 0,
  "advanceamount": 0,
  "typeOfWork": "boiling | splitting | other",
  "machineType": "Electric | Manual | Hybrid",
  "bags": 0,
  "date": "ISO date",
  "note": "string",
  "advancedebtamount": "string"
}
```

`balanceWage` = `totalWage - advanceWage` (computed by pre-save hook).

**Response 201:** Wage object

---

#### `GET /api/wages?clientId=<id>&startDate=<date>&endDate=<date>`

**Response 200:** `Wage[]`

---

#### `PUT /api/wages/:id` / `DELETE /api/wages/:id?clientId=<id>`

Standard update/delete by clientId-scoped lookup.

---

### Expenses — `/api/expenses` (all Protected)

#### `POST /api/expenses`

**Request body:**
```json
{
  "clientId": "string",
  "item": "string",
  "description": "string",
  "amount": 0,
  "category": "string",
  "date": "ISO date",
  "paymentMethod": "Cash | Bank Transfer | UPI | Cheque | Other",
  "receiptNumber": "string",
  "createdAt": "ISO date"
}
```

`createdAt` can be provided to backdate an expense record.

**Response 201:** Expense object

---

#### `GET /api/expenses?clientId=<id>&category=<cat>&startDate=<date>&endDate=<date>`

**Response 200:** `Expense[]` sorted by `date` desc

---

#### `PUT /api/expenses/:id` / `DELETE /api/expenses/:id?clientId=<id>`

Standard update/delete scoped to clientId.

---

### Income — `/api/income` (all Protected)

Identical shape to Expenses.

#### `POST /api/income`

**Request body:**
```json
{
  "clientId": "string",
  "item": "string",
  "description": "string",
  "amount": 0,
  "category": "string",
  "date": "ISO date",
  "paymentMethod": "Cash | Bank Transfer | UPI | Cheque | Other",
  "receiptNumber": "string",
  "createdAt": "ISO date"
}
```

**Response 201:** Income object

---

#### `GET /api/income?clientId=<id>&category=<cat>&startDate=<date>&endDate=<date>`

**Response 200:** `Income[]` sorted by `date` desc

---

#### `PUT /api/income/:id` / `DELETE /api/income/:id?clientId=<id>`

---

### Stock — `/api/stock` (all Protected)

Stock items are per-client singletons (unique compound index: `clientId + itemType`).

#### `POST /api/stock`

**Request body:**
```json
{
  "clientId": "string",
  "itemType": "bran | husk | black rice | broken rice | others | Karika",
  "availableQuantity": 0
}
```

**Response 201:** Stock object

---

#### `GET /api/stock?clientId=<id>`

**Response 200:** `Stock[]`

---

#### `PUT /api/stock/:id`

**Request body:**
```json
{
  "clientId": "string",
  "quantity": 0
}
```

Sets `availableQuantity` to the provided value (absolute, not delta).

**Response 200:** Updated Stock object

---

#### `DELETE /api/stock/:id?clientId=<id>`

**Response 200:** `{ "message": "Stock item removed" }`

---

## Data Models

### Admin
```
_id, name, username (unique), password (bcrypt, min 6), type, active (bool)
```

### Employee
```
_id, clientId, name, gender, address, dob, phoneNumber (unique),
emergencyContactNumber, maritalStatus, salary, advanceAmount,
debtAmount, isActive, timestamps
```

### Order
```
_id, clientId, name, villageName, address, phoneNumber,
numberOfBags, totalAmount, advanceAmount, typeOfPaddy,
status (enum), splittingincome, timestamps
```

### Sale
```
_id, clientId, name, phoneNumber, address,
items[{itemType, quantity, rate, amount}],
totalAmount (auto), mydebt, paymentStatus, paymentMethod, timestamps
```

### Wage
```
_id, clientId, employeeId, employeeName,
advanceWage, advanceamount, totalWage, balanceWage (auto),
typeOfWork, machineType, advancedebtamount, bags, date, note, timestamps
```

### Expense / Income
```
_id, clientId, item, description, amount, category,
date, paymentMethod, receiptNumber, recordedBy, timestamps
```

### Stock
```
_id, clientId, itemType (enum), availableQuantity, lastUpdated, timestamps
unique index: (clientId, itemType)
```

---

## Development

```bash
npm install
cp .env.example .env  # fill in values
npm run dev           # nodemon hot-reload
npm start             # production
npm test              # jest
```

## Security Notes

- **Rotate credentials** if `.env` was ever committed — the MongoDB password and JWT secret must be changed.
- Generate a strong JWT secret (64+ random bytes) — never reuse database passwords.
- Set `NODE_ENV=production` in production to suppress error details in API responses.
- Set `ALLOWED_ORIGINS` to your actual frontend domain before deploying.
- `clientId` is trust-based — clients supply their own ID; there is no server-side binding between the JWT and a specific clientId. Consider adding a `clientId` field to the Admin model and verifying it in middleware if strict multi-tenant isolation is needed.
