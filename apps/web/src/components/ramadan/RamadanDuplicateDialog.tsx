'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDuplicateCreneauxAffichage } from '@/hooks/use-ramadan';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useSemestres } from '@/hooks/use-structure';

const formSchema = z.object({
  sourceSemestreId: z.string().min(1, { message: 'Le semestre source est requis.' }),
  cibleSemestreId: z.string().min(1, { message: 'Le semestre cible est requis.' }),
  remplacer: z.boolean().optional().default(false),
}).refine((data) => data.sourceSemestreId !== data.cibleSemestreId, {
  message: 'Les semestres source et cible doivent être différents.',
  path: ['cibleSemestreId'],
});

type FormData = z.infer<typeof formSchema>;

interface RamadanDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RamadanDuplicateDialog({
  open, onOpenChange,
}: RamadanDuplicateDialogProps) {
  const { data: semestres } = useSemestres({ anneeId: undefined });
  const duplicateMutation = useDuplicateCreneauxAffichage();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      sourceSemestreId: '',
      cibleSemestreId: '',
      remplacer: false,
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    duplicateMutation.mutate({
      sourceSemestreId: data.sourceSemestreId,
      cibleSemestreId: data.cibleSemestreId,
      remplacer: data.remplacer,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.btnDupliquerRamadan}</DialogTitle>
          <DialogDescription>{messages.duplicationIdempotente}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.semestreSource}</Label>
            <Select {...form.register('sourceSemestreId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.semestreSource} /></SelectTrigger>
              <SelectContent>
                {semestres?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Semestre {s.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.sourceSemestreId && (
              <span className="text-sm text-destructive">{form.formState.errors.sourceSemestreId.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.semestreCible}</Label>
            <Select {...form.register('cibleSemestreId')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.semestreCible} /></SelectTrigger>
              <SelectContent>
                {semestres?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    Semestre {s.numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.cibleSemestreId && (
              <span className="text-sm text-destructive">{form.formState.errors.cibleSemestreId.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.remplacerExistants}</Label>
            <Select {...form.register('remplacer')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Non" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Non</SelectItem>
                <SelectItem value="true">Oui</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={duplicateMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={duplicateMutation.isPending}>
              {duplicateMutation.isPending ? messages.loading : messages.btnDupliquerRamadan}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
