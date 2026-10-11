# LEVEL UP — Pool & Snooker Arena SaaS & Installable PWA

Production-ready business management SaaS and Progressive Web App (PWA) for **Level Up**, a premier pool and snooker arena in **Dahod, Gujarat, India**.

Replacing the owner's paper registers with a digital arena operating system for table session timers, customer accounts, cash/UPI collections, shop counter sales, expenses, customer credit (Udhaar), and daily closing hisab.

---

## 🚀 Key Highlights & Product Capabilities

1. **Independent Table Timers & Billing Engine**:
   - Separate Pool (3 tables) and Snooker (2 tables) sections.
   - Continuous elapsed time tracking using server timestamps as the source of truth (continues accurately when browser is closed, phone locks, or devices switch).
   - Rate snapshots recorded at session start so future rate edits never distort past records.
   - Per-minute billing, minimum play charges, configurable billing increments (e.g. 15-min blocks), and rounding rules.

2. **Add-On Product Sales on Every Table Card**:
   - Quick 1-tap add-on panel on every table card without navigating away.
   - Attach popular products (Cigarettes, Chips, Soft Drinks, Bottled Water, Biscuits) directly to the active session.
   - Live inventory check, automatic stock movement logging, and consolidated bill generation.

3. **Customer Accounts & Audited Udhaar (Credit) Management**:
   - Player records with total games, pool/snooker play counts, total billed, total paid, and current debt.
   - "Collect Udhaar" action with Cash, UPI, or Split payment.
   - Partial payments and credit balances tracked strictly with audit logs.

4. **Shop / Counter Sales & Inventory**:
   - Standalone counter sales for walk-ins.
   - Real-time stock levels and low-stock warning banners.
   - Audited stock adjustments with recorded reasons (damage, breakages, tally count).
   - Supplier stock purchase receiving.
   - Statutory 18+ tobacco check compliance notice (COTPA India).

5. **Expense Tracking & Cash Drawer Source Accounting**:
   - Categorized expenses: Salaries, Advances, Rent, Electricity, Water, Cleaning, Equipment, Stock, Transport, Misc.
   - Crucial accounting rules enforced:
     - Cash expenses paid from **Shop Drawer** reduce expected drawer closing cash.
     - Expenses paid via **UPI / Bank** affect the bank balance, not physical drawer cash.
     - Expenses paid from **Personal Funds** are tracked without falsely reducing drawer cash.

6. **Guided Daily Closing ("Close Today's Hisab")**:
   - Drawer cash book reconciliation:
     - Opening Cash Float
     - (+) Table Cash Collections
     - (+) Counter Shop Cash Collections
     - (+) Cash Received for Old Udhaar
     - (+) Cash Added to Drawer
     - (-) Cash Expenses Paid from Drawer
     - (-) Cash Withdrawn by Owner
     - (=) Expected Closing Drawer Cash
   - Compares expected cash with actual physical cash counted by manager.
   - Requires an explanatory note when drawer difference exceeds ₹100.
   - Repeat-safe locking prevents duplicate shift records upon page refresh.
   - Warns manager if active table sessions are still running before closing.

7. **Analysis & Reports**:
   - Time filters: Today, Yesterday, This Week, This Month, Custom Date Range.
   - KPIs: Billed revenue, actual collections, pool vs snooker breakdown, shop gross profits, operating cash result.
   - Table-by-table utilization and duration metrics.
   - Excel-compatible CSV export for bills, expenses, customer ledgers, and inventory.

8. **PWA (Progressive Web App)**:
   - Web App Manifest with emerald/gold branding, standalone display, and shortcuts.
   - Custom SVG and PNG icons (192x192, 512x512, maskable).
   - Service worker with offline shell caching and network-first API handling.
   - Smart Install Button with `beforeinstallprompt` support, standalone mode detection, and iOS Share-sheet guide modal.
   - Live online/offline network pulse badge.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript with strict typing
- **Styling**: Tailwind CSS (Billiards charcoal, emerald felt, champagne gold)
- **Icons**: Lucide React
- **Database**: libSQL / Turso (`@libsql/client` with WAL mode and local file `file:levelup.db` or Turso cloud)
- **Validation**: Zod
- **Authentication**: Secure HTTP-only JWT cookies (`jose`) with bcrypt password hashing
- **Testing**: Vitest automated tests covering billing algorithms, reconciliation, stock, and expenses

---

## ⚡ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env.local` (or copy from `.env.example`):
```env
DATABASE_URL="file:levelup.db"
TURSO_AUTH_TOKEN=""
JWT_SECRET="levelup_dahod_super_secure_jwt_secret_key_2026_gujarat_arena"
NEXT_PUBLIC_APP_NAME="LEVEL UP"
NEXT_PUBLIC_APP_LOCATION="Dahod, Gujarat"
NODE_ENV="development"
```

### 3. Initialize & Seed Database
```bash
npm run seed
```
This sets up the tables, rate plans, shop items, expense categories, and accounts:
- **Owner Account**: `owner` / `admin123`
- **Manager Account**: `manager` / `manager123`

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
npm test
```
All 17 financial, billing, and accounting test suites will execute and verify the calculations.

### 6. Build Production PWA
```bash
npm run build
npm start
```

---

## 📖 Manager Quick Training Guide

1. **Starting a Game**:
   - Tap **Pool Tables** or **Snooker Tables** from the navigation.
   - On any green table card, tap **Start Game**.
   - Select the player name from the dropdown or tap **+ New Customer** (or leave as casual walk-in).
   - Tap **Start Table Game**. The timer starts ticking immediately.

2. **Serving Snacks / Cigarettes to a Table**:
   - On the running table card, tap **Add Items**.
   - Tap the product (e.g. Thums Up, Lays, Gold Flake) and adjust quantity with **+** / **-**.
   - Tap **Attach to Table Bill**.

3. **Ending a Game & Bill Settle**:
   - Tap **End Game**.
   - Review elapsed duration and charges.
   - Enter discount (if approved).
   - Select payment: **Cash**, **UPI** (GPay/PhonePe), **Split** (part cash, part UPI), or **Udhaar** (credit).
   - Tap **Settle Bill & Free Table**.

4. **Collecting Player Udhaar**:
   - Tap **Customers** &rarr; find player &rarr; tap **Collect**.
   - Enter amount received &rarr; select Cash or UPI &rarr; confirm.

5. **Closing the Day (Hisab)**:
   - At shift end, tap **Close Today's Hisab**.
   - Count drawer cash and enter the number in **Physical Cash Counted in Drawer**.
   - If there is any shortage or surplus, add a brief note and tap **Lock & Close Today's Hisab**.

---

## 🔒 Security & Data Integrity

- Money is stored in integer paise (1 Rupee = 100 paise) avoiding JavaScript floating-point errors.
- Rates and pricing are validated strictly on the server; client totals are never trusted.
- Database runs with foreign key enforcement and Write-Ahead Logging (WAL).
- Rate limits protect login against brute-force attempts.
- Passwords hashed with bcrypt.
