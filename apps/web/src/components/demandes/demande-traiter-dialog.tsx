'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTraiterDemande } from '@/hooks/use-demandes';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { messages } from '@/lib/messages/fr';

const formSchema = z.object({
  statut: z.enum(['TRAITEE', 'REFUSEE']),
  reponse: z.string().max(2000, {
    message: 'La réponse ne peut pas dépasser 2000 caractères.',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface DemandeTraiterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandeId: string;
  onSuccess?: () => void;
}

export function DemandeTraiterDialog({
  open,
  onOpenChange,
  demandeId,
  onSuccess,
}: DemandeTraiterDialogProps) {
  const traiterMutation = useTraiterDemande();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      statut: 'TRAITEE',
      reponse: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    traiterMutation.mutate(
      {
        id: demandeId,
        input: {
          statut: data.statut,
          reponse: data.reponse || undefined,
        },
      },
      { onSuccess: () => onSuccess?.() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.traiterDemande}</DialogTitle>
          <DialogDescription>{messages.traiterDemandeDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{messages.labelDecision}</Label>
            <Select {...form.register('statut')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectDecision} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRAITEE">{messages.decisionAcceptee}</SelectItem>
                <SelectItem value="REFUSEE">{messages.decisionRefusee}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.statut && (
              <span className="text-sm text-destructive">{form.formState.errors.statut.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.labelReponse}</Label>
            <Textarea {...form.register('reponse')} rows={4} placeholder={messages.reponsePlaceholder} />
            {form.formState.errors.reponse && (
              <span className="text-sm text-destructive">{form.formState.errors.reponse.message}</span>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={traiterMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={traiterMutation.isPending}>
              {traiterMutation.isPending ? messages.saving : messages.btnTraiter}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
