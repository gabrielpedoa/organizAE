import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BudgetItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, Clock, X } from "lucide-react";
import { useState } from "react";

interface MemberData {
  member: { id: string; name: string };
  planned: number;
  realized: number;
  items?: BudgetItem[];
}

interface Props {
  members: MemberData[];
  month: number;
  year: number;
}

export function MemberBreakdown({ members, month, year }: Props) {
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dash = "—";

  const monthName = new Date(year, month - 1).toLocaleString("pt-BR", {
    month: "long",
  });
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "PAID":
      case "RECEIVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "CANCELLED":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getItemBadge = (item: BudgetItem) => {
    if (item.ruleId) {
      if (item.installmentNumber && item.installmentNumber > 1) {
        return <Badge variant="outline">Parcelado</Badge>;
      }
      return <Badge variant="outline">Recorrente</Badge>;
    }
    return <Badge variant="outline">Exclusivo do mês</Badge>;
  };

  const formatDueDate = (
    date: string,
    status: string,
    transaction?: { date: string },
  ) => {
    if (status === "PAID" || status === "RECEIVED") {
      return `pago em ${new Date(transaction!.date).toLocaleDateString("pt-BR")}`;
    }
    return `vence ${new Date(date).toLocaleDateString("pt-BR")}`;
  };

  const handleMemberClick = (member: MemberData) => {
    setSelectedMember(member);
    setDrawerOpen(true);
  };

  const sortedMembers = [...members].sort((a, b) => b.realized - a.realized);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Gastos por Membro</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            {sortedMembers.map((member) => {
              const percentage =
                member.planned > 0
                  ? (member.realized / member.planned) * 100
                  : 0;
              return (
                <div
                  key={member.member.id}
                  className="cursor-pointer hover:bg-accent transition-colors p-3 border rounded-lg"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="mb-2">
                    <span className="font-medium text-sm">
                      {member.member.name}
                    </span>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-sm text-muted-foreground">
                        Realizado
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(member.realized)}
                        <span className="mx-1 opacity-40">/</span>
                        {formatCurrency(member.planned)}
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="mb-2" />
                  <div className="text-sm text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% realizado
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Lançamentos {dash} {selectedMember?.member.name} {dash}{" "}
              {capitalizedMonth} {year}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {selectedMember?.items.map((item) => (
              <div key={item.id} className="p-3 border rounded">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.description}</span>
                  </div>
                  {getItemBadge(item)}
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {item.category?.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDueDate(item.dueDate, item.status, item.transaction)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <div className="text-sm">
                      Previsto: {formatCurrency(item.amount)}
                    </div>
                    {item.transaction && (
                      <div className="text-sm text-green-600">
                        Real: {formatCurrency(item.transaction.amount)}
                        {item.transaction.amount !== item.amount && (
                          <span className="ml-1">
                            ({item.transaction.amount > item.amount ? "+" : ""}
                            {formatCurrency(
                              item.transaction.amount - item.amount,
                            )}
                            )
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {selectedMember?.items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum lançamento</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
