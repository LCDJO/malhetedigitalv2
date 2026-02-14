import { Construction } from "lucide-react";

export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
      <Construction className="h-12 w-12 opacity-40" />
      <div className="text-center">
        <h2 className="text-lg font-serif font-bold text-foreground">{title}</h2>
        <p className="text-sm mt-1">Esta seção será implementada em breve.</p>
      </div>
    </div>
  );
}
