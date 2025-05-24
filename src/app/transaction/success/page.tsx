
// src/app/transaction/success/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, Zap, ArrowLeft, Loader2, Settings2, Network, LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  isNetwork?: boolean;
  isProtocol?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isNetwork, isProtocol }) => (
  <div className="flex justify-between items-center bg-card/60 p-3 rounded-lg my-1.5 shadow-sm hover:shadow-md transition-shadow">
    <span className="text-muted-foreground text-sm">{label}</span>
    {isNetwork ? (
      <div className="flex items-center">
        <span className="h-2.5 w-2.5 bg-red-500 rounded-full mr-2 animate-pulse"></span> {/* Avalanche Red */}
        <span className="text-foreground font-semibold text-sm">{value}</span>
      </div>
    ) : isProtocol ? (
      <div className="flex items-center">
        <Settings2 className="h-4 w-4 text-primary mr-2" />
        <span className="text-foreground font-semibold text-sm">{value}</span>
      </div>
    ) : (
      <span className="text-foreground font-semibold text-sm text-right break-all">{value}</span>
    )}
  </div>
);

function TransactionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [amount, setAmount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [gas, setGas] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [destinationChain, setDestinationChain] = useState<string | null>(null);
  const [creationTime, setCreationTime] = useState<string>('');

  useEffect(() => {
    setAmount(searchParams.get('amount'));
    setRecipient(searchParams.get('recipient'));
    setToken(searchParams.get('token'));
    setGas(searchParams.get('gas'));
    const protocolParam = searchParams.get('protocol');
    setProtocol(protocolParam);
    if (protocolParam && protocolParam !== 'SameChain') {
      setDestinationChain(searchParams.get('destinationChain'));
    }
    setCreationTime(format(new Date(), "dd/MM/yyyy, HH:mm:ss"));
  }, [searchParams]);

  const mockTxHash = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const mockBlockNumber = `#${Math.floor(Math.random() * 10000000) + 40000000}`;
  const mockConfirmations = "12/12";
  const sourceNetworkName = "Avalanche C-Chain";

  const isCrossChain = protocol && protocol !== 'SameChain';
  let successTitle = "Transaction Successful";
  let successMessage = `Your transaction to ${recipient || 'recipient'} for ${amount || 'amount'} ${token || ''} is complete.`;
  let protocolDisplayName = protocol;
  let protocolFooterMessage = "";

  if (protocol === 'CCIP') {
    successTitle = "Cross-Chain Tx Initiated (CCIP)";
    successMessage = `Your CCIP transaction to ${recipient || 'recipient'} on ${destinationChain || 'destination'} for ${amount || 'amount'} ${token || ''} has been initiated via Chainlink CCIP.`;
    protocolFooterMessage = "Powered by Chainlink CCIP";
    protocolDisplayName = "Chainlink CCIP";
  } else if (protocol === 'AvalancheTeleporter') {
    successTitle = "Subnet Tx Initiated (Teleporter)";
    successMessage = `Your transaction to ${recipient || 'recipient'} on ${destinationChain || 'destination subnet'} for ${amount || 'amount'} ${token || ''} has been initiated via Avalanche Teleporter.`;
    protocolFooterMessage = "Powered by Avalanche Teleporter (AWM/ICM)";
    protocolDisplayName = "Avalanche Teleporter";
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-foreground">
      <Card className="w-full max-w-lg bg-card/70 backdrop-blur-md border-border shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">{successTitle}</CardTitle>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-1 h-4 w-4" />
              {isCrossChain ? 'Initiated' : 'Completed'}
            </Badge>
          </div>
          <CardDescription className="text-muted-foreground">{successMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailRow label="Amount" value={`${amount || 'N/A'} ${token || ''}`} />
          <DetailRow label="Recipient" value={recipient || 'N/A'} />
          <DetailRow label="Source Network" value={sourceNetworkName} isNetwork />
          {isCrossChain && destinationChain && <DetailRow label="Destination Network" value={destinationChain} isNetwork />}
          {isCrossChain && protocolDisplayName && <DetailRow label="Cross-Chain Protocol" value={protocolDisplayName} isProtocol />}
          <DetailRow label="Est. Gas Fee" value={`${gas || '0.001'} ${token || 'AVAX'}`} />

          <Card className="bg-card/60 shadow-md mt-3">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-lg flex items-center text-green-500">
                <CheckCircle className="mr-2 h-5 w-5" />
                On-Chain Details (Simulated)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 pt-1 pb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Hash:</span>
                <span className="text-foreground font-mono text-xs">{`${mockTxHash.substring(0,10)}...${mockTxHash.substring(mockTxHash.length -8)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Block Number:</span>
                <span className="text-foreground">{mockBlockNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmations:</span>
                <span className="text-foreground">{mockConfirmations}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <Card className="bg-card/60 p-3 rounded-lg shadow-md text-center">
              <Lock className="h-5 w-5 mx-auto mb-1 text-accent" />
              <p className="text-xs text-muted-foreground">Voice Secured</p>
              <p className="font-semibold text-sm text-foreground">Verified</p>
            </Card>
            <Card className="bg-card/60 p-3 rounded-lg shadow-md text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Network Speed</p>
              <p className="font-semibold text-sm text-foreground">&lt;1s Finality (Source)</p>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center text-xs text-muted-foreground pt-4 space-y-3">
          {isCrossChain && protocolFooterMessage && (
            <div className="flex items-center space-x-2 text-center text-xs text-muted-foreground p-2 rounded-md bg-muted/30 w-full justify-center">
                {protocol === 'CCIP' ? <LinkIcon size={14} className="text-primary" /> : <Network size={14} className="text-primary" />}
                <span>{protocolFooterMessage}</span>
            </div>
          )}
          <p>Created: {creationTime}</p>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function TransactionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground"><Loader2 className="h-12 w-12 animate-spin text-primary" />Loading Details...</div>}>
      <TransactionSuccessContent />
    </Suspense>
  );
}

