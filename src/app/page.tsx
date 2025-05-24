
// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import IntentDisplay from '@/components/intent-display';
import WalletConnect from '@/components/wallet-connect';
import TransactionFeedback, { type TransactionStatus } from '@/components/transaction-feedback';
import { Button } from '@/components/ui/button';
import { submitVoiceCommand, type SubmitVoiceCommandOutput } from './actions';
import type { ParseTransactionIntentOutput } from '@/ai/flows/parse-transaction-intent';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Zap, Loader2, Mic, StopCircle } from 'lucide-react';
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
  interface SpeechRecognitionErrorEvent extends Event { // Changed from ErrorEvent to Event
    error: string; // Standard SpeechRecognitionError codes
    message: string;
  }
}


export default function VoxChainPayPage() {
  const [voiceCommand, setVoiceCommand] = useState<string>('');
  const [parsedIntent, setParsedIntent] = useState<ParseTransactionIntentOutput | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false); // For NLU processing
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(false);
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionMessage, setTransactionMessage] = useState<string | null>(null);
  
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  
  const { toast } = useToast();

  // States for new voice input UI
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [micStatusText, setMicStatusText] = useState<string>('Tap mic to start voice command');
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleVoiceCommandSubmit = useCallback(async (command: string) => {
    if (!command.trim()) {
      // toast({ title: "Empty Command", description: "Cannot process an empty command.", variant: "default" });
      // Silently ignore empty commands that might come from quick stop after start.
      setIsProcessingVoice(false);
      setCurrentTranscript('');
      setMicStatusText('Tap mic to start voice command');
      return;
    }
    setVoiceCommand(command);
    setIsProcessingVoice(true);
    setMicStatusText('Processing your command...');
    setParsedIntent(null);
    setIntentError(null);
    setTransactionStatus('idle');
    setTransactionMessage(null);

    try {
      const result: SubmitVoiceCommandOutput = await submitVoiceCommand({ voiceCommand: command });
      if ('error' in result) {
        setIntentError(result.error);
        toast({ title: "Intent Parsing Error", description: result.error, variant: "destructive" });
        setMicStatusText('Error parsing. Try again.');
      } else {
        setParsedIntent(result);
        toast({ title: "Intent Parsed", description: `Action: ${result.intent}`, variant: "default" });
        setMicStatusText('Command processed!');
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
      setIntentError(errorMsg);
      toast({ title: "System Error", description: errorMsg, variant: "destructive" });
      setMicStatusText('System error. Try again.');
    } finally {
      setIsProcessingVoice(false);
      // setCurrentTranscript(''); // Clear transcript after processing - NO, keep it visible for review
      setTimeout(() => {
        if (!isRecording) setMicStatusText('Tap mic to start voice command')
      }, 3000);
    }
  }, [toast, isRecording]);


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiSupported(false);
      setMicStatusText('Voice input not supported.');
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support the Web Speech API. Try example commands.",
        variant: "destructive",
      });
    } else {
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
        setCurrentTranscript(finalTranscript || interimTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setMicStatusText('Tap mic to start voice command');
        if (currentTranscript.trim() && !isProcessingVoice) { // check !isProcessingVoice to avoid double submission
            handleVoiceCommandSubmit(currentTranscript.trim());
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
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, [toast, handleVoiceCommandSubmit, isProcessingVoice]); // Added isProcessingVoice to deps of useEffect

  const handleToggleRecording = () => {
    if (!speechApiSupported || !recognitionRef.current) {
      toast({
        title: "Cannot Record",
        description: speechApiSupported ? "Recognition not initialized." : "Speech recognition is not supported.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop(); 
    } else {
      setCurrentTranscript(''); 
      setParsedIntent(null); // Clear previous intent when starting new recording
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
  };

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

  const handleConfirmTransaction = async () => {
    if (!parsedIntent || !connectedWalletAddress || parsedIntent.intent === 'unknown') {
      toast({
        title: "Cannot Proceed",
        description: "Ensure intent is clear and wallet is connected.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingTransaction(true);
    setTransactionStatus('processing');
    setTransactionMessage('Submitting your transaction to the network...');

    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); 

    if (Math.random() > 0.2) { 
      setTransactionStatus('success');
      const successMsg = `Transaction successful! Action: ${parsedIntent.intent}, Amount: ${parsedIntent.amount || 'N/A'}, To: ${parsedIntent.recipientAddress || 'N/A'}`;
      setTransactionMessage(successMsg);
      toast({ title: "Transaction Successful", description: successMsg, variant: "default" });
    } else {
      setTransactionStatus('error');
      const errorMsg = `Transaction failed. Could not complete ${parsedIntent.intent} action. Please try again.`;
      setTransactionMessage(errorMsg);
      toast({ title: "Transaction Failed", description: errorMsg, variant: "destructive" });
    }
    setIsProcessingTransaction(false);
  };
  
  const canConfirmTransaction = parsedIntent && parsedIntent.intent !== 'unknown' && connectedWalletAddress && !isProcessingTransaction && !isProcessingVoice;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <section aria-labelledby="hero-section" className="text-center py-10">
        <h1 id="hero-section" className="text-4xl sm:text-5xl font-bold text-primary">
          Voice Payment System
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-xl mx-auto">
          Experience the future of blockchain payments with voice-activated transactions on Avalanche
        </p>
      </section>

      <Card className="w-full max-w-md mx-auto shadow-xl my-8 bg-card">
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
            {isProcessingVoice ? "Processing..." : isRecording ? "Listening..." : (currentTranscript && !parsedIntent && !intentError ? `Thinking about: "${currentTranscript}"` : micStatusText)}
          </p>

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
          
          {currentTranscript && !isRecording && !isProcessingVoice && !parsedIntent && !intentError && (
            <p className="text-center text-sm text-foreground mt-2 italic">You said: "{currentTranscript}"</p>
          )}

          <p className="text-sm text-muted-foreground h-5 min-h-[1.25rem]">
            {isProcessingVoice ? "" : (isRecording ? "Tap mic to stop" : "")}
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="try-saying-section" className="mt-10 max-w-md mx-auto">
        <h3 id="try-saying-section" className="text-lg font-semibold text-center mb-4 text-foreground">Try saying:</h3>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-muted/50" 
            onClick={() => handleExampleCommand("Send 0.5 AVAX to Alice")}
            disabled={isProcessingVoice || isRecording}
          >
            "Send 0.5 AVAX to Alice"
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow-md transition-shadow bg-card hover:bg-muted/50" 
            onClick={() => handleExampleCommand("Pay 100 USDC to coffee-shop.avax")}
            disabled={isProcessingVoice || isRecording}
          >
            "Pay 100 USDC to coffee-shop.avax"
          </Button>
        </div>
      </section>
      
      {(parsedIntent || intentError) && <Separator className="my-10" />}

      <div className="space-y-8 mt-2"> {/* Reduced margin top if no separator */}
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
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-accent" />
                Confirm Transaction
              </CardTitle>
              <CardDescription>
                Review the parsed intent and connect your wallet to confirm the transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please review the parsed intent and ensure your wallet is connected before proceeding.
                This is a simulated transaction.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleConfirmTransaction} 
                disabled={!canConfirmTransaction}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {isProcessingTransaction ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-5 w-5" />
                )}
                Confirm & Send (Mock)
              </Button>
            </CardFooter>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}

