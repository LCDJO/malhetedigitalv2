import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Globe, ArrowRight, Server, Share2, CornerDownRight, ExternalLink, Loader2, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUBDOMAIN_ROUTES } from "../../SubdomainRedirect";

interface DomainNode {
  name: string;
  target: string;
  type: "CNAME" | "A" | "AAAA" | "NS";
  route?: string;
  subdomains?: DomainNode[];
}

const DomainNodeView: React.FC<{ node: DomainNode; level: number; isLast: boolean }> = ({ node, level, isLast }) => {
  return (
    <div className="flex flex-col">
      <div className="relative flex items-center group">
        {/* Connection lines for nested subdomains */}
        {level > 0 && (
          <div 
            className="absolute left-[-24px] top-[-16px] bottom-[50%] w-[24px] border-l-2 border-b-2 border-muted-foreground/30 rounded-bl-xl"
            style={{ left: `-${24}px` }}
          />
        )}
        
        <div 
          className="flex-1 flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-all duration-200 shadow-sm mb-3 group-hover:border-primary/30"
          style={{ marginLeft: level > 0 ? `${level * 40}px` : '0' }}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${level === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {level === 0 ? <Globe className="h-5 w-5" /> : <Share2 className="h-4 w-4" />}
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight">{node.name}</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono uppercase bg-muted/50">
                  {node.type}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3" />
                  <Server className="h-3 w-3" />
                  <span className="font-mono">{node.target}</span>
                </div>
                {node.route && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/5 text-primary border border-primary/10">
                    <Route className="h-3 w-3" />
                    <span className="font-medium">Redireciona para: {node.route}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-[10px] font-bold uppercase tracking-wider">
               Ativo
             </div>

             <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
               <ExternalLink className="h-4 w-4" />
             </button>
          </div>
        </div>
      </div>
      
      <div className="relative">
        {node.subdomains?.map((sub, index) => (
          <DomainNodeView 
            key={index} 
            node={sub} 
            level={level + 1} 
            isLast={index === (node.subdomains?.length ?? 0) - 1} 
          />
        ))}
      </div>
    </div>
  );
};

export function DomainManagement() {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("name, slug")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const domains: DomainNode[] = [
    {
      name: "malhetedigital.com.br",
      target: "76.76.21.21 (Vercel Anycast IP)",
      type: "A",
      subdomains: [
        {
          name: "painel.malhetedigital.com.br",
          type: "CNAME",
          target: "cname.vercel-dns.com",
          subdomains: [
            { name: "api.malhetedigital.com.br", type: "CNAME", target: "supabase.co" },
            { name: "auth.malhetedigital.com.br", type: "CNAME", target: "auth.supabase.co" },
          ],
        },
        {
          name: "irmao.malhetedigital.com.br",
          type: "CNAME",
          target: "cname.vercel-dns.com",
        },
        {
          name: "business.malhetedigital.com.br",
          type: "CNAME",
          target: "cname.vercel-dns.com",
        },
        {
          name: "Wildcard (*.malhetedigital.com.br)",
          type: "CNAME",
          target: "cname.vercel-dns.com",
          subdomains: tenants?.map(t => ({
            name: `${t.slug}.malhetedigital.com.br`,
            type: "CNAME" as const,
            target: "tenant-router.malhetedigital.com.br"
          })) || []
        }
      ],
    },
  ];

  return (
    <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-serif">Gestão de Domínios</CardTitle>
            <CardDescription className="text-sm">
              Mapeamento de infraestrutura DNS e direcionamento de tráfego real.
            </CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
            Status: Saudável
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/5 border border-accent/20 text-accent-foreground text-sm">
              <CornerDownRight className="h-4 w-4 shrink-0" />
              <p>Os subdomínios abaixo refletem a infraestrutura real do SaaS e os tenants ativos.</p>
            </div>

            <div className="relative pl-4 space-y-2">
              {domains.map((domain, index) => (
                <DomainNodeView 
                  key={index} 
                  node={domain} 
                  level={0} 
                  isLast={index === domains.length - 1} 
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
