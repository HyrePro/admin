import { CandidateFunnelKpis } from "@/types/candidate-funnel-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type KpiRowProps = {
  kpis: CandidateFunnelKpis;
  loading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function KpiRow({ kpis, loading = false }: KpiRowProps) {
  const cards = [
    { label: "Applications Submitted", value: formatNumber(kpis.submitted) },
    { label: "Reached MCQ Assessment", value: formatNumber(kpis.proceeded) },
    { label: "Dropped Before MCQ", value: formatNumber(kpis.dropped) },
    { label: "Drop-Off Rate", value: formatPct(kpis.dropoffPct) },
    { label: "Could Not Continue (Redirect)", value: formatNumber(kpis.redirectFailures) },
    { label: "Access Blocked", value: formatNumber(kpis.routeGuardBlocks) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-2">
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
