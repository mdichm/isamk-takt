'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { messages } from '@/lib/messages/fr';
import type { ContrainteDefinition } from '@/lib/api/contraintes';

interface FetMappingPreviewProps {
  definition: ContrainteDefinition;
}

export function FetMappingPreview({ definition }: FetMappingPreviewProps) {
  const supportLabels: Record<string, string> = {
    NATIF: messages.fetSupportNatif,
    PARTIEL: messages.fetSupportPartiel,
    AUCUN: messages.fetSupportAucun,
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{messages.fetMappingTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{messages.labelCategorie}</span>
          <Badge variant="outline">
            {definition.categorie === 'DURE' ? messages.categorieDure : messages.categorieSouple}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{messages.labelPortee}</span>
          <Badge variant="outline">{definition.portee}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-zinc-100 dark:border-zinc-800 pt-2">
          <span className="text-muted-foreground">{messages.labelFetSupport}</span>
          <Badge variant="secondary">
            {supportLabels[definition.fetSupport] ?? definition.fetSupport}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {messages.fetMappingHint}
        </p>
      </CardContent>
    </Card>
  );
}