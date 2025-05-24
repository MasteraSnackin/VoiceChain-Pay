// src/components/intent-display.tsx
import type { FC } from 'react';
import type { ParseTransactionIntentOutput } from '@/ai/flows/parse-transaction-intent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Info } from 'lucide-react';

interface IntentDisplayProps {
  intent: ParseTransactionIntentOutput | null;
  error?: string | null;
}

const IntentDisplay: FC<IntentDisplayProps> = ({ intent, error }) => {
  if (error) {
    return (
      <Card className="w-full shadow-lg bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Error Parsing Intent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!intent) {
    return (
       <Card className="w-full shadow-lg border-dashed border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-6 w-6" />
            Parsed Transaction Intent
          </CardTitle>
          <CardDescription>No command processed yet. Parsed details will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Waiting for command...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          Parsed Transaction Intent
        </CardTitle>
        <CardDescription>
          Review the details parsed from your voice command.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto max-h-[300px] rounded-md border p-4 bg-muted/20">
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(intent, null, 2)}
          </pre>
        </ScrollArea>
        {intent.intent === 'unknown' && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-500">
            The intent of the command was unclear. Please try rephrasing.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IntentDisplay;
