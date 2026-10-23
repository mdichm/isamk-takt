'use client';

import { MapPin, AlertCircle, MapPinOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';

export type EtatSeance = 'IVORY' | 'WARM' | 'INSET';

export interface TokenEtatProps {
  etat: EtatSeance;
  estNonPlacee?: boolean;
}

function etatConfig(etat: EtatSeance) {
  switch (etat) {
    case 'IVORY':
      return {
        badge: 'badge-outline',
        label: messages.etatIvory,
        icon: MapPin,
        couleur: 'border-[color:#29363C] text-[color:#29363C] bg-[color:#29363C]/10',
      };
    case 'WARM':
      return {
        badge: 'badge-outline',
        label: messages.etatWarm,
        icon: AlertCircle,
        couleur: 'border-[color:#B45309] text-[color:#B45309] bg-[color:#B45309]/10',
      };
    case 'INSET':
      return {
        badge: 'badge-outline',
        label: messages.etatInset,
        icon: AlertCircle,
        couleur: 'border-[color:#B45309] text-[color:#B45309] bg-[color:#B45309]/10',
      };
    default:
      return {
        badge: 'badge-outline',
        label: messages.etatIvory,
        icon: MapPin,
        couleur: 'border-[color:#29363C] text-[color:#29363C] bg-[color:#29363C]/10',
      };
  }
}

export function TokenEtat({ etat, estNonPlacee = false }: TokenEtatProps) {
  const config = etatConfig(etat);

  // Règle des tokens (L3-26) : pastille sur Ivory uniquement.
  // Sur Warm et Inset, marqueur en ligne sans pastille pour NON_PLACEE.
  if (estNonPlacee && etat !== 'IVORY') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[color:#29363C]">
        <MapPinOff className="h-3 w-3 shrink-0" aria-hidden="true" />
        {messages.aPlacer}
      </span>
    );
  }

  const Icon = config.icon;
  return (
    <Badge
      variant={config.badge === 'badge-outline' ? 'outline' : 'secondary'}
      className={`text-xs shrink-0 ${config.couleur}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {config.label}
      </div>
    </Badge>
  );
}