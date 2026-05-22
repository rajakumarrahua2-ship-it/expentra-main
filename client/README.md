<div align="center">

# 💳 Expentra

### Smart Expense & Financial Control System

*From passive tracking to active financial intelligence.*

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-FCM-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

</div>

---

## 📖 Project Overview

**Expentra** is a full-stack MERN (MongoDB, Express, React, Node.js) application that transforms traditional expense tracking into an intelligent, proactive financial decision-support system.

Unlike conventional expense trackers that simply record and display data, Expentra **actively monitors** your financial behaviour, **detects anomalies in real-time**, **predicts future spending**, and **delivers personalized push notifications** with deep linking directly to the relevant section of the app.

The system operates in two parallel modes:
- **Personal Mode** — Individual expense tracking with budget monitoring and financial analysis
- **Group Mode** — Shared expense management with automatic debt calculation and an optimized settlement algorithm

Built as a full-stack MERN project, Expentra is designed to be a **final-year capstone-grade** application demonstrating complex backend algorithms, real-time notification infrastructure, and a polished, responsive UI.

---

## 🚀 Key Features

### 1. 💰 Smart Budget Control

- Set a monthly spending limit (`limitAmount`) and optional savings goal per month
- **Dual threshold alert system:**
  - At **80% utilization** → UI warning card + `BUDGET_WARNING` notification synced to DB
  - At **100% (exceeded)** → FCM push notification dispatched to all registered devices + `BUDGET_EXCEEDED` notification persisted
- Budget re-evaluated automatically after every expense create, update, or delete

### 2. 🧠 Behavioral Analysis

- On every login, the server checks **when the user last logged an expense**
- If no expense has been logged in the **last 24 hours**, an **Inactivity Alert** FCM notification is dispatched:
  *"You haven't added any expense today. Please update to maintain accurate tracking."*
- Each inactivity alert fires **at most once per day** (controlled via `referenceId` + 24h check)

### 3. ⚡ Smart Alerts — Unusual Spending Detection

- On every new expense creation, the server evaluates real-time spending velocity:
  - Calculates the user's **30-day rolling daily average** (`total_last_30_days / 30`)
  - Calculates **today's cumulative total**
  - If `todaysTotal > dailyAverage × 2` → triggers a **Smart Alert** push notification:
    *"Unusual high spending detected today. Please review your expenses."*
- Deep-links the user directly to `/expenses`
- Fires at most once per calendar day

### 4. 📊 Predictive Expense System

The `/api/analysis` endpoint runs **5 concurrent MongoDB aggregations** and returns:

| Metric | Calculation Method |
|---|---|
| **Monthly Growth %** | `(thisMonth - lastMonth) / lastMonth × 100` |
| **Predicted Expense (Historical)** | 3-month moving average |
| **Expected Monthly (Pattern)** | `(last 30 days total / 30) × 30` |
| **Average Daily Expense** | `last 30 days total / 30` |
| **Financial Health Score** | 0–100 score based on budget utilization |

Category-level insights are also generated — top 5 spending categories are checked against 30% of the total budget each. **Critical** (>100%) categories trigger FCM alerts; **Warning** (>80%) categories generate UI insight cards.

### 5. 🔄 Optimized Group Settlement Algorithm

When settling group debts, a naive approach might require N×M transactions. Expentra implements a **greedy debt simplification algorithm**:

1. Computes each member's **net balance** across all group expenses
2. Separates members into **debtors** (negative balance) and **creditors** (positive balance)
3. Sorts both lists by magnitude (largest debtor ↔ largest creditor first)
4. Iteratively matches the largest debtor with the largest creditor, recording the minimum of the two as the settlement amount
5. Advances to the next pair when either side is settled

**Result:** The minimum number of transactions to fully settle all group debts. A 5-member group with 20 expenses might have 80 individual debts collapsed into just 4 transactions.

### 6. 🔔 Real-time Notifications with Deep Linking

FCM (Firebase Cloud Messaging) is integrated end-to-end:

**Server-side (Firebase Admin SDK):**
- `sendPushNotification(tokens[], payload)` sends multicast messages to all registered devices
- Each notification payload includes `data.route` or `data.url` for deep linking
- Stale/invalid device tokens are automatically pruned from the database

**Client-side (Firebase SDK):**
- `getFCMToken()` requests permission, registers the service worker, and obtains the FCM token
- The token is registered server-side via `POST /api/auth/fcm-token`
- `onMessage()` listener handles **foreground** notifications — displays a toast with the notification content
- **Clicking the toast** reads `payload.data.route` and navigates the user directly to the correct page (deep linking)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXPENTRA SYSTEM                          │
│                                                                 │
│  ┌───────────────┐     REST API      ┌───────────────────────┐  │
│  │               │ ◄──── Axios ────► │                       │  │
│  │   React 19    │  + Interceptors   │   Node.js + Express 5 │  │
│  │   (Vite SPA)  │                   │   (REST API Server)   │  │
│  │               │                   │                       │  │
│  │  • Auth ctx   │                   │  • JWT Auth           │  │
│  │  • FCM client │                   │  • Rate limiting      │  │
│  │  • Recharts   │                   │  • Controllers        │  │
│  │  • Deep links │                   │  • Algorithms         │  │
│  └───────────────┘                   └─────────┬─────────────┘  │
│         ▲                                      │                 │
│         │ FCM Push                             │ Mongoose ODM    │
│         │ (foreground +                        ▼                 │
│         │  background)             ┌───────────────────────┐     │
│         │                          │        MongoDB         │     │
│  ┌──────┴────────┐                 │                       │     │
│  │    Firebase   │◄────Admin SDK───│  • Users              │     │
│  │  Cloud Msg    │                 │  • Expenses           │     │
│  │    (FCM)      │                 │  • Budgets            │     │
│  └───────────────┘                 │  • Groups             │     │
│                                    │  • GroupExpenses      │     │
│                                    │  • Notifications      │     │
│                                    │  • Income             │     │
│                                    │  • Categories         │     │
│                                    └───────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works — Step-by-Step Flow

### 1. User Registration & Authentication
```
Register (name/email/password) 
  → Password validated (min 8 chars, uppercase, lowercase, number)
  → Password bcrypt-hashed (saltRounds: 10)
  → User created in MongoDB
  → JWT returned (stateless, no session)

Login 
  → Credentials verified
  → JWT issued
  → Inactivity check runs (last expense < 24h ago?)
  → If inactive + FCM token exists → push notification dispatched
  → Google OAuth: Firebase auth → email sent to /api/auth/google → JWT issued
```

### 2. Expense Creation → Budget Check → Smart Alert
```
User adds expense (title, amount, date, method)
  → Server auto-detects category from title keywords
  → Expense saved to MongoDB
  → [Async] checkAndNotifyBudgetOverflow() called:
      • Aggregates totalSpent this month
      • If totalSpent > budget.limitAmount → FCM push + DB notification
  → [Async] Smart Alert check:
      • Calculates 30-day rolling daily average
      • Calculates today's total
      • If today > avg × 2 → FCM push + DB notification (once per day)
  → 201 response returned to client
```

### 3. Financial Analysis → Insights
```
Client visits Analysis page → GET /api/analysis
  → 5 concurrent MongoDB aggregations execute:
      • Category breakdown (this month)
      • Last month total (for growth %)
      • 3-month average (for prediction)
      • Current budget (for health score)
      • Last 30 days (for pattern analysis)
  → Server computes: topCategory, monthlyGrowth, predictedExpense, healthScore
  → Category insights generated:
      • >100% category budget → FCM notification + critical insight
      • >80% category budget → warning insight (UI only)
  → Full analysis payload returned to client
  → Client renders charts, insight cards, pattern metrics
```

### 4. Group Expense → Algorithm → Settlement
```
User adds group expense (title, amount, paidBy[], splitType, members)
  → Server calculates splits:
      • Equal: amount ÷ members, floating-point corrected
      • Exact: manual per-member amounts
      • Percentage: percentage shares converted to amounts
  → calculateSettlements() runs per-expense settlement matrix
  → GroupExpense saved with paidBy, splitBetween, settlements
  → FCM notifications:
      • Debtors: "You owe ₹X to [name]" → deep links to /groups/settlement
      • Other members: "New expense added" → deep links to group page

GET /groups/:id/settlements
  → All group expenses loaded
  → Net balance computed for every member
  → Debt Optimization Algorithm runs (greedy matching)
  → Minimum transaction set returned as optimizedSettlements[]
  → Client renders settlement plan

Mark as Paid
  → Settlement status updated to 'paid' + paymentDate recorded
  → FCM confirmation sent to payee: "Payment Received 💰"
```

### 5. Notifications → FCM → Deep Linking
```
Server event triggers FCM (budget exceeded, smart alert, etc.)
  → sendPushNotification(tokens[], { title, body, data: { route } })
  → Firebase multicast to all user devices
  → Failed/stale tokens auto-removed from User.fcmTokens

Client (foreground):
  → onMessage() fires with payload
  → Duplicate check via messageId Set
  → fetchNotifications() called to sync bell icon
  → Clickable toast shown (React Toastify)
  → User clicks toast → window.location.href = payload.data.route

Client (background / PWA):
  → Service worker handles notification display
  → User taps notification → browser navigates to deep link URL
```

---

## 🧮 Algorithms Used

### 1. Debt Simplification Algorithm
**Location:** `server/controllers/groupExpenseController.js` → `getGroupSettlements()`

A greedy algorithm that reduces N financial obligations to the minimum number of payment transactions. Works by computing net balances, sorting debtors/creditors by magnitude, and iteratively settling the largest imbalances first.

**Complexity:** O(N log N) for sorting + O(N) for settlement loop = **O(N log N)**

### 2. Budget Threshold Logic
**Location:** `server/controllers/budgetController.js` + `analysisController.js`

Two-tier threshold system operating at both the **overall budget level** (80%/100%) and the **per-category level** (computed as 30% of total budget per category). Different responses at each threshold: UI warning, DB notification, FCM push.

### 3. Pattern Analysis Logic
**Location:** `server/controllers/analysisController.js`

Two prediction models running concurrently:
- **Historical prediction:** 3-month moving average of past expenditure
- **Pattern projection:** Rolling 30-day daily average × 30 (behaviour-based projection)

The financial health score is derived from budget utilization with a penalty curve: linear reduction above 100% utilization, partial deduction in the 80–100% zone.

### 4. Smart Anomaly Detection
**Location:** `server/controllers/expenseController.js` → `createExpense()`

Compares today's total spending against 2× the rolling 30-day daily average. Triggers a contextual alert when unusual spending velocity is detected.

### 5. Category Auto-Detection
**Location:** `server/utils/categoryDetector.js`

Keyword frequency matching: the expense title is lowercased and matched against each active category's keyword array. The category with the most keyword hits wins. Falls back to `"Other"` when no match is found.

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 19.2.0 | UI framework |
| **Frontend** | Vite | 7.3.1 | Build tool + dev server |
| **Frontend** | React Router DOM | 7.13.1 | Client-side routing |
| **Frontend** | Axios | 1.13.6 | HTTP client + interceptors |
| **Frontend** | Recharts | 3.7.0 | Data visualization |
| **Frontend** | React Toastify | 11.0.5 | Toast notifications |
| **Frontend** | Tailwind CSS | 3.4.19 | Utility-first styling |
| **Frontend** | vite-plugin-pwa | 1.2.0 | PWA + service worker |
| **Frontend** | html2pdf.js | 0.14.0 | PDF export |
| **Backend** | Node.js | 18+ | JavaScript runtime |
| **Backend** | Express | 5.2.1 | HTTP framework |
| **Backend** | Mongoose | 8.23.0 | MongoDB ODM |
| **Backend** | JWT | 9.0.3 | Stateless auth |
| **Backend** | bcrypt | 6.0.0 | Password hashing |
| **Backend** | express-rate-limit | 8.3.2 | API rate limiting |
| **Database** | MongoDB Atlas | 8.0 | Primary database |
| **Notifications** | Firebase Admin SDK | 13.7.0 | Server-side FCM |
| **Notifications** | Firebase SDK | 12.11.0 | Client-side FCM + Auth |

---

## 📁 Folder Structure

```
EXPENTRA/
│
├── client/                          # React Frontend (Vite SPA + PWA)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── App.jsx                  # Root: routing, Axios config, interceptors
│   │   ├── firebase.js              # Firebase SDK (Auth, Messaging, Analytics)
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global state: auth, mode, notifications, FCM
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Protected page shell
│   │   │   ├── Navbar.jsx           # Top nav + notification bell
│   │   │   ├── Sidebar.jsx          # Mode-aware navigation sidebar
│   │   │   ├── ProtectedRoute.jsx   # Route guard
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Financial hub
│   │   │   ├── Expenses.jsx         # Expense management
│   │   │   ├── Budget.jsx           # Budget setup + monitoring
│   │   │   ├── Analysis.jsx         # Insights + predictions
│   │   │   ├── Alerts.jsx           # Notification centre
│   │   │   ├── Reports.jsx          # Report + PDF export
│   │   │   ├── group/               # Group expense pages
│   │   │   │   ├── Settlement.jsx   # Debt optimization view
│   │   │   │   └── ...
│   │   │   └── admin/               # Admin panel pages
│   │   └── utils/
│   │       ├── getFCMToken.js       # FCM token registration
│   │       └── categoryDetector.js  # Client-side category matching
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── server.js                    # Entry point: app config, route mounting
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── firebaseAdmin.js         # Firebase Admin SDK initialization
│   ├── controllers/
│   │   ├── userController.js        # Auth + Inactivity Detection
│   │   ├── expenseController.js     # Expense CRUD + Smart Alert
│   │   ├── budgetController.js      # Budget CRUD + Overflow Check
│   │   ├── analysisController.js    # Financial Analysis + Pattern Logic
│   │   ├── notificationController.js# Notification sync + management
│   │   ├── groupController.js       # Group CRUD + invite system
│   │   ├── groupExpenseController.js# Group expenses + Debt Algorithm
│   │   ├── incomeController.js      # Income management
│   │   ├── reportController.js      # Report generation
│   │   └── adminController.js       # Admin user management
│   ├── models/
│   │   ├── userModel.js             # User schema + bcrypt hooks
│   │   ├── expenseModel.js          # Expense schema + indexes
│   │   ├── budgetModel.js           # Budget schema
│   │   ├── groupModel.js            # Group + member schema
│   │   ├── groupExpenseModel.js     # Group expense + settlement schema
│   │   ├── notificationModel.js     # Notification schema + dedup index
│   │   ├── incomeModel.js           # Income schema
│   │   └── categoryModel.js         # Category + keywords schema
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT protect + admin guard
│   │   └── errorMiddleware.js       # 404 + global error handler
│   ├── routes/
│   │   ├── userRoutes.js            # /api/auth
│   │   ├── expenseRoutes.js         # /api/expenses
│   │   ├── budgetRoutes.js          # /api/budget
│   │   ├── analysisRoutes.js        # /api/analysis
│   │   ├── notificationRoutes.js    # /api/notifications
│   │   ├── groupRoutes.js           # /api/groups
│   │   ├── groupExpenseRoutes.js    # /api/group-expenses
│   │   ├── incomeRoutes.js          # /api/incomes
│   │   ├── reportRoutes.js          # /api/reports
│   │   ├── categoryRoutes.js        # /api/categories
│   │   └── adminRoutes.js           # /api/admin
│   ├── utils/
│   │   ├── notificationHelper.js    # FCM dispatch + token cleanup
│   │   ├── categoryDetector.js      # Keyword-based category matching
│   │   └── generateToken.js         # JWT generator
│   ├── serviceAccountKey.json       # Firebase Admin credentials (gitignored)
│   └── package.json
│
├── README.md                        # This file
└── .gitignore
```

---

## ⚙️ Installation Guide

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB 6+)
- Firebase project with **Authentication** and **Cloud Messaging** enabled
- Firebase Admin SDK `serviceAccountKey.json`

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Vansh1945/expentra.git
cd expentra
```

### Step 2 — Setup the Server

```bash
cd server
npm install
```

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/expentra
JWT_SECRET=your_jwt_secret_min_32_chars
FRONTEND_URL=http://localhost:5173

# Firebase Admin fallback (if not using serviceAccountKey.json)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

Place your `serviceAccountKey.json` inside `server/`.

```bash
# Start the backend
npm run dev
```

### Step 3 — Setup the Client

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_VAPID_KEY=your_fcm_web_push_vapid_key
```

```bash
# Start the frontend
npm run dev
```

### Step 4 — Verify

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000` (returns `"API is running..."`)

---

## 💡 Unique Selling Points

### 1. Active Financial Control vs Passive Tracking

Most expense trackers are **rearview mirrors** — they show what you spent after the fact. Expentra is a **windshield** — it actively monitors your spending behaviour and warns you before you exceed your limits, not after. Budget thresholds, smart alerts, and inactivity detection all fire in real-time during normal app usage.

### 2. Intelligent Multi-Layer Alert System

Expentra's notification system is **context-aware and layered**:
- **Budget-level alerts** → total monthly spending against your set limit
- **Category-level alerts** → individual category overruns (top-5 categories, 30% of total budget each)
- **Anomaly detection** → velocity-based (today's spend vs 30-day average)
- **Inactivity detection** → behavioural (missed logging detected on login)

Each alert type uses a unique `referenceId` with deduplication logic to prevent notification spam — a user can't receive the same alert twice in a day or the same monthly alert twice in a month.

### 3. Hybrid Personal + Group Finance System

Unlike apps that focus exclusively on personal finance or group splitting, Expentra **combines both** in a single platform with a seamless mode-switch. The same user can track personal expenses with full budget intelligence, then switch to group mode to manage shared expenses with optimized settlement — all without leaving the app or switching accounts.

---

## 🚧 Future Enhancements

| Feature | Description |
|---|---|
| **Recurring Expense Automation** | Auto-log recurring expenses at scheduled intervals |
| **Bank Statement Import** | CSV/PDF upload with auto-parsing and categorization |
| **AI Category Suggestions** | ML-based category prediction using expense history |
| **Multi-currency Support** | Exchange rate integration for international groups |
| **Expense Receipt Scanning** | OCR-based receipt parsing for quick expense entry |
| **Savings Goals Tracker** | Visual progress toward user-defined financial milestones |
| **Email Digest** | Weekly financial summary delivered via email |
| **Export to Excel** | Spreadsheet export in addition to PDF reports |

---

## 🔗 Documentation

| Document | Description |
|---|---|
| [client/README.md](./client/README.md) | Frontend pages, features, state management, API integration |
| [server/README.md](./server/README.md) | Backend API reference, algorithms, models, middleware |

---
