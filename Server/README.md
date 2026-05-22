# Expentra — Server (Backend API)

> The Node.js + Express + MongoDB backend powering the Expentra Smart Expense & Financial Control System.

---

## 📋 Table of Contents

1. [Backend Overview](#backend-overview)
2. [API Endpoints](#api-endpoints)
3. [Core Functional Logic](#core-functional-logic)
   - [Budget Alert Logic](#a-budget-alert-logic)
   - [Inactivity Detection Logic](#b-inactivity-detection-logic)
   - [Smart Alert Logic](#c-smart-alert-logic)
   - [Pattern-Based Analysis](#d-pattern-based-analysis)
   - [Debt Optimization Algorithm](#e-debt-optimization-algorithm)
   - [Notification System (FCM)](#f-notification-system--fcm)
4. [Database Models](#database-models)
5. [Middleware](#middleware)
6. [Technologies Used](#technologies-used)
7. [Environment Variables](#environment-variables)
8. [Setup & Installation](#setup--installation)

---

## 🌐 Backend Overview

The Expentra server is a **Node.js + Express 5** REST API with **ES Modules** (`"type": "module"`). It connects to a **MongoDB** database via Mongoose and integrates with **Firebase Admin SDK** for push notification dispatch via FCM (Firebase Cloud Messaging).

The server enforces:
- **JWT-based stateless authentication** on all protected routes
- **Rate limiting** (2000 requests per 15-minute window per IP)
- **CORS policy** restricted to the production frontend URL and `localhost:5173`
- **Centralized error handling** via `errorMiddleware.js`

The intelligence of the system lives in the backend — budget thresholds, pattern analysis, smart alerts, and the debt optimization algorithm all execute server-side with zero client logic.

**Entry point:** `server.js`  
**Port:** `5000` (default, overridden by `process.env.PORT`)

---

## 📡 API Endpoints

All routes are prefixed under `/api/`.

### 🔐 Auth — `/api/auth`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user with name, email, and password (strong password policy enforced) |
| `POST` | `/auth/login` | Public | Authenticate credentials, returns JWT. Triggers **Inactivity Detection** on login |
| `POST` | `/auth/google` | Public | Google OAuth sign-in — creates user if not found, returns JWT |
| `GET` | `/auth/profile` | Private | Fetch the authenticated user's profile |
| `PUT` | `/auth/profile` | Private | Update name, email, or password. Returns a fresh JWT |
| `POST` | `/auth/fcm-token` | Private | Register an FCM device token for push notifications |

---

### 💸 Expenses — `/api/expenses`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/expenses` | Private | Create a new personal expense. Triggers **Budget Overflow Check** and **Smart Alert** logic |
| `GET` | `/expenses` | Private | Get all expenses for the user, with optional `?month=`, `?year=`, `?category=` query filters |
| `PUT` | `/expenses/:id` | Private | Update an existing expense. Re-triggers budget overflow check |
| `DELETE` | `/expenses/:id` | Private | Delete an expense. Re-evaluates budget in case the user returns below the limit |

> **Auto Category Detection:** When creating an expense, the server runs `detectCategory(title, categories)` which matches the expense title against database-stored keyword arrays for all active categories, returning the best match. Falls back to `"Other"` if no match.

---

### 🎯 Budget — `/api/budget`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/budget` | Private | Set or update the monthly budget (`limitAmount`) and optional `savingGoal` for a given `month` and `year`. Uses upsert logic |
| `GET` | `/budget` | Private | Retrieve budget status for `?month=&year=`. Returns `totalSpent`, `utilization %`, `isExceeded`, `isNearLimit`, and a `warning` string |

---

### 📊 Analysis — `/api/analysis`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/analysis` | Private | Returns full financial analysis: category breakdown, monthly growth %, predicted expense, financial health score (0–100), insights array, and pattern-control data |

> This is the core intelligence endpoint. See [Core Functional Logic](#core-functional-logic) for a full breakdown.

---

### 🔔 Notifications — `/api/notifications`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Private | Fetch all active (non-dismissed) notifications. **Dynamically syncs** budget alerts, group alerts, and spending insights to the DB before responding |
| `PATCH` | `/notifications/mark-all-read` | Private | Mark all notifications as read |
| `PATCH` | `/notifications/:id/read` | Private | Mark a single notification as read |
| `DELETE` | `/notifications/clear-all` | Private | Soft-delete (dismiss) all notifications |
| `DELETE` | `/notifications/:id` | Private | Soft-delete a single notification |

---

### 👥 Groups — `/api/groups`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/groups` | Private | Create a new group. Auto-generates a 6-char `inviteCode` and `inviteLink`. Creator is added as first member |
| `GET` | `/groups` | Private | Get all groups where the authenticated user is a member |
| `POST` | `/groups/join` | Private | Join a group by providing an `inviteCode` |
| `GET` | `/groups/:id` | Private | Get a group by ID (membership check enforced) |
| `PUT` | `/groups/:id` | Private | Update group name/description (creator only) |
| `DELETE` | `/groups/:id` | Private | Delete a group (creator only) |
| `PUT` | `/groups/:id/members` | Private | Add a new member (by name/email; auto-links to registered user) |
| `PUT` | `/groups/:id/members/:memberId` | Private | Update a member's name/email (creator only) |
| `DELETE` | `/groups/:id/members/:memberId` | Private | Remove a member (creator only; cannot remove creator) |

---

### 💰 Group Expenses — `/api/group-expenses`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/group-expenses` | Private | Add a group expense. Calculates splits, runs settlement algorithm, notifies debtors and members via FCM |
| `GET` | `/group-expenses/:groupId` | Private | Get all expenses for a group |
| `GET` | `/group-expenses/:groupId/settlements` | Private | Run **Debt Optimization Algorithm** and return the optimized settlement plan |
| `PUT` | `/group-expenses/:groupId/:expenseId` | Private | Update a group expense and recalculate settlements |
| `DELETE` | `/group-expenses/:groupId/:expenseId` | Private | Delete a group expense and notify all members |
| `PATCH` | `/group-expenses/:groupId/settlements/:expenseId/:settlementId/paid` | Private | Mark a settlement as paid. Sends FCM confirmation to the payee |

---

### 💵 Income — `/api/incomes`

| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/incomes` | Private | Record a new income entry. Month/year auto-populated from date |
| `GET` | `/incomes` | Private | Retrieve income records with optional filters |
| `DELETE` | `/incomes/:id` | Private | Delete an income record |

---

### 📋 Reports — `/api/reports`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/reports` | Private | Generate a monthly financial report comparing income vs. expenses per category |

---

### 🏷️ Categories — `/api/categories`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | Private | Get all active categories with their keywords and icons |
| `POST` | `/categories` | Admin | Create a new category with name, type, keywords |
| `PUT` | `/categories/:id` | Admin | Update a category |
| `DELETE` | `/categories/:id` | Admin | Deactivate a category |

---

### 🛡️ Admin — `/api/admin`

| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | Admin | Get all registered users |
| `GET` | `/admin/analytics` | Admin | Platform-wide analytics |
| `PATCH` | `/admin/users/:id/block` | Admin | Block a user account |
| `PATCH` | `/admin/users/:id/unblock` | Admin | Unblock a user account |
| `DELETE` | `/admin/users/:id` | Admin | Delete a user account |

---

## ⚙️ Core Functional Logic

### a) Budget Alert Logic

**Files:** `controllers/budgetController.js`, `controllers/notificationController.js`, `controllers/analysisController.js`

The budget alert system operates at **two thresholds**:

#### 80% Warning Threshold (UI-level, no FCM)

Detected in `getBudgetStatus()` (Budget Controller):
```
utilization = (totalSpent / limitAmount) * 100
isNearLimit = !isExceeded && utilization >= 80
warning = "⚠️ You have used X% of your budget. You are approaching your limit!"
```
This warning is included in the API response and rendered in the Budget UI. It is also synced as a `BUDGET_WARNING` notification in the DB when `GET /api/notifications` is called.

#### 100% Exceeded Threshold (FCM Push + DB Notification)

`checkAndNotifyBudgetOverflow(userId, month, year)` is an **internal helper** called automatically after every expense creation, update, or deletion:

```
if totalSpent > limitAmount:
  1. Fetch all FCM tokens for the user
  2. Send FCM push: "Budget Exceeded 🚨 — You have exceeded your monthly budget by ₹X!"
     data.url = "/budget"  (deep link)
  3. Sync BUDGET_EXCEEDED notification to DB for the Alerts page
```

> **One-time control:** The `referenceId` pattern `budget-{userId}-{month}-{year}` ensures the DB notification is created only once per month using a unique sparse index on `Notification.referenceId`.

---

### b) Inactivity Detection Logic

**File:** `controllers/userController.js` — `authUser()`

Executes on **every login attempt**, immediately after successful credential verification:

```
Step 1: Find the most recent expense for this user (sorted by date DESC)
Step 2: Calculate hoursSinceLastExpense = (Date.now() - lastExpense.date) / (1000 * 60 * 60)
Step 3: isInactive = hoursSinceLastExpense > 24 || no expense exists at all
Step 4: If isInactive AND user has FCM tokens:
    - Check if an 'inactivity-{userId}-{date}' notification already exists in the last 24h
    - If not: Send FCM push notification:
        title: "Inactivity Alert"
        body: "You haven't added any expense today. Please update to maintain accurate tracking."
        data.route = "/dashboard"
    - Create the Notification DB record with referenceId = inactivity-{userId}-{YYYY-MM-DD}
```

> This ensures the alert fires **at most once per day per user**, preventing notification spam even if the user logs in multiple times.

---

### c) Smart Alert Logic

**File:** `controllers/expenseController.js` — `createExpense()`

Fires on every **new expense creation**, immediately after the record is saved:

```
Step 1: Calculate avgDaily = sum of expenses in last 30 days / 30
Step 2: Calculate todaysTotal = sum of all expenses today (00:00 to 23:59)
Step 3: If avgDaily > 0 AND todaysTotal > avgDaily * 2:
    - Check if a 'smart-alert-{userId}-{date}' notification already exists in the last 24h
    - If not: Send FCM push:
        title: "Smart Alert"
        body: "Unusual high spending detected today. Please review your expenses."
        data.route = "/expenses"
    - Create DB Notification with referenceId = smart-alert-{userId}-{YYYY-MM-DD}
```

**Trigger condition:** Today's cumulative spending has **doubled** the user's rolling 30-day daily average.

> **Deduplication:** The `smart-alert-` referenceId prefix and 24-hour TTL check prevent multiple alerts on the same day, even if many expenses are logged.

---

### d) Pattern-Based Analysis

**File:** `controllers/analysisController.js` — `getAnalysisSummary()`

Runs **5 concurrent MongoDB aggregations** for maximum performance:

#### Average Daily Expense
```
last30DaysTotal = SUM of all expenses from (today - 30 days) to today
averageDailyExpense = last30DaysTotal / 30
```

#### Monthly Prediction (Pattern-based)
```
expectedMonthly = averageDailyExpense * 30
```
This represents what the user is **on track to spend** this month based on their recent behaviour.

#### Future Expense Prediction (Historical average)
```
threeMonthsTotal = SUM of expenses from 3 months ago to last month
predictedExpense = threeMonthsTotal / number_of_months_with_data
```
A 3-month moving average gives a smoother, history-adjusted prediction.

#### Monthly Growth Percentage
```
monthlyGrowth = ((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100
```

#### Financial Health Score
```
if budget exists:
    budgetUtilized = (currentMonthSpend / budget.limitAmount) * 100
    if budgetUtilized > 100: healthScore = max(0, 100 - (budgetUtilized - 100))
    else if budgetUtilized > 80: healthScore = 90
else:
    healthScore = currentMonthSpend > 0 ? 50 : 100
```

#### Category Budget Threshold Check (inside Analysis)
The analysis endpoint also evaluates category-level thresholds using `assumedCategoryBudget = totalBudget * 0.3`:
- `categoryUsage > 100%` → **Critical insight** + FCM push notification (one-time per month per category)
- `categoryUsage > 80%` → **Warning insight** (UI-only, no FCM)

---

### e) Debt Optimization Algorithm

**File:** `controllers/groupExpenseController.js` — `getGroupSettlements()`

This is a **greedy debt simplification algorithm** that minimizes the total number of financial transactions needed to settle all debts within a group.

#### Problem
In a group of N people with multiple shared expenses, a naive approach would track every individual transaction. For 5 people with 10 expenses, this could result in 40+ transactions.

#### Algorithm Steps

**Step 1 — Compute Net Balances**
```
For every expense in the group:
  paidBy[member] += amount they paid
  splitBetween[member] -= their share of the expense
  settlements[settled] ← adjust balance if reimbursementStatus === 'paid'

netBalance[member] = totalPaid - totalOwed
```

**Step 2 — Classify Members**
```
debtors  = members where netBalance < -0.01  (they owe money)
creditors = members where netBalance > 0.01  (they are owed money)
```

**Step 3 — Sort for Greedy Matching**
```
Sort debtors ascending  (most negative balance first — largest debtor first)
Sort creditors descending (largest positive balance first — largest creditor first)
```

**Step 4 — Greedy Settlement**
```
i = 0, j = 0
while i < debtors.length AND j < creditors.length:
    settleAmt = min(abs(debtors[i].balance), creditors[j].balance)
    
    Record: debtors[i] → pays → creditors[j] → ₹settleAmt
    
    debtors[i].balance  += settleAmt
    creditors[j].balance -= settleAmt
    
    if |debtors[i].balance| < 0.01: move to next debtor (i++)
    if |creditors[j].balance| < 0.01: move to next creditor (j++)
```

#### Result
The algorithm produces the **minimum number of transactions** to fully settle all group debts. For example, if A owes B ₹100 and C owes A ₹100, the algorithm collapses this into a single transaction: C → B ₹100, instead of two separate ones.

#### Where It Is Used
1. **`getGroupSettlements()`** — Called via `GET /api/group-expenses/:groupId/settlements`. Returns `optimizedSettlements` array to the Settlement page.
2. **`calculateSettlements()`** — A simpler variant used internally when a group expense is created (`addGroupExpense`) or updated (`updateGroupExpense`). This calculates the per-expense level settlements for that specific transaction.

> **Floating-point Safety:** All amounts are rounded to 2 decimal places using `Math.round(x * 100) / 100` to prevent cumulative floating-point errors (e.g., 0.1 + 0.2 ≠ 0.3 issue).

---

### f) Notification System (FCM)

**Files:** `utils/notificationHelper.js`, `config/firebaseAdmin.js`

#### Firebase Admin Initialization

The server initializes the Firebase Admin SDK with two credential fallback options:

1. **Primary:** Reads `serviceAccountKey.json` from the project root
2. **Fallback:** Uses environment variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Singleton pattern ensures only one Firebase app is initialized (`admin.apps.length > 0` check).

#### Token Retrieval — `getTokensFromUsers(userIds[])`

```
users = User.find({ _id: { $in: userIds } })
Flatten all users' fcmTokens arrays into a single token list
Return the combined array
```

#### FCM Dispatch — `sendPushNotification(tokens[], payload)`

Sends a **multicast** message (one API call, multiple tokens):

```javascript
{
  notification: { title, body },
  data: { ...payload.data },        // Custom key-value pairs (for deep linking)
  android: {
    priority: "high",
    notification: { clickAction: payload.data.route || payload.data.url }
  },
  webpush: {
    headers: { Urgency: "high" },
    notification: { icon: "/pwa-192x192.png", badge: "/pwa-192x192.png" },
    fcm_options: { link: payload.data.route || payload.data.url }
  },
  tokens: tokens[]
}
```

**Deep Linking:** Both Android and WebPush configs map `data.route` or `data.url` to the notification's click action, routing the user to the appropriate in-app page when the notification is tapped.

**Stale Token Cleanup:** After each send, if `failureCount > 0`, failed tokens with codes `messaging/registration-token-not-registered` or `messaging/invalid-registration-token` are automatically pulled from all users' `fcmTokens` arrays using `$pull`.

#### Group Broadcaster — `notifyGroupMembers(groupId, senderId, payload)`

Fetches group members, excludes the sender, retrieves their tokens, and dispatches the notification to all others. Used for group expense add/update/delete events.

#### One-Time Alert Control

Every automated alert (budget, smart, inactivity, category overspending) uses a **`referenceId`** stored in the `Notification` collection:

| Alert Type | referenceId Pattern |
|---|---|
| Budget exceeded | `budget-{userId}-{month}-{year}` |
| Budget warning | `budget-warning-{userId}-{month}-{year}` |
| Inactivity | `inactivity-{userId}-{YYYY-MM-DD}` |
| Smart alert | `smart-alert-{userId}-{YYYY-MM-DD}` |
| Category overspending | `category-budget-{userId}-{category}-{month}-{year}` |
| Spending insight | `spending-insight-{userId}-{month}-{year}` |

A **unique sparse index** on `Notification.referenceId` prevents duplicate DB records. Before dispatching FCM, the code checks for an existing notification with that referenceId to prevent redundant push notifications.

#### Deep Linking Payload Reference

| Trigger | `data.route` / `data.url` | Target Page |
|---|---|---|
| Budget exceeded | `/budget` | Budget page |
| Smart alert | `/expenses` | Expenses page |
| Inactivity alert | `/dashboard` | Dashboard |
| Category overspending | `/dashboard` | Dashboard |
| Settlement payment due | `/groups/settlement` | Settlement page |
| New group expense | `/group/{groupId}` | Group page |

---

## 🗄️ Database Models

### User (`userModel.js`)

```
{
  name:       String (required)
  email:      String (required, unique)
  password:   String (required, bcrypt hashed — saltRounds: 10)
  role:       String (enum: ['personal', 'admin'], default: 'personal')
  isBlocked:  Boolean (default: false)
  status:     String (enum: ['active', 'blocked', 'pending'], default: 'active')
  fcmTokens:  [String] (array of registered device tokens, default: [])
  createdAt, updatedAt (timestamps)
}
```

- `matchPassword(enteredPassword)` — bcrypt compare method
- Pre-save hook: automatically hashes password when `isModified('password')`

---

### Expense (`expenseModel.js`)

```
{
  userId:             ObjectId → User (required)
  groupId:            ObjectId → Group
  paidByMember:       ObjectId (for group sub-member tracking)
  title:              String (required, trimmed)
  amount:             Number (required, min: 0.01)
  category:           String (required, auto-detected)
  note:               String
  location:           String
  date:               Date (required, default: Date.now)
  paymentMethod:      String (enum: ['cash','upi','card','netbanking','other'], default: 'cash')
  recurring:          Boolean (default: false)
  recurringProcessed: Boolean (default: false)
  createdAt, updatedAt (timestamps)
}
```

**Indexes:**
- `{ userId: 1 }` — for user-scoped queries
- `{ userId: 1, date: -1 }` — for sorted expense lists

---

### Budget (`budgetModel.js`)

```
{
  userId:      ObjectId → User (required)
  month:       Number (1–12, required)
  year:        Number (required)
  limitAmount: Number (required)
  savingGoal:  Number (default: 0)
  createdAt, updatedAt (timestamps)
}
```

---

### Group (`groupModel.js`)

```
{
  name:        String (required, trimmed)
  createdBy:   ObjectId → User (required)
  description: String
  inviteCode:  String (unique, 6-char alphanumeric, auto-generated)
  inviteLink:  String (full URL for sharing)
  members: [{
    user:     ObjectId → User
    name:     String
    email:    String
    joinedAt: Date (default: Date.now)
  }]
  createdAt, updatedAt (timestamps)
}
```

---

### GroupExpense (`groupExpenseModel.js`)

```
{
  groupId:    ObjectId → Group (required)
  title:      String (required)
  amount:     Number (required, min: 0.01)
  paidBy:     [{ user: ObjectId, name: String, amount: Number }]
  splitBetween:[{ user: ObjectId, name: String, amount: Number }]
  splitType:  String (enum: ['equal','exact','percentage','custom'], default: 'equal')
  splitDetails:[{ user: ObjectId, name: String, share: Number }]
  settlements: [{
    from: { user: ObjectId, name: String }
    to:   { user: ObjectId, name: String }
    amount: Number
    reimbursementStatus: String (enum: ['pending','paid','overdue'], default: 'pending')
    paymentMethod: String (enum: ['cash','upi','bank_transfer'])
    paymentDate: Date
    dueDate: Date (default: +7 days)
    requestedBy: ObjectId → User
    requestedTo:  ObjectId → User
  }]
  category: String (required, default: 'General')
  note:     String
  date:     Date (default: Date.now)
  createdAt, updatedAt (timestamps)
}
```

---

### Notification (`notificationModel.js`)

```
{
  user:        ObjectId → User (required)
  type:        String (enum: [
                  'BUDGET_EXCEEDED', 'BUDGET_WARNING', 'OVERSPENDING_WARNING',
                  'SMART_INSIGHT', 'SETTLEMENT_PENDING', 'GROUP_EXPENSE',
                  'PAYMENT_RECEIVED', 'INFO'
               ], required)
  message:     String (required)
  read:        Boolean (default: false)
  details:     Mixed (arbitrary metadata object)
  referenceId: String (unique sparse — prevents duplicate alerts)
  dismissed:   Boolean (default: false)
  createdAt, updatedAt (timestamps)
}
```

**Indexes:**
- `{ user: 1, createdAt: -1 }` — for paginated notification fetching
- `{ referenceId: 1 }` — unique sparse index to prevent duplicate system notifications

---

### Income (`incomeModel.js`)

```
{
  userId:      ObjectId → User (required)
  amount:      Number (required, min: 0.01)
  title:       String (required)
  category:    String (required)
  description: String
  date:        Date (required, default: Date.now)
  month:       Number (1–12, auto-populated from date via pre-save hook)
  year:        Number (auto-populated from date via pre-save hook)
  createdAt, updatedAt (timestamps)
}
```

---

### Category (`categoryModel.js`)

```
{
  name:     String (required, unique)
  type:     String (enum: ['expense', 'income'], default: 'expense')
  icon:     String (icon name, default: 'Category')
  keywords: [String] (keyword array used for auto-detection)
  isActive: Boolean (default: true)
  createdAt, updatedAt (timestamps)
}
```

---

### Settlement (`settlementModel.js`)

A separate settlement record model (used for tracking standalone settlement payments).

---

## 🔒 Middleware

### Authentication Middleware (`authMiddleware.js`)

**`protect`** — Applied to all private routes:
```
1. Extracts token from: req.headers.authorization ("Bearer <token>")
2. Verifies JWT signature using process.env.JWT_SECRET
3. Fetches user from DB (excluding password field)
4. If user not found → 401 "User not found"
5. If token invalid/expired → 401 "Not authorized, token failed"
6. If no token present → 401 "Not authorized, no token"
7. On success: attaches user object to req.user, calls next()
```

**`admin`** — Applied after `protect` for admin-only routes:
```
if req.user.role === 'admin': next()
else: 401 "Not authorized as an admin"
```

### Error Handling Middleware (`errorMiddleware.js`)

Two handlers registered at the end of the Express pipeline:

**`notFound`** — Catches any unmatched route:
```
Creates Error("Not Found - {originalUrl}") → 404
```

**`errorHandler`** — Global error formatter:
```
statusCode = res.statusCode === 200 ? 500 : res.statusCode
Response: { message: err.message, stack: (development only) }
```

---

## 🛠️ Technologies Used

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 5.2.1 | HTTP server framework |
| MongoDB | — | Primary database |
| Mongoose | 8.23.0 | ODM for MongoDB |
| Firebase Admin SDK | 13.7.0 | Server-side FCM push notifications |
| JSON Web Token (JWT) | 9.0.3 | Stateless authentication |
| bcrypt | 6.0.0 | Password hashing |
| dotenv | 17.3.1 | Environment variable loading |
| cors | 2.8.6 | Cross-Origin Resource Sharing |
| express-rate-limit | 8.3.2 | API rate limiting |
| nodemon | — (dev) | Hot-reload development server |

---

## 🔐 Environment Variables

Create a `.env` file in the `server/` directory:

```env
# App
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/expentra

# Auth
JWT_SECRET=your_super_secure_jwt_secret_key

# Frontend URL (for CORS + invite links)
FRONTEND_URL=http://localhost:5173

# Firebase Admin (fallback — prefer serviceAccountKey.json)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

> **Primary Firebase credential:** Place your `serviceAccountKey.json` file in the `server/` root. The server reads this file first and falls back to environment variables only if the file is not found.

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Firebase project with Cloud Messaging enabled + Admin SDK service account key

### Steps

```bash
# 1. Navigate to the server directory
cd server

# 2. Install dependencies
npm install

# 3. Create and populate your .env file (see above)

# 4. Place serviceAccountKey.json in the server/ directory (from Firebase Console)

# 5. Start the development server
npm run dev
# OR for production
npm start
```

The API will be available at `http://localhost:5000`

### Verify Setup

```bash
curl http://localhost:5000/
# Response: "API is running..."
```

---

## 🔗 Related

- [Client README](../client/README.md) — Frontend documentation
- [Root README](../README.md) — Full system documentation
