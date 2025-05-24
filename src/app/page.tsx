
// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import IntentDisplay from '@/components/intent-display';
import WalletConnect from '@/components/wallet-connect';
import TransactionFeedback, { type TransactionStatus } from '@/components/transaction-feedback';
import { Button } from '@/components/ui/button';
import { submitVoiceCommand, type SubmitVoiceCommandOutput } from './actions';
import type { ParseTransactionIntentOutput } from '@/ai/flows/parse-transaction-intent';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Zap, Loader2, Mic, StopCircle, Info, Voicemail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Helper to broaden type for SpeechRecognitionEvent and SpeechRecognitionErrorEvent
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}


export default function VoxChainPayPage() {
  const router = useRouter();
  const [voiceCommand, setVoiceCommand] = useState<string>('');
  const [parsedIntent, setParsedIntent] = useState<ParseTransactionIntentOutput | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(false);

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionMessage, setTransactionMessage] = useState<string | null>(null);

  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);

  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [micStatusText, setMicStatusText] = useState<string>('Tap mic to start voice command');
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranscriptRef = useRef(currentTranscript);
  const isProcessingVoiceRef = useRef(isProcessingVoice);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    currentTranscriptRef.current = currentTranscript;
  }, [currentTranscript]);

  useEffect(() => {
    isProcessingVoiceRef.current = isProcessingVoice;
  }, [isProcessingVoice]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const handleVoiceCommandSubmit = useCallback(async (commandToProcess: string) => {
    if (!commandToProcess.trim()) {
      if (!isProcessingVoiceRef.current) {
          setMicStatusText('Tap mic to start voice command');
          setCurrentTranscript('');
      }
      return;
    }

    setVoiceCommand(commandToProcess);
    setIsProcessingVoice(true);
    setMicStatusText('Processing your command...');
    setParsedIntent(null);
    setIntentError(null);
    setTransactionStatus('idle');
    setTransactionMessage(null);

    try {
      const result: SubmitVoiceCommandOutput = await submitVoiceCommand({ voiceCommand: commandToProcess });
      if ('error' in result) {
        setIntentError(result.error);
        toast({ title: "Intent Parsing Error", description: result.error, variant: "destructive" });
        setMicStatusText('Error processing command. Try again.');
      } else {
        setParsedIntent(result);
        toast({ title: "Intent Parsed", description: `Action: ${result.intent}, Protocol: ${result.suggestedProtocol || 'N/A'}`, variant: "default" });
        setMicStatusText('Command processed! Review details below.');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
      setIntentError(errorMsg);
      toast({ title: "System Error", description: errorMsg, variant: "destructive" });
      setMicStatusText('System error. Try again.');
    } finally {
      setIsProcessingVoice(false);
      setTimeout(() => {
        if (!isRecordingRef.current && !isProcessingVoiceRef.current) {
            setMicStatusText('Tap mic to start voice command');
        }
      }, 3000);
    }
  }, [toast]);


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiSupported(false);
      setMicStatusText('Voice input not supported by your browser.');
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support the Web Speech API. Try example commands.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current!;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      const newTranscript = finalTranscript || interimTranscript;
      setCurrentTranscript(newTranscript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const commandToProcess = currentTranscriptRef.current.trim();
      if (commandToProcess && !isProcessingVoiceRef.current) {
        handleVoiceCommandSubmit(commandToProcess);
      } else if (!isProcessingVoiceRef.current) {
        setMicStatusText('Tap mic to start voice command');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error, event.message);
      let errorMsg = event.message || "An error occurred during speech recognition.";
      if (event.error === 'no-speech') {
        errorMsg = "No speech was detected. Please try again.";
      } else if (event.error === 'audio-capture') {
        errorMsg = "Audio capture failed. Ensure microphone is enabled and working.";
      } else if (event.error === 'not-allowed') {
        errorMsg = "Microphone access denied. Please allow microphone access.";
      }
      toast({
        title: "Speech Recognition Error",
        description: errorMsg,
        variant: "destructive",
      });
      setIsRecording(false);
      setMicStatusText('Tap mic to start voice command');
      setCurrentTranscript('');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechApiSupported, toast, handleVoiceCommandSubmit]);

  const handleToggleRecording = useCallback(() => {
    if (!speechApiSupported || !recognitionRef.current) {
      toast({
        title: "Cannot Record",
        description: speechApiSupported ? "Recognition not initialized." : "Speech recognition is not supported.",
        variant: "destructive",
      });
      return;
    }

    if (isRecordingRef.current) { 
      recognitionRef.current.stop();
    } else {
      setCurrentTranscript('');
      setVoiceCommand('');
      setParsedIntent(null);
      setIntentError(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true); 
        setMicStatusText('Listening...');
      } catch (e) {
         console.error("Error starting speech recognition", e);
         toast({
          title: "Could Not Start Recording",
          description: "Failed to start. Check microphone permissions and refresh.",
          variant: "destructive",
        });
        setIsRecording(false); 
        setMicStatusText('Tap mic to start voice command');
      }
    }
  }, [speechApiSupported, toast]);

  const handleExampleCommand = (command: string) => {
    setCurrentTranscript(command);
    handleVoiceCommandSubmit(command);
  };


  const handleConnectWallet = (address: string) => {
    setConnectedWalletAddress(address);
  };

  const handleDisconnectWallet = () => {
    setConnectedWalletAddress(null);
    setTransactionStatus('idle');
    setTransactionMessage(null);
  };

  const handleProceedToVoiceAuth = async () => {
    if (!parsedIntent || !connectedWalletAddress || parsedIntent.intent === 'unknown') {
      toast({
        title: "Cannot Proceed",
        description: "Ensure intent is clear and wallet is connected.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingTransaction(true);

    const queryParams = new URLSearchParams();
    if (parsedIntent.amount) queryParams.set('amount', parsedIntent.amount.toString());
    if (parsedIntent.recipientAddress) queryParams.set('recipient', parsedIntent.recipientAddress);
    if (parsedIntent.token) queryParams.set('token', parsedIntent.token);
    if (parsedIntent.destinationChain) queryParams.set('destinationChain', parsedIntent.destinationChain);
    if (parsedIntent.suggestedProtocol) queryParams.set('protocol', parsedIntent.suggestedProtocol);
    queryParams.set('gas', '0.001'); // Mock gas

    router.push(`/auth/voice?${queryParams.toString()}`);
  };

  const canConfirmTransaction = parsedIntent && parsedIntent.intent !== 'unknown' && connectedWalletAddress && !isProcessingTransaction && !isProcessingVoice;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 text-foreground">
      <section aria-labelledby="hero-section" className="text-center py-10">
         <Voicemail className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 id="hero-section" className="text-4xl sm:text-5xl font-bold text-primary">
          Voice Payment System
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-xl mx-auto">
          Experience the future of blockchain payments with voice-activated transactions on Avalanche
        </p>
      </section>

      <Card className="w-full max-w-md mx-auto shadow-xl my-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-card-foreground">Voice Command Center</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 py-8">
          <div className="flex space-x-1 h-4 items-center" aria-hidden="true">
            {Array.from({ length: 15 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full bg-primary/30 transition-all duration-300
                            ${isRecording && !isProcessingVoice ? 'animate-pulse bg-primary/70 scale-125' : 'bg-primary/30'}`}
                style={{ animationDelay: isRecording ? `${i * 100}ms` : '0ms' }}
              />
            ))}
          </div>

          <p className="text-lg text-muted-foreground h-6 min-h-[1.5rem] text-center px-2">
            {micStatusText}
          </p>

          {currentTranscript && (isRecording || isProcessingVoice || (voiceCommand && (parsedIntent || intentError))) && (
            <p className="text-center text-sm text-foreground mt-1 italic max-w-xs truncate" title={currentTranscript}>"{currentTranscript}"</p>
          )}


          <Button
            variant="default"
            size="lg"
            className="rounded-full w-28 h-28 p-0 bg-primary hover:bg-primary/90 shadow-2xl focus:ring-4 focus:ring-primary/50 active:scale-95 transition-transform"
            onClick={handleToggleRecording}
            disabled={isProcessingVoice || !speechApiSupported}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <StopCircle className="h-16 w-16 text-primary-foreground" /> : <Mic className="h-16 w-16 text-primary-foreground" />}
          </Button>

          <p className="text-sm text-muted-foreground h-5 min-h-[1.25rem]">
            {isProcessingVoice ? "" : (isRecording ? "Tap mic to stop" : "")}
          </p>

            {voiceCommand && (parsedIntent || intentError) && !isProcessingVoice && (
                <div className="w-full mt-4 p-4 bg-muted/50 rounded-lg border border-border text-center">
                    <p className="text-sm font-medium text-card-foreground mb-1">Recognized Command:</p>
                    <p className="text-md text-muted-foreground italic">"{voiceCommand}"</p>
                </div>
            )}
        </CardContent>
      </Card>

      <section aria-labelledby="try-saying-section" className="mt-10 max-w-md mx-auto">
        <h3 id="try-saying-section" className="text-lg font-semibold text-center mb-4 text-foreground">Try saying:</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-muted/50 border-border text-card-foreground hover:text-accent-foreground"
            onClick={() => handleExampleCommand("Send 0.5 AVAX to Alice")}
            disabled={isProcessingVoice || isRecording}
          >
            "Send 0.5 AVAX to Alice"
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-muted/50 border-border text-card-foreground hover:text-accent-foreground"
            onClick={() => handleExampleCommand("Pay 100 USDC to coffee-shop.avax on Ethereum")}
            disabled={isProcessingVoice || isRecording}
          >
            "Pay 100 USDC to coffee-shop.avax on Ethereum"
          </Button>
           <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-muted/50 border-border text-card-foreground hover:text-accent-foreground"
            onClick={() => handleExampleCommand("Send 10 AVAX to Bob on DFK Subnet")}
            disabled={isProcessingVoice || isRecording}
          >
            "Send 10 AVAX to Bob on DFK Subnet"
          </Button>
        </div>
      </section>

      {(parsedIntent || intentError) && <Separator className="my-10" />}

      <div className="space-y-8 mt-2">
        {(parsedIntent || intentError) && (
          <section aria-labelledby="transaction-details-section" className="space-y-6">
            <h2 id="transaction-details-section" className="sr-only">Transaction Details</h2>
            <IntentDisplay intent={parsedIntent} error={intentError} />
          </section>
        )}

        <section aria-labelledby="wallet-connect-section" className="space-y-6">
           <h2 id="wallet-connect-section" className="sr-only">Wallet Connection</h2>
           <WalletConnect
            onConnect={handleConnectWallet}
            onDisconnect={handleDisconnectWallet}
            connectedAddress={connectedWalletAddress}
          />
        </section>


        {(transactionStatus !== 'idle' || transactionMessage) && (
          <>
            <Separator />
            <section aria-labelledby="transaction-feedback-section">
              <h2 id="transaction-feedback-section" className="sr-only">Transaction Feedback</h2>
              <TransactionFeedback status={transactionStatus} message={transactionMessage} />
            </section>
          </>
        )}

        {parsedIntent && parsedIntent.intent !== 'unknown' && (
          <>
          <Separator />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Zap className="h-6 w-6 text-accent" />
                Confirm Transaction
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Review the parsed intent and connect your wallet. Voice authentication will be required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please review the parsed intent and ensure your wallet is connected before proceeding.
                You will be asked to authenticate with your voice.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleProceedToVoiceAuth}
                disabled={!canConfirmTransaction}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {isProcessingTransaction ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-5 w-5" />
                )}
                Proceed to Voice Authentication
              </Button>
            </CardFooter>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}

