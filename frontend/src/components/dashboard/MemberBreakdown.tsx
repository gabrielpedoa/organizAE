import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MemberData {
  member: { id: string; name: string };
  planned: number;
  realized: number;
}

interface Props {
  members: MemberData[];
  month: number;
  year: number;
}

export function MemberBreakdown({ members, month, year }: Props) {
  // Sort members by realized DESC
  const sortedMembers = [...members].sort((a, b) => b.realized - a.realized);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gastos por Membro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMembers.map((member) => {
            const percentage = member.planned > 0 ? (member.realized / member.planned) * 100 : 0;
            return (
              <div key={member.member.id} className="p-3 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{member.member.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(member.realized)} / {formatCurrency(member.planned)}
                  </span>
                </div>
                <Progress value={percentage} className="mb-2" />
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% realizado
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}