'use client';

import { useState } from 'react';
import {
  useAssignModules, useUnassignModule,
} from '@/hooks/use-enseignants';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { messages } from '@/lib/messages/fr';
import { Trash2, Plus } from 'lucide-react';
import { getErrorMessage } from '@/lib/api/errors';
import type { ModuleRef } from '@/lib/api/enseignants';

interface ModulesPanelProps {
  enseignantId: string;
  modules: ModuleRef[];
  assignedModuleIds: string[];
}

export function ModulesPanel({ enseignantId, modules, assignedModuleIds }: ModulesPanelProps) {
  const [openAssign, setOpenAssign] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);

  const assignMutation = useAssignModules();
  const unassignMutation = useUnassignModule();

  const availableModules = modules.filter((m) => !assignedModuleIds.includes(m.id));
  const assignedModules = modules.filter((m) => assignedModuleIds.includes(m.id));

  const handleAssign = () => {
    if (!assignId) return;
    assignMutation.mutate({
      enseignantId,
      input: { moduleIds: [assignId] },
    });
    setOpenAssign(false);
    setAssignId(null);
  };

  const handleUnassign = (moduleId: string) => {
    unassignMutation.mutate({ enseignantId, moduleId });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{messages.modulesEnseignables}</h2>
          <p className="text-sm text-muted-foreground">
            {messages.modulesEnseignablesSubtitle}
          </p>
        </div>
        {availableModules.length > 0 && (
          <Button onClick={() => setOpenAssign(true)} disabled={assignMutation.isPending}>
            <Plus size={18} className="mr-2" />
            {messages.assignModule}
          </Button>
        )}
      </div>

      {/* Assigned modules */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{messages.moduleAssigne}</Badge>
          <span className="text-sm text-muted-foreground">
            {assignedModules.length} {messages.modulesCount}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {assignedModules.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground text-center py-4">
              {messages.noModulesAssigned}
            </div>
          ) : (
            assignedModules.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 border rounded-lg bg-background">
                <span className="text-sm">{m.code}</span>
                <Button size="sm" variant="outline" onClick={() => handleUnassign(m.id)} disabled={unassignMutation.isPending}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign dialog */}
      {openAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpenAssign(false)}>
          <div className="bg-background p-6 rounded-xl shadow-lg border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{messages.assignModule}</h3>
            <div className="space-y-2">
              <Label>{messages.module}</Label>
              <Select value={assignId ?? ''} onValueChange={setAssignId}>
                <SelectTrigger className="w-full"><SelectValue placeholder={messages.formSelectModule} /></SelectTrigger>
                <SelectContent>
                  {availableModules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} — {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setOpenAssign(false)} disabled={assignMutation.isPending}>
                {messages.cancel}
              </Button>
              <Button type="button" onClick={handleAssign} disabled={!assignId || assignMutation.isPending}>
                {assignMutation.isPending ? messages.loading : messages.btnAssigner}
              </Button>
            </div>
          </div>
        </div>
      )}

      {assignMutation.isError && (
        <div className="text-sm text-destructive">{getErrorMessage(assignMutation.error) || messages.errorAssignModules}</div>
      )}
      {unassignMutation.isError && (
        <div className="text-sm text-destructive">{getErrorMessage(unassignMutation.error) || messages.errorUnassignModule}</div>
      )}

    </div>
  );
}
