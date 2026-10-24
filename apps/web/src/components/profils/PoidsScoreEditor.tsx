'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { messages } from '@/lib/messages/fr';

interface PoidsScoreEditorProps {
  valeur?: Record<string, number>;
  onChange: (valeur: Record<string, number>) => void;
  disabled?: boolean;
}

const CRITERES: { key: string; label: string }[] = [
  { key: 'remplissage', label: messages.poidsRemplissage },
  { key: 'compactage', label: messages.poidsCompactage },
  { key: 'creneaux', label: messages.poidsCreneaux },
  { key: 'caved', label: messages.poidsCaved },
];

export function PoidsScoreEditor({
  valeur,
  onChange,
  disabled = false,
}: PoidsScoreEditorProps) {
  const [poids, setPoids] = useState<Record<string, number>>(
    valeur ?? {
      remplissage: 40,
      compactage: 30,
      creneaux: 20,
      caved: 10,
    },
  );

  const total = Object.values(poids).reduce((a, b) => a + b, 0);

  const handleChange = (key: string, value: string) => {
    const num = parseInt(value, 10) || 0;
    setPoids((prev) => ({ ...prev, [key]: num }));
    onChange({ ...poids, [key]: num });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{messages.poidsScore}</Label>
        <p className="text-xs text-muted-foreground">
          {messages.poidsScoreDesc}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {CRITERES.map((c) => (
            <div key={c.key} className="flex flex-col gap-1">
              <Label htmlFor={`poids-${c.key}`} className="text-xs">
                {c.label}
              </Label>
              <Input
                id={`poids-${c.key}`}
                type="number"
                min="0"
                max="100"
                value={poids[c.key] ?? 0}
                onChange={(e) => handleChange(c.key, e.target.value)}
                disabled={disabled}
                className="w-full"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>{messages.poidsScoreDesc}</span>
          <span
            className={
              total === 100
                ? 'text-green-600 dark:text-green-400'
                : 'text-destructive'
            }
          >
            {total} / 100
          </span>
        </div>
      </div>
    </div>
  );
}