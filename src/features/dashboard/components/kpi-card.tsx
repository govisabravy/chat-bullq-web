import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({ label, value, delta, icon, className }: KpiCardProps) {
  return (
    <Card className={cn("hover:shadow-soft", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
          {typeof delta === "number" ? (
            <Badge variant={delta > 0 ? "success" : delta < 0 ? "error" : "default"}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
