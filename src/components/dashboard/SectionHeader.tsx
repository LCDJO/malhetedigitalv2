interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-serif font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
