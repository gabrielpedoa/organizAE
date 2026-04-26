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

  const getItemOpacity = (status: string) => {
    if (status === "CANCELLED") return "opacity-50";
    return "";
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
        <SheetContent className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="break-words">
              Lançamentos {dash}{" "}
              <span className="truncate">{selectedMember?.member.name}</span>{" "}
              {dash} {capitalizedMonth} {year}
            </SheetTitle>
          </SheetHeader>

          {/* Contagem por status */}
          {selectedMember && (
            <div className="flex gap-3 mt-4 mb-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {selectedMember.items?.filter(i => i.status === 'PAID' || i.status === 'RECEIVED').length || 0} pagos
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {selectedMember.items?.filter(i => i.status === 'PENDING').length || 0} pendentes
              </span>
              <span className="flex items-center gap-1">
                <X className="h-3 w-3 text-muted-foreground" />
                {selectedMember.items?.filter(i => i.status === 'CANCELLED').length || 0} cancelados
              </span>
            </div>
          )}

          <div className="mt-2 space-y-3">
            {selectedMember?.items
              ?.slice()
              .sort((a, b) => {
                const order = { PAID: 0, RECEIVED: 0, PENDING: 1, CANCELLED: 2 };
                return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
              })
              .map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded ${getItemOpacity(item.status)} ${
                    item.status === 'CANCELLED' ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(item.status)}
                      <span className={`font-medium truncate ${item.status === 'CANCELLED' ? 'line-through text-muted-foreground' : ''}`}>
                        {item.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.status === 'CANCELLED' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Cancelado
                        </span>
                      )}
                      {item.status === 'PENDING' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Pendente
                        </span>
                      )}
                      {getItemBadge(item)}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-1">
                    {item.category?.name}
                  </div>

                  {item.status !== 'CANCELLED' && (
                    <div className="text-sm text-muted-foreground">
                      {formatDueDate(item.dueDate, item.status, item.transaction)}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-2">
                    <div className="min-w-0">
                      <div className="text-sm">
                        Previsto: {formatCurrency(Number(item.amount))}
                      </div>
                      {item.transaction && (
                        <div className="text-sm text-green-600">
                          Real: {formatCurrency(Number(item.transaction.amount))}
                          {Number(item.transaction.amount) !== Number(item.amount) && (
                            <span className="ml-1 text-xs">
                              ({Number(item.transaction.amount) > Number(item.amount) ? '+' : ''}
                              {formatCurrency(Number(item.transaction.amount) - Number(item.amount))})
                            </span>
                          )}
                        </div>
                      )}
                      {item.status === 'CANCELLED' && (
                        <div className="text-xs text-muted-foreground italic mt-0.5">
                          {item.note ? `Motivo: ${item.note}` : 'Item cancelado'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {(!selectedMember?.items || selectedMember.items.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum lançamento</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
