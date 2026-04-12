import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Globe, ArrowRight, Server, Share2, CornerDownRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DomainNode {
  name: string;
  target: string;
  type: "CNAME" | "A" | "AAAA" | "NS";
  subdomains?: DomainNode[];
}

const domains: DomainNode[] = [
  {
    name: "malhetedigital.com.br",
    target: "76.76.21.21 (Vercel Anycast IP)",
    type: "A",
    subdomains: [
      {
        name: "admin.malhetedigital.com.br",
        type: "CNAME",
        target: "cname.vercel-dns.com",
        subdomains: [
          { name: "api.admin.malhetedigital.com.br", type: "CNAME", target: "api-gateway-v2.aws.com" },
          { name: "auth.admin.malhetedigital.com.br", type: "CNAME", target: "cognito.aws.com" },
        ],
      },
      {
        name: "portal.malhetedigital.com.br",
        type: "CNAME",
        target: "cname.vercel-dns.com",
      },
      {
        name: "loja.malhetedigital.com.br",
        type: "CNAME",
        target: "shops.myshopify.com",
      },
      {
        name: "cdn.malhetedigital.com.br",
        type: "CNAME",
        target: "cloudflare-worker-1.net",
      },
    ],
  },
];

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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
                <Server className="h-3 w-3" />
                <span className="font-mono">{node.target}</span>
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
  return (
    <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-serif">Gestão de Domínios</CardTitle>
            <CardDescription className="text-sm">
              Mapeamento de infraestrutura DNS e direcionamento de tráfego.
            </CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
            Status: Saudável
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-8 pb-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-600 text-sm">
            <CornerDownRight className="h-4 w-4 shrink-0" />
            <p>Os subdomínios abaixo são provisionados automaticamente via wildcard ou apontamentos manuais.</p>
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
      </CardContent>
    </Card>
  );
}
