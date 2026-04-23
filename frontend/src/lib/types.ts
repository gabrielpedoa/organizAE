export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type ExpenseType = 'FIXED' | 'VARIABLE' | 'INVESTMENT' | 'TRANSFER';
export type RuleType = 'RECURRING' | 'INSTALLMENT';
export type RecurrenceType = 'MONTHLY' | 'WEEKLY' | 'YEARLY';

export interface Member {
  id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

/** Minimal shape embedded inside a Transaction response (for rule-linked transactions). */
export interface TransactionRule {
  isVariable: boolean;
  ruleType: RuleType;
  totalInstallments?: number;
}

/** Full TransactionRule row returned by GET /transactions/rules. */
export interface TransactionRuleFull {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  expenseType?: ExpenseType | null;
  memberId: string;
  categoryId: string;
  ruleType: RuleType;
  recurrence?: RecurrenceType | null;
  startDate: string;
  endDate?: string | null;
  totalInstallments?: number | null;
  isVariable: boolean;
  member: Pick<Member, 'id' | 'name'>;
  category: Pick<Category, 'id' | 'name'>;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  member: Pick<Member, 'id' | 'name'>;
  category: Pick<Category, 'id' | 'name'>;
  installmentNumber?: number;
  rule?: TransactionRule | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

// ─── Consolidation types ──────────────────────────────────────────────────────

export type ConsolidationStatus = 'OPEN' | 'CLOSED';
export type BudgetItemStatus = 'PENDING' | 'PAID' | 'RECEIVED' | 'CANCELLED';

/** Minimal transaction shape embedded in a BudgetItem response */
export interface BudgetItemTransaction {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  type: TransactionType;
  note: string | null;
}

export interface BudgetItem {
  id: string;
  consolidationId: string;
  ruleId: string | null;
  memberId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  dueDate: string;
  installmentNumber: number | null;
  status: BudgetItemStatus;
  expenseType: ExpenseType | null;
  note: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Pick<Member, 'id' | 'name'>;
  category?: Pick<Category, 'id' | 'name' | 'type'>;
  transaction?: BudgetItemTransaction | null;
}

export interface MonthlyConsolidation {
  id: string;
  userId: string;
  month: number;
  year: number;
  status: ConsolidationStatus;
  closedAt: string | null;
  createdAt: string;
  items?: BudgetItem[];
}

export interface ConsolidationSummary {
  period: { month: number; year: number };
  status: ConsolidationStatus;
  closedAt: string | null;
  income: { planned: number; realized: number; pending: number };
  expense: { planned: number; realized: number; pending: number };
  balance: { planned: number; realized: number };
  byCategory: Array<{
    category: Category;
    planned: number;
    realized: number;
    items: BudgetItem[];
  }>;
  byMember: Array<{
    member: Member;
    planned: number;
    realized: number;
  }>;
  items: {
    pending: BudgetItem[];
    paid: BudgetItem[];
    cancelled: BudgetItem[];
  };
}

export interface DailyFlow {
  day: number;
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export type Consolidation = MonthlyConsolidation | null;
export type Summary = ConsolidationSummary;
export type DailyFlowData = DailyFlow[];

// ─── Account types ────────────────────────────────────────────────────────────

export type AccountType = 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'INVESTMENT' | 'OTHER';
export type InvestmentProductType = 'SAVINGS_BOX' | 'FIXED_INCOME' | 'STOCK' | 'FUND' | 'OTHER';
export type AccountEntryType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface AccountMemberRelation {
  accountId: string;
  memberId: string;
  member: Pick<Member, 'id' | 'name'>;
}

export interface InvestmentPosition {
  id: string;
  accountId: string;
  name: string;
  productType: InvestmentProductType;
  amount: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountEntry {
  id: string;
  accountId: string;
  type: AccountEntryType;
  amount: number;
  description: string;
  date: string;
  budgetItemId?: string | null;
  transactionId?: string | null;
  transferPairId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  members: AccountMemberRelation[];
  investments: InvestmentPosition[];
}
