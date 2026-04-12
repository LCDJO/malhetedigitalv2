import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Globe, ShieldAlert, Timer, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SaaSGeneralConfig() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As parametrizações de slug foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-serif">Configurações de Identidade (Slug)</CardTitle>
              <CardDescription>
                Gerencie como os identificadores únicos (slugs) são tratados no sistema.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Uniqueness Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium flex items-center gap-2">
                  Slug Único Globalmente
                </Label>
                <p className="text-sm text-muted-foreground">
                  Garante que cada portal ou usuário tenha um identificador exclusivo na plataforma.
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Esta configuração é obrigatória para o funcionamento correto das rotas personalizadas e subdomínios.
              </p>
            </div>
          </div>

          <Separator />

          {/* Block/Warning Parameters */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Bloqueios e Avisos
              </Label>
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="warning-change" className="text-sm cursor-pointer">Avisar impacto de SEO/Links</Label>
                  <Switch id="warning-change" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="block-reserved" className="text-sm cursor-pointer">Bloquear termos reservados</Label>
                  <Switch id="block-reserved" defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Timer className="h-4 w-4" /> Janela de Alteração
              </Label>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Tempo mínimo de espera entre trocas de slug.
                </p>
                <div className="flex items-center gap-3">
                  <Input type="number" defaultValue="30" className="w-20" />
                  <span className="text-sm text-muted-foreground">Dias</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Grace Period Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-base font-medium">
              <RotateCcw className="h-4 w-4" /> Período de Reversão
            </div>
            <div className="grid gap-4 md:grid-cols-3 items-end">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-sm">Tempo para recuperar slug anterior</Label>
                <p className="text-xs text-muted-foreground">
                  Tempo que o slug antigo fica reservado exclusivamente para o usuário antes de ser liberado.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input type="number" defaultValue="24" className="w-20" />
                <span className="text-sm text-muted-foreground">Horas</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
