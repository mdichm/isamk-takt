'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateChargeRuleSet,
  useUpdateChargeRuleSet,
  type CreateChargeRuleSetInput,
  type UpdateChargeRuleSetInput,
  type PeriodeRegle,
} from '@/hooks/use-charge-ruleset';
import { messages } from '@/lib/messages/fr';
import { ChargeRuleSet } from '@/lib/api/charge-ruleset';

const periodeOptions: { value: PeriodeRegle; label: string }[] = [
  { value: 'HEBDOMADAIRE', label: messages.periodeHebdomadaire },
  { value: 'SEMESTRIELLE', label: messages.periodeSemestrielle },
  { value: 'ANNUELLE', label: messages.periodeAnnuelle },
];

interface RulesetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleset?: ChargeRuleSet;
  onSuccess?: () => void;
}

export function RulesetFormDialog({
  open,
  onOpenChange,
  ruleset,
  onSuccess,
}: RulesetFormDialogProps) {
  const [numero, setNumero] = useState(ruleset?.numero ?? '');
  const [periode, setPeriode] = useState<PeriodeRegle | ''>(
    ruleset?.periode ?? '',
  );
  const [seuil, setSeuil] = useState(ruleset?.seuil ?? '');
  const [plafond, setPlafond] = useState(ruleset?.plafond ?? '');
  const [arrondi, setArrondi] = useState(ruleset?.arrondi ?? '');
  const [anneeId, setAnneeId] = useState(ruleset?.anneeId ?? '');
  const isEdit = !!ruleset;
  const isPublished = ruleset?.publieLe !== null;

  const createMutation = useCreateChargeRuleSet();
  const updateMutation = useUpdateChargeRuleSet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateChargeRuleSetInput | UpdateChargeRuleSetInput = {
      numero: Number(numero),
      periode: periode as PeriodeRegle,
      ...(seuil !== '' ? { seuil: Number(seuil) } : {}),
      ...(plafond !== '' ? { plafond: Number(plafond) } : {}),
      ...(arrondi !== '' ? { arrondi: Number(arrondi) } : {}),
      ...(anneeId !== '' ? { anneeId } : {}),
    };

    if (isEdit && ruleset) {
      updateMutation.mutate({ id: ruleset.id, input });
    } else {
      createMutation.mutate(input as CreateChargeRuleSetInput);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (createMutation.isSuccess || updateMutation.isSuccess) {
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? messages.btnEditer : messages.btnCreerRuleset}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les paramètres du jeu de règles de charge.'
              : 'Créez un nouveau jeu de règles de charge.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelNumero}</Label>
              <Input
                type="number"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                disabled={isEdit || isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{messages.labelPeriode}</Label>
              <Select
                value={periode}
                onValueChange={(v) => setPeriode(v as PeriodeRegle)}
                disabled={isEdit || isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{messages.labelSeuil}</Label>
              <Input
                type="number"
                value={seuil}
                onChange={(e) => setSeuil(e.target.value)}
                disabled={isPublished || isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{messages.labelPlafond}</Label>
              <Input
                type="number"
                value={plafond}
                onChange={(e) => setPlafond(e.target.value)}
                disabled={isPublished || isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>{messages.labelArrondi}</Label>
              <Input
                type="number"
                value={arrondi}
                onChange={(e) => setArrondi(e.target.value)}
                disabled={isPublished || isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{messages.labelAnnee}</Label>
            <Input
              value={anneeId}
              onChange={(e) => setAnneeId(e.target.value)}
              disabled={isPublished || isPending}
              placeholder="ID de l’année universitaire"
            />
          </div>
          {isEdit && isPublished && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
              Ce jeu de règles est publié et ne peut plus être modifié.
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? messages.loading : messages.btnEnregistrer}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}