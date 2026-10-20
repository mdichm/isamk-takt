'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateModuleVolume, useUpdateModuleVolume,
} from '@/hooks/use-volumes';
import { messages } from '@/lib/messages/fr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type {
  ModuleVolume, CreateModuleVolumeInput, UpdateModuleVolumeInput,
} from '@/lib/api/volumes';

const formSchema = z.object({
  type: z.enum(['CM', 'TD', 'TP', 'CI', 'AUTRE'], {
    message: messages.formTypeRequired,
  }),
  volume: z.number()
    .int({ message: messages.formVolumeRequired })
    .min(30, { message: messages.formVolumeMin })
    .max(960, { message: messages.formVolumeMax })
    .refine((v) => v % 30 === 0, { message: messages.formVolumeMultiple }),
});

type FormData = z.infer<typeof formSchema>;

interface VolumeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  volumeToEdit?: ModuleVolume;
}

export function VolumeFormDialog({
  open, onOpenChange, moduleId, volumeToEdit,
}: VolumeFormDialogProps) {
  const isEdit = !!volumeToEdit;
  const createMutation = useCreateModuleVolume();
  const updateMutation = useUpdateModuleVolume();

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-hook-form zodResolver requires any cast
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: volumeToEdit?.type ?? 'CM',
      volume: volumeToEdit?.volume ?? 90,
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    if (isEdit && volumeToEdit) {
      const input: UpdateModuleVolumeInput = {
        type: data.type,
        volume: data.volume,
      };
      void updateMutation.mutate({
        moduleId,
        volumeId: volumeToEdit.id,
        input,
      });
      onOpenChange(false);
    } else {
      const input: CreateModuleVolumeInput = {
        moduleId,
        type: data.type,
        volume: data.volume,
      };
      void createMutation.mutate(input);
      onOpenChange(false);
    }
  };

  const typeLabels: Record<string, string> = {
    CM: messages.typeCM,
    TD: messages.typeTD,
    TP: messages.typeTP,
    CI: messages.typeCI,
    AUTRE: messages.typeAutre,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? messages.editVolume : messages.createVolume}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? messages.editVolume
                : `Ajoutez un volume d’enseignement pour le module ${moduleId}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{messages.volumeColumnType}</Label>
            <Select {...form.register('type')}>
              <SelectTrigger className="w-full"><SelectValue placeholder={messages.formTypeRequired} /></SelectTrigger>
              <SelectContent>
                {(['CM', 'TD', 'TP', 'CI', 'AUTRE'] as const).map((t) => (
                  <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <span className="text-sm text-destructive">{form.formState.errors.type.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{messages.volumeColumnVolume}</Label>
            <Input type="number" {...form.register('volume')} placeholder="90" />
            {form.formState.errors.volume && (
              <span className="text-sm text-destructive">{form.formState.errors.volume.message}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {messages.formVolumeMultiple}
            </span>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? messages.loading : (isEdit ? messages.save : messages.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
