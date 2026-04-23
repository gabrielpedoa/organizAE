-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'BUSINESS', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentProductType" AS ENUM ('SAVINGS_BOX', 'FIXED_INCOME', 'STOCK', 'FUND', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountEntryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "institution" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMember" (
    "accountId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "AccountMember_pkey" PRIMARY KEY ("accountId","memberId")
);

-- CreateTable
CREATE TABLE "InvestmentPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" "InvestmentProductType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountEntry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "AccountEntryType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "budgetItemId" TEXT,
    "transactionId" TEXT,
    "transferPairId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountEntry_budgetItemId_key" ON "AccountEntry"("budgetItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountEntry_transactionId_key" ON "AccountEntry"("transactionId");

-- CreateIndex
CREATE INDEX "AccountEntry_accountId_idx" ON "AccountEntry"("accountId");

-- CreateIndex
CREATE INDEX "AccountEntry_transferPairId_idx" ON "AccountEntry"("transferPairId");

-- CreateIndex
CREATE INDEX "AccountEntry_budgetItemId_idx" ON "AccountEntry"("budgetItemId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEntry" ADD CONSTRAINT "AccountEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEntry" ADD CONSTRAINT "AccountEntry_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountEntry" ADD CONSTRAINT "AccountEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
