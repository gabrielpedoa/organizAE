import { Injectable, Logger } from '@nestjs/common';
import { SummaryRepository } from './summary.repository';

export interface MemberSummary {
  memberId: string;
  name: string;
  total: number;
}

export interface CategorySummary {
  categoryId: string;
  name: string;
  type: string;
  total: number;
}

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(private readonly summaryRepository: SummaryRepository) {}

  async getSummary(userId: string, month: string) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end = new Date(Date.UTC(year, m, 1));

    // consolidationId: null mirrors the rule-generated transactions (pre-consolidation flow).
    // Consolidation-confirmed transactions (consolidationId IS NOT NULL) are counted
    // separately through the Consolidação Mensal module and must not be double-counted here.
    const transactions = await this.summaryRepository.findTransactions({
      member: { userId },
      date: { gte: start, lt: end },
      consolidationId: null,
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0);

    const byMemberMap: Record<string, MemberSummary> = {};
    const byCategoryMap: Record<string, CategorySummary> = {};

    for (const t of transactions) {
      if (t.type === 'EXPENSE') {
        if (!byMemberMap[t.memberId]) {
          byMemberMap[t.memberId] = { memberId: t.memberId, name: t.member.name, total: 0 };
        }
        byMemberMap[t.memberId].total += Number(t.amount);
      }

      const key = `${t.categoryId}-${t.type}`;
      if (!byCategoryMap[key]) {
        byCategoryMap[key] = { categoryId: t.categoryId, name: t.category.name, type: t.type, total: 0 };
      }
      byCategoryMap[key].total += Number(t.amount);
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byMember: Object.values(byMemberMap).sort((a, b) => b.total - a.total),
      byCategory: Object.values(byCategoryMap).sort((a, b) => b.total - a.total),
    };
  }
}
