// src/components/wallet-connect.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Wallet, LogOut, CheckCircle, Link2Off } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  connectedAddress: string | null;
}

const WalletConnect: FC<WalletConnectProps> = ({ onConnect, onDisconnect, connectedAddress }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // Effect to show toast on connection status change
  useEffect(() => {
    if (connectedAddress) {
      toast({
        title: "Wallet Connected",
        description: `Address: ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`,
        variant: "default",
      });
    }
  }, [connectedAddress, toast]);


  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    onConnect(mockAddress);
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    onDisconnect();
    toast({
      title: "Wallet Disconnected",
      variant: "default",
    });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Wallet Connection
        </CardTitle>
        <CardDescription>
          {connectedAddress 
            ? "Manage your connected wallet." 
            : "Connect your wallet to proceed with transactions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectedAddress ? (
          <div className="space-y-2">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="mr-2 h-5 w-5" />
              <p className="font-medium">Wallet Connected</p>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              Address: {connectedAddress}
            </p>
            {/* Mock balance */}
            <p className="text-sm text-muted-foreground">Balance: 12.345 AVAX (Mock)</p>
          </div>
        ) : (
          <p className="text-muted-foreground flex items-center">
            <Link2Off className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400" />
            No wallet connected.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {connectedAddress ? (
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect Wallet
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Connect Wallet (Mock)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletConnect;

// Add Loader2 to lucide-react imports if not already present
// import { Wallet, LogOut, CheckCircle, Link2Off, Loader2 } from 'lucide-react';
