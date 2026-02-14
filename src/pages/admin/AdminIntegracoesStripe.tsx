import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Settings2, ExternalLink, ShieldCheck, Repeat } from "lucide-react";

export default function AdminIntegracoesStripe() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/10">
            <CreditCard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Stripe</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure a integração com o Stripe para pagamentos e assinaturas</p>
          </div>
        </div>
      </div>

      {/* Seção Pagamentos Avulsos */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Pagamentos Avulsos</h2>
            <p className="text-xs text-muted-foreground">Checkout para cobranças únicas via Stripe</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar pagamentos avulsos</Label>
                <p className="text-xs text-muted-foreground">Permite cobranças únicas via Stripe Checkout</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Publishable Key
                </Label>
                <Input placeholder="pk_live_..." disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="h-3 w-3" /> Secret Key
                </Label>
                <Input placeholder="sk_live_..." disabled className="h-10" type="password" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook Secret</Label>
              <Input placeholder="whsec_..." disabled className="h-10" type="password" />
              <p className="text-[11px] text-muted-foreground">Necessário para confirmar pagamentos automaticamente</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Obtenha suas chaves de API no{" "}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Stripe Dashboard
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">
                Salvar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seção Assinaturas */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
            <Repeat className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-serif font-semibold text-foreground">Assinaturas</h2>
            <p className="text-xs text-muted-foreground">Gestão de planos recorrentes via Stripe Billing</p>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">Em breve</Badge>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Ativar assinaturas</Label>
                <p className="text-xs text-muted-foreground">Habilita cobrança recorrente com Stripe Billing</p>
              </div>
              <Switch disabled />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product ID (Plano Básico)</Label>
                <Input placeholder="prod_..." disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price ID (Plano Básico)</Label>
                <Input placeholder="price_..." disabled className="h-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product ID (Plano Premium)</Label>
                <Input placeholder="prod_..." disabled className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price ID (Plano Premium)</Label>
                <Input placeholder="price_..." disabled className="h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL de Sucesso</Label>
              <Input placeholder="https://seudominio.com/sucesso" disabled className="h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL de Cancelamento</Label>
              <Input placeholder="https://seudominio.com/cancelado" disabled className="h-10" />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/60">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Configure produtos e preços no{" "}
                <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  Stripe Products
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button disabled className="gap-1.5">
                Salvar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
