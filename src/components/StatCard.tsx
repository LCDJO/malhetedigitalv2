import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("animate-fade-in group", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[11px] font-medium text-muted-foreground font-sans uppercase tracking-wider">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 group-hover:bg-muted transition-colors">
          <Icon className="h-[17px] w-[17px] text-muted-foreground" strokeWidth={1.6} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-[26px] font-bold font-serif leading-none tracking-tight">{value}</div>
        {description && <p className="text-[11px] text-muted-foreground mt-1.5">{description}</p>}
        {trend && (
          <p className={cn("text-[11px] mt-1.5 font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
