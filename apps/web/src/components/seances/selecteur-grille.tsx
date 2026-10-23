'use client';

import { useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { messages } from '@/lib/messages/fr';

type ModeGrille = 'NORMALE' | 'RAMADAN';

interface SelecteurGrilleProps {
  mode: ModeGrille;
  onChange: (mode: ModeGrille) => void;
}

export function SelecteurGrille({ mode, onChange }: SelecteurGrilleProps) {
  const handleNormale = useCallback(() => onChange('NORMALE'), [onChange]);
  const handleRamadan = useCallback(() => onChange('RAMADAN'), [onChange]);

  return (
    <div className="flex items-center gap-2 border border-input bg-input rounded-lg p-1">
      <Button
        variant={mode === 'NORMALE' ? 'default' : 'outline'}
        size="sm"
        onClick={handleNormale}
        className="flex-1"
      >
        <Sun className="mr-2 h-3.5 w-3.5" />
        {messages.grilleNormale}
      </Button>
      <Button
        variant={mode === 'RAMADAN' ? 'default' : 'outline'}
        size="sm"
        onClick={handleRamadan}
        className="flex-1"
      >
        <Moon className="mr-2 h-3.5 w-3.5" />
        {messages.grilleRamadan}
      </Button>
    </div>
  );
}
