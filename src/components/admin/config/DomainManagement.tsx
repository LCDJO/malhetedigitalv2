import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Globe, ArrowRight, Share2, Server } from "lucide-react";

interface DomainNode {
  name: string;
  target: string;
  subdomains?: DomainNode[];
}

const domains: DomainNode[] = [
  {
    name: "plataforma-saas.com",
    target: "192.168.1.1 (Servidor Principal)",
    subdomains: [
      {
        name: "admin.plataforma-saas.com",
        target: "load-balancer-internal",
        subdomains: [
          { name: "api.admin.plataforma-saas.com", target: "k8s-ingress-controller" },
        ],
      },
      {
        name: "portal.plataforma-saas.com",
        target: "cdn.cloudflare.net",
      },
      {
        name: "app.plataforma-saas.com",
        target: "application-server-01",
      },
    ],
  },
];

const DomainNodeView: React.FC<{ node: DomainNode; level: number }> = ({ node, level }) => {
  return (
    <div className="flex flex-col gap-2">
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors ml-${level * 6}`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {level === 0 ? <Globe className="h-5 w-5 text-primary" /> : <Share2 className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-medium text-sm">{node.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${level === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {level === 0 ? 'Domínio Principal' : 'Subdomínio'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <Server className="h-4 w-4" />
            <span className="font-mono text-xs">{node.target}</span>
          </div>
        </div>
      </div>
      
      {node.subdomains?.map((sub, index) => (
        <DomainNodeView key={index} node={sub} level={level + 1} />
      ))}
    </div>
  );
};

export function DomainManagement() {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-xl font-serif">Gerenciamento de Domínios</CardTitle>
        <CardDescription>
          Visualize a estrutura de domínios e subdomínios do sistema e seus respectivos apontamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="rounded-xl border bg-muted/30 p-6">
          <div className="space-y-4">
            {domains.map((domain, index) => (
              <DomainNodeView key={index} node={domain} level={0} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
