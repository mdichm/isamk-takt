'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuggestions, type SuggestionDto } from '@/hooks/use-seances';
import { moveSeance, type MoveSeanceDto } from '@/lib/api/seances';
import { messages } from '@/lib/messages/fr';
import { toast } from 'sonner';

interface SuggestionItemProps {
  suggestion: SuggestionDto;
  seanceId: string;
  onApplied: () => void;
}

function SuggestionItem({
  suggestion,
  seanceId,
  onApplied,
}: SuggestionItemProps) {

  const handleApply = useCallback(async () => {
    try {
      await moveSeance(seanceId, {
        jour: suggestion.jour,
        creneauDebutId: suggestion.creneauDebutId,
        salleId: suggestion.salleId,
      } as MoveSeanceDto, '');
      toast.success(messages.appliquerSucces);
      onApplied();
    } catch {
      // Erreur gérée par apiFetch / toast
    }
  }, [seanceId, suggestion, onApplied]);

  return (
    <TableRow
      key={`${suggestion.jour}-${suggestion.creneauDebutId}-${suggestion.salleId}`}
      className="hover:bg-muted/50 cursor-pointer"
      onClick={handleApply}
    >
      <TableCell className="font-medium text-[color:#29363C]">
        {suggestion.jour}
      </TableCell>
      <TableCell>{suggestion.creneauDebutId}</TableCell>
      <TableCell>{suggestion.salleId}</TableCell>
      <TableCell className="text-right">{suggestion.conflitsResolus}</TableCell>
      <TableCell className="text-right">
        {suggestion.deltaScoreSouple >= 0 ? '+' : ''}{suggestion.deltaScoreSouple}
      </TableCell>
      <TableCell className="text-right">{suggestion.distanceMinutes} min</TableCell>
      <TableCell>
        {suggestion.salleConservee ? (
          <span className="text-xs text-green-600">✓</span>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        )}
      </TableCell>
      {suggestion.estAlternativeEnseignant && (
        <TableCell className="text-right">
          <Badge variant="outline" className="text-xs">
            {messages.suggestionAlternativeEnseignant}
          </Badge>
        </TableCell>
      )}
      <TableCell>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleApply();
          }}
          disabled={false}
        >
          {messages.appliquerSuggestion}
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface SuggestionsPanelProps {
  seanceId: string;
}

export function SuggestionsPanel({
  seanceId,
}: SuggestionsPanelProps) {
  const { data, isLoading, error } = useSuggestions(seanceId, { limit: 20 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {messages.loading}…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    toast.error(messages.erreurSuggestions);
    return null;
  }

  if (!data || data.suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{messages.suggestions}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-muted-foreground">
          {messages.suggestionsAucune}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{messages.suggestions}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{messages.colonneJour}</TableHead>
                <TableHead>{messages.colonneCreneau}</TableHead>
                <TableHead>{messages.colonneSalle}</TableHead>
                <TableHead className="text-right">{messages.suggestionConflitsResolus}</TableHead>
                <TableHead className="text-right">{messages.suggestionDeltaScore}</TableHead>
                <TableHead className="text-right">{messages.suggestionDistance}</TableHead>
                <TableHead>{messages.suggestionSalleConservee}</TableHead>
                <TableHead className="text-right"></TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.suggestions.map((s) => (
                <SuggestionItem
                  key={`${s.jour}-${s.creneauDebutId}-${s.salleId}`}
                  suggestion={s}
                  seanceId={seanceId}
                  onApplied={() => {}}
                />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}