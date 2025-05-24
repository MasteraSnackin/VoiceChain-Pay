// src/components/voice-input.tsx
'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { Mic, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface VoiceInputProps {
  onCommandSubmit: (command: string) => void;
  isProcessing: boolean;
  initialCommand?: string;
}

const VoiceInput: FC<VoiceInputProps> = ({ onCommandSubmit, isProcessing, initialCommand = "" }) => {
  const [command, setCommand] = useState<string>(initialCommand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isProcessing) {
      onCommandSubmit(command.trim());
    }
  };

  // Placeholder for actual voice recording logic
  const handleVoiceRecord = () => {
    // In a real app, this would initiate voice recording.
    // For now, it could clear the textarea or set a placeholder.
    setCommand("Simulated voice input: Send 1 AVAX to Bob"); 
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          Voice Command Input
        </CardTitle>
        <CardDescription>
          Enter your transaction command below or use the microphone (simulation).
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="voice-command-input" className="sr-only">Voice Command</Label>
            <Textarea
              id="voice-command-input"
              placeholder="e.g., 'Send 0.5 AVAX to my savings account' or 'Swap 10 AVAX for USDC'"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
              disabled={isProcessing}
              className="resize-none bg-input text-input-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleVoiceRecord}
            disabled={isProcessing}
            className="w-full sm:w-auto"
            aria-label="Start Voice Recording (Simulated)"
          >
            <Mic className="mr-2 h-4 w-4" />
            Record Voice (Simulated)
          </Button>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isProcessing || !command.trim()} className="w-full">
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Process Command
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default VoiceInput;
