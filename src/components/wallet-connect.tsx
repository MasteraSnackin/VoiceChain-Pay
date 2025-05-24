
// src/components/wallet-connect.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Wallet, LogOut, CheckCircle, Link2Off, Loader2 } from 'lucide-react';
import Web3 from 'web3';
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
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'wrong_network' | 'disconnected'>('disconnected');
  const [provider, setProvider] = useState<any | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const { toast } = useToast();

  const fujiChainId = '0xA29A'; // Hex for 43113

  // Define handleDisconnect first
  const handleDisconnect = useCallback(() => {
    onDisconnect();
    setNetworkStatus('disconnected');
    setProvider(null);
    setWeb3(null);
    // Note: Proper listener removal for ethereum.on('accountsChanged') and ethereum.on('chainChanged')
    // typically requires storing the handler function references and calling provider.removeListener.
    // For this prototype, nullifying the provider effectively stops old listeners from causing issues
    // if new ones are established on a new provider instance.
  }, [onDisconnect]);

  // Then define connectWallet, including handleDisconnect in its dependency array
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const web3Instance = new Web3(ethereum);
        setWeb3(web3Instance);
        setProvider(ethereum);

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        onConnect(account);

        const chainId = await ethereum.request({ method: 'eth_chainId' });
        if (chainId === fujiChainId) {
          setNetworkStatus('connected');
        } else {
          setNetworkStatus('wrong_network');
          toast({
            title: "Wrong Network",
            description: "Please switch to Avalanche Fuji Testnet.",
            variant: "destructive",
          });
        }

        // Event handlers defined inside connectWallet to close over the correct handleDisconnect
        const onAccountsChanged = (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            onConnect(newAccounts[0]);
          } else {
            handleDisconnect(); 
          }
        };

        const onChainChanged = (newChainId: string) => {
          if (newChainId === fujiChainId) {
            setNetworkStatus('connected');
            toast({
              title: "Network Switched",
              description: "Connected to Avalanche Fuji Testnet.",
              variant: "default",
            });
          } else {
            setNetworkStatus('wrong_network');
            toast({
              title: "Wrong Network",
              description: "Switched to incorrect network. Please switch to Avalanche Fuji Testnet.",
              variant: "destructive",
            });
          }
        };
        
        // Remove any old listeners before adding new ones, if provider supports it
        if (ethereum.removeListener) {
            ethereum.removeListener('accountsChanged', onAccountsChanged); // This might need the original ref if it was different
            ethereum.removeListener('chainChanged', onChainChanged); // Same here
        }
        ethereum.on('accountsChanged', onAccountsChanged);
        ethereum.on('chainChanged', onChainChanged);

      } else {
        toast({
          title: "No Wallet Detected",
          description: "Please install MetaMask or another Web3 wallet.",
          variant: "destructive",
        });
        setNetworkStatus('disconnected');
      }
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet.",
        variant: "destructive",
      });
      handleDisconnect(); 
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect, toast, fujiChainId, handleDisconnect]); // handleDisconnect is a dependency

  // Auto-connect on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
                if (accounts.length > 0) {
                    connectWallet(); 
                } else {
                    setNetworkStatus('disconnected');
                }
            })
            .catch((err: any) => {
                console.error("Error checking accounts:", err);
                setNetworkStatus('disconnected');
            });
    } else {
        setNetworkStatus('disconnected');
    }
  }, [connectWallet]); // connectWallet is stable due to useCallback


  const switchNetwork = async () => {
    if (provider) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: fujiChainId }],
        });
      } catch (error: any) {
        console.error("Failed to switch network:", error);
        toast({
          title: "Switch Network Failed",
          description: error.message || "Could not switch to Fuji Testnet.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Effect for toast notifications based on connection status
  useEffect(() => {
    if (connectedAddress && networkStatus === 'connected') {
      toast({
        title: "Wallet Connected to Fuji",
        description: `Address: ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}`,
        variant: "default",
      });
    } else if (connectedAddress && networkStatus === 'wrong_network') {
       toast({
          title: "Wallet Connected (Wrong Network)",
          description: `Address: ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}. Please switch to Fuji Testnet.`,
          variant: "destructive",
        });
    }
    // Removed the "Disconnected" toast from here to avoid firing on initial load.
    // It's now triggered explicitly on manual disconnect.
  }, [connectedAddress, networkStatus, toast]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          Wallet Connection
        </CardTitle>
        <CardDescription>
          {connectedAddress && networkStatus === 'connected'
            ? "Wallet connected to Avalanche Fuji Testnet."
            : connectedAddress && networkStatus === 'wrong_network'
            ? "Wallet connected but on the wrong network."
            : "Connect your wallet to proceed with transactions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {networkStatus === 'wrong_network' && connectedAddress && (
           <div className="mb-4 space-y-2 text-amber-600 dark:text-amber-400">
            <div className="flex items-center">
              <Link2Off className="mr-2 h-5 w-5" />
              <p className="font-medium">Incorrect Network</p>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              Your wallet is connected to a different network. Please switch to Avalanche Fuji Testnet (Chain ID 43113).
            </p>
          </div>
        )}
        {connectedAddress ? (
          <div className="space-y-2">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="mr-2 h-5 w-5" />
              <p className="font-medium">Wallet Connected</p>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              Address: {connectedAddress}
            </p>
            <p className="text-sm text-muted-foreground">Balance: N/A (Fetch not implemented)</p>
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
          <>
            {networkStatus === 'wrong_network' && (
              <Button onClick={switchNetwork} className="w-full mb-2">
                Switch to Fuji Testnet
              </Button>
            )}
             <Button onClick={() => {
                handleDisconnect(); // Call the memoized disconnect handler
                toast({ // Explicit toast on manual disconnect
                    title: "Wallet Disconnected",
                    variant: "default",
                });
             }} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </>
        ) : (
          <Button onClick={connectWallet} disabled={isConnecting} className="w-full">
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletConnect;
    