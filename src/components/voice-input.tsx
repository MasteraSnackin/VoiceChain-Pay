// src/components/voice-input.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Mic, Send, Loader2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onCommandSubmit: (command: string) => void;
  isProcessing: boolean;
  initialCommand?: string;
}

const VoiceInput: FC<VoiceInputProps> = ({ onCommandSubmit, isProcessing, initialCommand = "" }) => {
  const [command, setCommand] = useState<string>(initialCommand);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechApiSupported(false);
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support the Web Speech API. Please type your commands.",
        variant: "destructive",
      });
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleToggleRecording = () => {
    if (!speechApiSupported) {
      toast({
        title: "Cannot Record",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return; // Should be caught by useEffect, but as a safeguard

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        setCommand(transcript);
        onCommandSubmit(transcript); // Automatically submit after successful recognition
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        let errorMsg = "An error occurred during speech recognition.";
        if (event.error === 'no-speech') {
          errorMsg = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
          errorMsg = "Audio capture failed. Ensure microphone is enabled and working.";
        } else if (event.error === 'not-allowed') {
          errorMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
        }
        toast({
          title: "Speech Recognition Error",
          description: errorMsg,
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording Started", description: "Speak your command." });
      } catch (e) {
         console.error("Error starting speech recognition", e);
         toast({
          title: "Could Not Start Recording",
          description: "Failed to start speech recognition. Check microphone permissions.",
          variant: "destructive",
        });
        setIsRecording(false);
      }
    }
  };

  const handleSubmitTypedCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isProcessing && !isRecording) {
      onCommandSubmit(command.trim());
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          Voice Command Input
        </CardTitle>
        <CardDescription>
          {speechApiSupported 
            ? "Click 'Start Recording' or type your command below." 
            : "Speech input not supported. Please type your command."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmitTypedCommand}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="voice-command-input" className="sr-only">Voice Command</Label>
            <Textarea
              id="voice-command-input"
              placeholder="e.g., 'Send 0.5 AVAX to my savings account' or 'Swap 10 AVAX for USDC'"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={3}
              disabled={isProcessing || isRecording}
              className="resize-none bg-input text-input-foreground placeholder:text-muted-foreground"
            />
          </div>
          {speechApiSupported && (
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleRecording}
              disabled={isProcessing || !speechApiSupported}
              className="w-full sm:w-auto"
              aria-label={isRecording ? "Stop Recording Voice Command" : "Start Recording Voice Command"}
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4 text-red-500" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>
          )}
           {!speechApiSupported && (
            <p className="text-sm text-destructive">Live voice input is not supported by your browser.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isProcessing || isRecording || !command.trim()} className="w-full">
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Process Typed Command
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default VoiceInput;
