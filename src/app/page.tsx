// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import VoiceInput from '@/components/voice-input';
import IntentDisplay from '@/components/intent-display';
import WalletConnect from '@/components/wallet-connect';
import TransactionFeedback, { type TransactionStatus } from '@/components/transaction-feedback';
import { Button } from '@/components/ui/button';
import { submitVoiceCommand, type SubmitVoiceCommandOutput } from './actions';
import type { ParseTransactionIntentOutput } from '@/ai/flows/parse-transaction-intent';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VoxChainPayPage() {
  const [voiceCommand, setVoiceCommand] = useState<string>('');
  const [parsedIntent, setParsedIntent] = useState<ParseTransactionIntentOutput | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(false);
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionMessage, setTransactionMessage] = useState<string | null>(null);
  
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleVoiceCommandSubmit = async (command: string) => {
    setVoiceCommand(command);
    setIsProcessingVoice(true);
    setParsedIntent(null);
    setIntentError(null);
    setTransactionStatus('idle');
    setTransactionMessage(null);

    try {
      const result: SubmitVoiceCommandOutput = await submitVoiceCommand({ voiceCommand: command });
      if ('error' in result) {
        setIntentError(result.error);
        toast({ title: "Intent Parsing Error", description: result.error, variant: "destructive" });
      } else {
        setParsedIntent(result);
        toast({ title: "Intent Parsed", description: `Action: ${result.intent}`, variant: "default" });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unexpected error occurred.";
      setIntentError(errorMsg);
      toast({ title: "System Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsProcessingVoice(false);
    }
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

    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000)); // Simulate network latency

    // Simulate random success/failure
    if (Math.random() > 0.2) { // 80% success rate
      setTransactionStatus('success');
      const successMsg = `Transaction successful! Action: ${parsedIntent.intent}, Amount: ${parsedIntent.amount || 'N/A'}`;
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
  
  const canConfirmTransaction = parsedIntent && parsedIntent.intent !== 'unknown' && connectedWalletAddress && !isProcessingTransaction;

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="space-y-8">
        <section aria-labelledby="voice-command-section">
          <h2 id="voice-command-section" className="sr-only">Voice Command</h2>
          <VoiceInput 
            onCommandSubmit={handleVoiceCommandSubmit} 
            isProcessing={isProcessingVoice}
            initialCommand="Send 1.5 AVAX to 0x123...abc"
          />
        </section>

        <Separator />

        <section aria-labelledby="transaction-details-section" className="space-y-6">
          <h2 id="transaction-details-section" className="sr-only">Transaction Details</h2>
          <IntentDisplay intent={parsedIntent} error={intentError} />
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
        
        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              Confirm Transaction
            </CardTitle>
            <CardDescription>
              Once your command is parsed and wallet connected, you can confirm the transaction.
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

      </div>
    </div>
  );
}
