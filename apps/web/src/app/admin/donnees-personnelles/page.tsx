'use client';

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getMyData,
  updateMyData,
  deleteMyData,
  type MesDonneesDto,
  type DonneesSecuriteDto,
  type DonneesExportDto,
  type ExportMesDonneesDto,
  type RectificationDto,
} from '@/lib/api/users';
import { messages } from '@/lib/messages/fr';
import { getCurrentUserRole } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import {
  Download,
  Edit,
  Trash2,
} from 'lucide-react';

const queryClient = new QueryClient();

function DonneesPersonnellesContent() {
  const qClient = useQueryClient();
  const { toast } = useToast();
  const [rectificationOpen, setRectificationOpen] = useState(false);
  const [suppressionOpen, setSuppressionOpen] = useState(false);
  const [rectificationData, setRectificationData] = useState<RectificationDto>({});

  const { data: donnees, isLoading: loading } = useQuery<ExportMesDonneesDto>({
    queryKey: ['mesDonnees'],
    queryFn: getMyData,
  });

  const exportMutation = useMutation({
    mutationFn: getMyData,
    onSuccess: () => {
      toast({ title: messages.exportSuccess });
    },
    onError: () => {
      toast({ title: messages.exportError, variant: 'destructive' });
    },
  });

  const rectificationMutation = useMutation({
    mutationFn: (data: RectificationDto) => updateMyData(data),
    onSuccess: () => {
      toast({ title: messages.rectificationSuccess });
      setRectificationOpen(false);
      setRectificationData({});
      qClient.invalidateQueries({ queryKey: ['mesDonnees'] });
    },
    onError: () => {
      toast({ title: messages.rectificationError, variant: 'destructive' });
    },
  });

  const suppressionMutation = useMutation({
    mutationFn: deleteMyData,
    onSuccess: () => {
      toast({ title: messages.suppressionSuccess });
      setSuppressionOpen(false);
    },
    onError: () => {
      toast({ title: messages.suppressionError, variant: 'destructive' });
    },
  });

  if (loading || !donnees) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  const profil: MesDonneesDto = donnees.profil;
  const securite: DonneesSecuriteDto[] = donnees.securite;
  const exports: DonneesExportDto[] = donnees.exports;

  return (
    <>
    <Toast />
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {messages.donneesPersonnelles}
            </h1>
            <p className="text-muted-foreground">
              {messages.donneesPersonnellesSubtitle}
            </p>
          </div>
          <Button onClick={() => exportMutation.mutate(undefined)}>
            <Download size={18} className="mr-2" />
            {messages.btnExporterMesDonnees}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>{profil.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{messages.labelNom}</Label>
                <p className="text-sm">{profil.nom}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{messages.labelPrenom}</Label>
                <p className="text-sm">{profil.prenom}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{messages.labelEmail}</Label>
                <p className="text-sm">{profil.email}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Événements de sécurité ({securite.length})
              </h3>
              {securite.length === 0 ? (
                <p className="text-sm text-muted-foreground">{messages.noData}</p>
              ) : (
                <ul className="text-sm space-y-2">
                  {securite.slice(0, 10).map((e) => (
                    <li key={e.id} className="flex justify-between text-muted-foreground">
                      <span>{e.type}</span>
                      <span>{new Date(e.at).toLocaleString('fr-FR')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Jobs d&apos;export ({exports.length})
              </h3>
              {exports.length === 0 ? (
                <p className="text-sm text-muted-foreground">{messages.noData}</p>
              ) : (
                <ul className="text-sm space-y-2">
                  {exports.slice(0, 10).map((e) => (
                    <li key={e.id} className="flex justify-between text-muted-foreground">
                      <span>{e.format} • {e.statut}</span>
                      <span>{new Date(e.createdAt).toLocaleString('fr-FR')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Button onClick={() => setRectificationOpen(true)}>
              <Edit size={18} className="mr-2" />
              {messages.btnRectifierMesDonnees}
            </Button>
            <Button onClick={() => setSuppressionOpen(true)} variant="destructive">
              <Trash2 size={18} className="mr-2" />
              {messages.btnDemanderSuppression}
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={rectificationOpen} onOpenChange={setRectificationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messages.btnRectifierMesDonnees}</DialogTitle>
              <DialogDescription>
                Modifiez vos informations personnelles.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); rectificationMutation.mutate(rectificationData); }} id="rectification-form">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{messages.labelNom}</Label>
                    <Input value={rectificationData.nom ?? profil.nom} onChange={(e) => setRectificationData({ ...rectificationData, nom: e.target.value })} />
                  </div>
                  <div>
                    <Label>{messages.labelPrenom}</Label>
                    <Input value={rectificationData.prenom ?? profil.prenom} onChange={(e) => setRectificationData({ ...rectificationData, prenom: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{messages.labelEmail}</Label>
                  <Input type="email" value={rectificationData.email ?? profil.email} onChange={(e) => setRectificationData({ ...rectificationData, email: e.target.value })} />
                </div>
              </div>
            </form>
            <DialogFooter>
              <Button type="button" onClick={() => setRectificationOpen(false)}>{messages.cancel}</Button>
              <Button type="submit" form="rectification-form" disabled={rectificationMutation.isPending}>
                {rectificationMutation.isPending ? 'Enregistrement...' : messages.btnSave}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={suppressionOpen} onOpenChange={setSuppressionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messages.btnDemanderSuppression}</DialogTitle>
              <DialogDescription>{messages.suppressionConfirm}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setSuppressionOpen(false)}>{messages.cancel}</Button>
              <Button type="button" onClick={() => suppressionMutation.mutate()} disabled={suppressionMutation.isPending} variant="destructive">
                {suppressionMutation.isPending ? 'Traitement...' : messages.btnDemanderSuppression}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function DonneesPersonnellesPage() {
  const role = getCurrentUserRole();

  if (role === undefined) {
    return <div className="p-4"><p>{messages.loading}</p></div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DonneesPersonnellesContent />
    </QueryClientProvider>
  );
}