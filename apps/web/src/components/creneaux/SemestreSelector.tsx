'use client';


import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSemestres } from '@/hooks/use-structure';
import { messages } from '@/lib/messages/fr';

interface SemestreSelectorProps {
  anneeId?: string;
  value?: string;
  onChange: (semestreId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SemestreSelector({
  anneeId,
  value,
  onChange,
  disabled = false,
  className,
}: SemestreSelectorProps) {
  const { data: semestres } = useSemestres({
    anneeId,
  });

  if (!anneeId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Label className="text-xs font-medium">{messages.formSelectSemestre}</Label>
      <Select
        value={value ?? ''}
        onValueChange={(v) => onChange(v ?? '')}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder={messages.formSelectSemestre} />
        </SelectTrigger>
        <SelectContent>
          {(semestres ?? []).map((s) => (
            <SelectItem key={s.id} value={s.id}>
              Semestre {s.numero}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
