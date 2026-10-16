'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser } from '@/hooks/use-users';
import { useToast } from '@/components/ui/use-toast';
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
import { messages } from '@/lib/messages/fr';
import type { CreateUserInput, UpdateUserInput } from '@/lib/api/users';

type Role = 'ADMINISTRATEUR' | 'GESTIONNAIRE' | 'RESPONSABLE_DEPARTEMENT' | 'DIRECTION';

const ROLE_OPTIONS = [
  { value: 'ADMINISTRATEUR', label: messages.roleAdmin },
  { value: 'GESTIONNAIRE', label: messages.roleManager },
  { value: 'RESPONSABLE_DEPARTEMENT', label: messages.roleDepartmentHead },
  { value: 'DIRECTION', label: messages.roleDirection },
] as const;

const DEPARTMENT_OPTIONS = [
  { value: 'INFO', label: 'Informatique' },
  { value: 'RH', label: 'Ressources humaines' },
  { value: 'FIN', label: 'Finance' },
  { value: 'MKT', label: 'Marketing' },
  { value: 'ADM', label: 'Administration' },
];

const formSchema = z.object({
  email: z.string().email('E-mail invalide'),
  password: z.string().min(12, 'Au moins 12 caractères').optional(),
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  role: z.enum(['ADMINISTRATEUR', 'GESTIONNAIRE', 'RESPONSABLE_DEPARTEMENT', 'DIRECTION'] as const),
  departementCode: z.string().optional(),
}).refine((data) => {
  if (data.role === 'RESPONSABLE_DEPARTEMENT' && !data.departementCode) {
    return false;
  }
  return true;
}, {
  message: 'Un département est requis pour un Responsable de département',
  path: ['departementCode'],
});

type FormData = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userToEdit?: {
    id: string; email: string; prenom: string; nom: string;
    role: string; departementCode: string | null; actif: boolean;
  };
}

export function UserFormDialog({ open, onOpenChange, onSuccess, userToEdit }: UserFormDialogProps) {
  const isEdit = !!userToEdit;
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: userToEdit?.email ?? '',
      prenom: userToEdit?.prenom ?? '',
      nom: userToEdit?.nom ?? '',
      role: (userToEdit?.role as Role) ?? 'ADMINISTRATEUR',
      departementCode: userToEdit?.departementCode ?? undefined,
      password: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (isEdit && userToEdit) {
      const updateData: UpdateUserInput = {
        email: data.email,
        prenom: data.prenom,
        nom: data.nom,
        roles: [{ role: data.role as Role, departementCode: data.departementCode ?? null }],
        departementCode: data.departementCode,
      };
      updateMutation.mutate({ id: userToEdit.id, data: updateData }, {
        onSuccess: () => {
          toast({ title: messages.success, description: messages.userUpdated });
          onSuccess();
          onOpenChange(false);
          form.reset();
        },
        onError: (err) => {
          toast({ title: messages.error, description: err.message, variant: 'destructive' });
        },
      });
    } else {
      setIsCreating(true);
      const createData: CreateUserInput = {
        email: data.email,
        password: data.password ?? '',
        nom: data.nom,
        prenom: data.prenom,
        role: data.role as Role,
        departementCode: data.departementCode ?? null,
      };
      createMutation.mutate(createData, {
        onSuccess: () => {
          toast({ title: messages.success, description: messages.userCreated });
          onSuccess();
          onOpenChange(false);
          form.reset();
          setIsCreating(false);
        },
        onError: (err) => {
          toast({ title: messages.error, description: err.message, variant: 'destructive' });
          setIsCreating(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifiez les informations du compte.' : 'Créez un nouveau compte utilisateur.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.email}</Label>
              <Input {...form.register('email')} placeholder={messages.formEmailPlaceholder} />
              {form.formState.errors.email && (
                <span className="text-sm text-destructive">{form.formState.errors.email.message}</span>
              )}
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <Label>{messages.password}</Label>
                <Input type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <span className="text-sm text-destructive">{form.formState.errors.password.message}</span>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>{messages.prenom}</Label>
              <Input {...form.register('prenom')} placeholder={messages.formFirstNamePlaceholder} />
              {form.formState.errors.prenom && (
                <span className="text-sm text-destructive">{form.formState.errors.prenom.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.nom}</Label>
              <Input {...form.register('nom')} placeholder={messages.formLastNamePlaceholder} />
              {form.formState.errors.nom && (
                <span className="text-sm text-destructive">{form.formState.errors.nom.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.role}</Label>
              <Select {...form.register('role')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectRole} /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <span className="text-sm text-destructive">{form.formState.errors.role.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>{messages.department}</Label>
              <Select {...form.register('departementCode')}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectDepartment} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.departementCode && (
                <span className="text-sm text-destructive">{form.formState.errors.departementCode.message}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {messages.formDepartmentRequired}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating || createMutation.isPending || updateMutation.isPending}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={isCreating || createMutation.isPending || updateMutation.isPending}>
              {isCreating ? messages.loading : (isEdit ? 'Enregistrer' : messages.create)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
