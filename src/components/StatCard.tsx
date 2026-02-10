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
        <CardTitle className="text-[12px] font-medium text-muted-foreground font-sans uppercase tracking-wide">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors">
          <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-[26px] font-bold font-serif leading-none">{value}</div>
        {description && <p className="text-[11px] text-muted-foreground mt-1.5">{description}</p>}
        {trend && (
          <p className={cn("text-[11px] mt-1.5 font-semibold", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
