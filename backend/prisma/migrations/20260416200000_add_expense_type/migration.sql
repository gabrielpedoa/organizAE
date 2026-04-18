-- Migration: add_expense_type
-- Adds nullable ExpenseType enum to TransactionRule, BudgetItem, and Transaction.
-- All columns are nullable and non-destructive — existing rows keep NULL.

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FIXED', 'VARIABLE', 'INVESTMENT', 'TRANSFER');

-- AlterTable: TransactionRule
ALTER TABLE "TransactionRule" ADD COLUMN "expenseType" "ExpenseType";

-- AlterTable: BudgetItem
ALTER TABLE "BudgetItem" ADD COLUMN "expenseType" "ExpenseType";

-- AlterTable: Transaction
ALTER TABLE "Transaction" ADD COLUMN "expenseType" "ExpenseType";
