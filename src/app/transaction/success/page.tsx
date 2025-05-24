// src/app/transaction/success/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  isNetwork?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isNetwork }) => (
  <div className="flex justify-between items-center bg-card/60 p-4 rounded-lg my-2 shadow-md">
    <span className="text-muted-foreground text-sm">{label}</span>
    {isNetwork ? (
      <div className="flex items-center">
        <span className="h-2.5 w-2.5 bg-red-500 rounded-full mr-2"></span>
        <span className="text-foreground font-semibold text-sm">{value}</span>
      </div>
    ) : (
      <span className="text-foreground font-semibold text-sm">{value}</span>
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
  const [creationTime, setCreationTime] = useState<string>('');

  useEffect(() => {
    setAmount(searchParams.get('amount'));
    setRecipient(searchParams.get('recipient'));
    setToken(searchParams.get('token'));
    setGas(searchParams.get('gas'));
    setCreationTime(format(new Date(), "dd/MM/yyyy, HH:mm:ss"));
  }, [searchParams]);

  const mockTxHash = "0xabc1234567890def1234567890abc1234567890def456";
  const mockBlockNumber = "#45,234,567";
  const mockConfirmations = "12/12";
  const networkName = "Avalanche C-Chain";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-foreground">
      <Card className="w-full max-w-md bg-card/70 backdrop-blur-md border-border shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">Transaction Details</CardTitle>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-1 h-4 w-4" />
              Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Amount" value={`${amount || 'N/A'} ${token || ''}`} />
          <DetailRow label="Recipient" value={recipient || 'N/A'} />
          <DetailRow label="Network" value={networkName} isNetwork />
          <DetailRow label="Gas Fee" value={`${gas || '0.001'} ${token || 'AVAX'}`} />

          <Card className="bg-card/60 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-green-500">
                <CheckCircle className="mr-2 h-5 w-5" />
                Transaction Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1 pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Hash:</span>
                <span className="text-foreground font-mono">{`${mockTxHash.substring(0,8)}...${mockTxHash.substring(mockTxHash.length -6)}`}</span>
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
            <Card className="bg-card/60 p-4 rounded-lg shadow-md text-center">
              <Lock className="h-6 w-6 mx-auto mb-1 text-accent" />
              <p className="text-xs text-muted-foreground">Voice Secured</p>
              <p className="font-semibold text-sm text-foreground">Verified</p>
            </Card>
            <Card className="bg-card/60 p-4 rounded-lg shadow-md text-center">
              <Zap className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Network Speed</p>
              <p className="font-semibold text-sm text-foreground">&lt;1s finality</p>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-center text-xs text-muted-foreground pt-4 space-y-3">
          <p>Created: {creationTime}</p>
          <Button variant="outline" onClick={() => router.push('/')} className="w-full">
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
