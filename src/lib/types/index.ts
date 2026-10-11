export type UserRole = "OWNER" | "MANAGER";

export interface UserSession {
  userId: string;
  businessId: string;
  username: string;
  name: string;
  role: UserRole;
}

export type GameType = "POOL" | "SNOOKER";
export type SessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type RoundingMode = "CEIL" | "ROUND" | "EXACT";
export type BillType = "TABLE" | "COUNTER";
export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";
export type PaymentMethod = "CASH" | "UPI" | "SPLIT" | "CREDIT";
export type PaymentType = "BILL_PAYMENT" | "UDHAAR_REPAYMENT" | "ADVANCE";
export type ExpensePaidBy = "BUSINESS_DRAWER" | "PERSONAL_FUNDS" | "BANK";
export type ShiftStatus = "OPEN" | "CLOSED";
export type StockMovementType =
  | "INITIAL"
  | "PURCHASE"
  | "SALE"
  | "SESSION_ADDON"
  | "DAMAGE"
  | "RETURN"
  | "ADJUSTMENT";

export interface TableItem {
  id: string;
  business_id: string;
  name: string;
  type: GameType;
  rate_plan_id: string | null;
  display_order: number;
  is_active: number;
  rate_plan_name?: string;
  hourly_rate_paise?: number;
  minimum_charge_paise?: number;
  active_session?: GameSessionItem | null;
}

export interface RatePlanItem {
  id: string;
  business_id: string;
  name: string;
  game_type: GameType;
  hourly_rate_paise: number;
  minimum_charge_paise: number;
  billing_increment_minutes: number;
  rounding_mode: RoundingMode;
  is_default: number;
}

export interface GameSessionItem {
  id: string;
  business_id: string;
  table_id: string;
  customer_id: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  table_name?: string;
  table_type?: GameType;
  start_time: string;
  end_time: string | null;
  status: SessionStatus;
  snapshot_hourly_rate_paise: number;
  snapshot_minimum_charge_paise: number;
  snapshot_increment_minutes: number;
  snapshot_rounding_mode: RoundingMode;
  duration_minutes: number;
  table_charge_paise: number;
  items_charge_paise: number;
  total_amount_paise: number;
  discount_paise: number;
  final_amount_paise: number;
  notes: string | null;
  created_by_user_id: string;
  created_at: string;
  items?: SessionItem[];
}

export interface SessionItem {
  id: string;
  bill_id?: string;
  session_id: string | null;
  product_id: string | null;
  item_name: string;
  item_type: "TABLE_TIME" | "PRODUCT" | "SERVICE";
  quantity: number;
  unit_price_paise: number;
  unit_cost_paise: number;
  total_price_paise: number;
  created_at: string;
}

export interface CustomerItem {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  outstanding_credit_paise: number;
  created_at: string;
  updated_at: string;
  total_games_played?: number;
  pool_games_played?: number;
  snooker_games_played?: number;
  total_billed_paise?: number;
  total_paid_paise?: number;
  last_visit?: string | null;
}

export interface ProductItem {
  id: string;
  business_id: string;
  name: string;
  category: string;
  brand: string | null;
  sku: string | null;
  selling_price_paise: number;
  cost_price_paise: number;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
  pack_piece_ratio: number;
  is_active: number;
}

export interface ExpenseItem {
  id: string;
  business_id: string;
  category_id: string;
  category_name: string;
  title: string;
  amount_paise: number;
  expense_date: string;
  payment_method: "CASH" | "UPI";
  paid_by: ExpensePaidBy;
  payee: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface ShiftItem {
  id: string;
  business_id: string;
  shift_date: string;
  opened_at: string;
  closed_at: string | null;
  status: ShiftStatus;
  opening_cash_paise: number;
  table_cash_collected_paise: number;
  shop_cash_collected_paise: number;
  udhaar_cash_collected_paise: number;
  cash_expenses_paid_from_drawer_paise: number;
  cash_added_paise: number;
  cash_withdrawn_paise: number;
  expected_closing_cash_paise: number;
  actual_counted_cash_paise: number;
  cash_difference_paise: number;
  total_upi_collected_paise: number;
  total_billed_paise: number;
  total_credit_given_paise: number;
  closing_notes: string | null;
  closed_by_user_id: string | null;
}

export interface BillItemRecord {
  id: string;
  bill_number: string;
  session_id: string | null;
  customer_id: string | null;
  customer_name?: string;
  bill_type: BillType;
  subtotal_paise: number;
  discount_paise: number;
  final_amount_paise: number;
  paid_amount_paise: number;
  outstanding_paise: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  payments?: PaymentRecord[];
  items?: SessionItem[];
}

export interface PaymentRecord {
  id: string;
  business_id: string;
  bill_id: string | null;
  customer_id: string | null;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  cash_amount_paise: number;
  upi_amount_paise: number;
  total_amount_paise: number;
  reference_note: string | null;
  created_at: string;
}

export interface DashboardOverview {
  date: string;
  todayBilledPaise: number;
  todayCollectedPaise: number;
  cashCollectedPaise: number;
  upiCollectedPaise: number;
  todayExpensesPaise: number;
  drawerCashExpensesPaise: number;
  totalOutstandingCreditPaise: number;
  poolGamesPlayedToday: number;
  snookerGamesPlayedToday: number;
  activePoolTables: number;
  activeSnookerTables: number;
  counterSalesPaise: number;
  isShiftOpen: boolean;
  activeSessions: GameSessionItem[];
  recentBills: BillItemRecord[];
  recentExpenses: ExpenseItem[];
  topDebtors: CustomerItem[];
}
