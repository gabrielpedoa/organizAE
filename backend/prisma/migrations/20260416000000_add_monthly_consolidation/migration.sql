-- =============================================================================
-- Migration: add_monthly_consolidation
-- Adds MonthlyConsolidation + BudgetItem models and extends Transaction.
-- All changes are NON-DESTRUCTIVE: existing rows are unaffected.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New enum types
-- ---------------------------------------------------------------------------

-- ConsolidationStatus: lifecycle of a monthly budget period.
CREATE TYPE "ConsolidationStatus" AS ENUM ('OPEN', 'CLOSED');

-- BudgetItemStatus: tracks where a planned item stands.
CREATE TYPE "BudgetItemStatus" AS ENUM ('PENDING', 'PAID', 'RECEIVED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- 2. MonthlyConsolidation
--    One record per user per calendar month. Acts as the "container" that
--    groups BudgetItems and links confirmed Transactions to a period.
-- ---------------------------------------------------------------------------

CREATE TABLE "MonthlyConsolidation" (
    "id"       TEXT        NOT NULL,
    "userId"   TEXT        NOT NULL,
    "month"    INTEGER     NOT NULL,   -- 1–12
    "year"     INTEGER     NOT NULL,
    "status"   "ConsolidationStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),           -- set when status → CLOSED
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyConsolidation_pkey" PRIMARY KEY ("id")
);

-- Business rule: one consolidation per user/month/year
ALTER TABLE "MonthlyConsolidation"
    ADD CONSTRAINT "MonthlyConsolidation_userId_month_year_key"
    UNIQUE ("userId", "month", "year");

-- Named index (same columns) for query optimisation:
-- SELECT * FROM "MonthlyConsolidation" WHERE "userId"=? ORDER BY "year","month"
CREATE INDEX "MonthlyConsolidation_userId_year_month_idx"
    ON "MonthlyConsolidation"("userId", "year", "month");

ALTER TABLE "MonthlyConsolidation"
    ADD CONSTRAINT "MonthlyConsolidation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. BudgetItem
--    A planned entry within a consolidation. May originate from a
--    TransactionRule (ruleId set) or be created manually (ruleId NULL).
-- ---------------------------------------------------------------------------

CREATE TABLE "BudgetItem" (
    "id"                TEXT        NOT NULL,
    "consolidationId"   TEXT        NOT NULL,
    -- NULL = avulso (manually added, no originating rule)
    "ruleId"            TEXT,
    "memberId"          TEXT        NOT NULL,
    "categoryId"        TEXT        NOT NULL,
    "type"              "TransactionType" NOT NULL,
    -- Snapshot amount — independent of the rule; freely editable while PENDING
    "amount"            DECIMAL(65,30) NOT NULL,
    "description"       TEXT        NOT NULL,
    "dueDate"           TIMESTAMP(3) NOT NULL,
    "installmentNumber" INTEGER,
    "status"            "BudgetItemStatus" NOT NULL DEFAULT 'PENDING',
    "note"              TEXT,
    -- FK to Transaction; populated when confirmed (PAID / RECEIVED)
    "transactionId"     TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- One-to-one with Transaction (transactionId is unique)
ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_transactionId_key" UNIQUE ("transactionId");

-- Prevents the auto-generator from creating duplicates for the same rule in the
-- same consolidation. In PostgreSQL, NULL != NULL in unique indexes, so multiple
-- avulso items (ruleId IS NULL) are still permitted within the same consolidation.
ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_consolidationId_ruleId_key"
    UNIQUE ("consolidationId", "ruleId");

-- ---------------------------------------------------------------------------
-- 4. Indexes on BudgetItem
-- ---------------------------------------------------------------------------

-- Primary filter: list all items for a consolidation by status (PENDING tab, etc.)
CREATE INDEX "BudgetItem_consolidationId_status_idx"
    ON "BudgetItem"("consolidationId", "status");

-- Secondary filter: split by type (income vs expense sub-totals)
CREATE INDEX "BudgetItem_consolidationId_type_idx"
    ON "BudgetItem"("consolidationId", "type");

-- Lookup all BudgetItems belonging to a rule (e.g. to show rule history)
CREATE INDEX "BudgetItem_ruleId_idx" ON "BudgetItem"("ruleId");

-- Support JOIN/filter by member and category
CREATE INDEX "BudgetItem_memberId_idx"    ON "BudgetItem"("memberId");
CREATE INDEX "BudgetItem_categoryId_idx"  ON "BudgetItem"("categoryId");

-- ---------------------------------------------------------------------------
-- 5. Foreign keys for BudgetItem
-- ---------------------------------------------------------------------------

ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_consolidationId_fkey"
    FOREIGN KEY ("consolidationId") REFERENCES "MonthlyConsolidation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- SetNull: if a rule is deleted, keep the BudgetItem but clear the link
ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_ruleId_fkey"
    FOREIGN KEY ("ruleId") REFERENCES "TransactionRule"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- SetNull: if the Transaction is deleted (reversal), BudgetItem.transactionId
-- becomes NULL automatically — no manual cleanup needed.
ALTER TABLE "BudgetItem"
    ADD CONSTRAINT "BudgetItem_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. Extend Transaction (non-destructive — both columns are nullable)
-- ---------------------------------------------------------------------------

-- Links a confirmed transaction back to its monthly period.
-- Existing transactions are unaffected (NULL = pre-consolidation flow).
ALTER TABLE "Transaction"
    ADD COLUMN "consolidationId" TEXT;

-- Free-text note captured at payment/receipt confirmation time.
ALTER TABLE "Transaction"
    ADD COLUMN "note" TEXT;

-- Index for queries like: "all transactions in a given consolidation"
CREATE INDEX "Transaction_consolidationId_idx"
    ON "Transaction"("consolidationId");

ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_consolidationId_fkey"
    FOREIGN KEY ("consolidationId") REFERENCES "MonthlyConsolidation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. Additional indexes on existing Transaction columns
--    (only if not already present from a previous migration)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "Transaction_memberId_idx"   ON "Transaction"("memberId");
CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");
