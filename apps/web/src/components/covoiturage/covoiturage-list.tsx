'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { findAllEnseignants, Enseignant } from '@/lib/api/enseignants';
import { messages } from '@/lib/messages/fr';

interface CovoiturageGroupe {
  id: string;
  semestreId: string;
  enseignantIds: string[];
  margeMinutes: number;
  joursCommunsMin: number;
  strict: boolean;
  createdAt: string;
}

interface CovoiturageListProps {
  groupes: CovoiturageGroupe[];
  onEdit: (groupe: CovoiturageGroupe) => void;
  onDelete: (id: string) => Promise<void>;
}

export function CovoiturageList({
  groupes,
  onEdit,
  onDelete,
}: CovoiturageListProps) {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [deleting, setDeleting] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    findAllEnseignants({ limit: 100 }).then((r) => {
      if (mounted) setEnseignants(r.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const enseignantMap = new Map(
    enseignants.map((e) => [e.id, `${e.prenom} ${e.nom}`]),
  );

  const nomsMembres = (ids: string[]) =>
    ids
      .map((id) => enseignantMap.get(id) ?? id)
      .join(', ');

  const handleDelete = async (id: string) => {
    if (!window.confirm(messages.confirmDeleteGroupe)) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(undefined);
    }
  };

  if (groupes.length === 0) {
    return (
      <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
        {messages.noCovoiturageGroupes}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">{messages.covoiturageGroupe}</th>
            <th className="p-2">{messages.covoiturageMembres}</th>
            <th className="p-2">{messages.margeMinutes}</th>
            <th className="p-2">{messages.covoiturageMode}</th>
            <th className="p-2">{messages.columnActions}</th>
          </tr>
        </thead>
        <tbody>
          {groupes.map((g) => (
            <tr key={g.id} className="border-b hover:bg-muted/50">
              <td className="p-2 font-medium truncate max-w-[120px]">
                {g.id.slice(0, 8)}…
              </td>
              <td className="p-2 truncate max-w-[200px]">
                {nomsMembres(g.enseignantIds)}
              </td>
              <td className="p-2">{g.margeMinutes} min</td>
              <td className="p-2">
                <Badge
                  variant={g.strict ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {g.strict ? messages.modeStrict : messages.modeSouple}
                </Badge>
              </td>
              <td className="p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">{messages.columnActions}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => onEdit(g)}>
                      {messages.edit}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleDelete(g.id)}
                      className="text-destructive"
                    >
                      {messages.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deleting && (
        <p className="p-2 text-xs text-muted-foreground">
          {messages.covoiturageDeleting}
        </p>
      )}
    </div>
  );
}
