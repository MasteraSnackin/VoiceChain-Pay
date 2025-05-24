
// src/components/wallet-connect.tsx
'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Wallet, LogOut, CheckCircle, Link2Off, Loader2, ServerIcon } from 'lucide-react';
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
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const { toast } = useToast();

  const fujiChainId = '0xA29A'; // Hex for 43113 (Avalanche Fuji Testnet)
  const fujiChainIdDecimal = '43113';


  // Define handleDisconnect first
  const handleDisconnect = useCallback(() => {
    onDisconnect();
    setNetworkStatus('disconnected');
    setProvider(null);
    setWeb3(null);
    setWalletBalance(null);
    // Clean up listeners if provider supports it (MetaMask does)
    if (provider && provider.removeListener) {
        // Using placeholder functions for removal as original references might be tricky
        // In a more complex app, store handler references to remove them precisely.
        provider.removeListener('accountsChanged', () => {});
        provider.removeListener('chainChanged', () => {});
    }
  }, [onDisconnect, provider]);

  // Then define connectWallet, including handleDisconnect in its dependency array
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setWalletBalance(null); // Reset balance on new connection attempt
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const web3Instance = new Web3(ethereum);
        setWeb3(web3Instance);
        setProvider(ethereum);

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please ensure your wallet is unlocked and accessible.");
        }
        const account = accounts[0];
        onConnect(account);

        const fetchBalance = async (currentAccount: string) => {
          try {
            const balanceInWei = await web3Instance.eth.getBalance(currentAccount);
            const balanceInAvax = web3Instance.utils.fromWei(balanceInWei, 'ether');
            setWalletBalance(parseFloat(balanceInAvax).toFixed(4)); // Format to 4 decimal places
          } catch (balanceError) {
            console.error("Failed to fetch balance:", balanceError);
            setWalletBalance("Error");
            toast({
              title: "Balance Error",
              description: "Could not fetch wallet balance.",
              variant: "destructive",
            });
          }
        };
        
        await fetchBalance(account);

        const chainId = await ethereum.request({ method: 'eth_chainId' });
        if (chainId === fujiChainId || chainId === fujiChainIdDecimal) {
          setNetworkStatus('connected');
        } else {
          setNetworkStatus('wrong_network');
          toast({
            title: "Wrong Network",
            description: "Please switch to Avalanche Fuji Testnet.",
            variant: "destructive",
          });
        }

        // Event handlers defined inside connectWallet to close over the correct dependencies
        const onAccountsChanged = async (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            onConnect(newAccounts[0]);
            await fetchBalance(newAccounts[0]); // Fetch balance for new account
          } else {
            handleDisconnect();
          }
        };

        const onChainChanged = (newChainId: string) => {
          if (newChainId === fujiChainId || newChainId === fujiChainIdDecimal) {
            setNetworkStatus('connected');
             toast({
              title: "Network Switched",
              description: "Connected to Avalanche Fuji Testnet.",
              variant: "default",
            });
            if(connectedAddress) fetchBalance(connectedAddress); // Re-fetch balance if already connected
          } else {
            setNetworkStatus('wrong_network');
            setWalletBalance(null); // Clear balance if network is wrong
            toast({
              title: "Wrong Network",
              description: "Switched to incorrect network. Please switch to Avalanche Fuji Testnet.",
              variant: "destructive",
            });
          }
        };
        
        // Remove any old listeners before adding new ones
        if (ethereum.removeListener) {
            ethereum.removeListener('accountsChanged', onAccountsChanged); 
            ethereum.removeListener('chainChanged', onChainChanged); 
        }
        ethereum.on('accountsChanged', onAccountsChanged);
        ethereum.on('chainChanged', onChainChanged);

      } else {
        toast({
          title: "No Wallet Detected",
          description: "Please install a Web3 wallet like MetaMask or Core.",
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
  }, [onConnect, toast, fujiChainId, fujiChainIdDecimal, handleDisconnect, connectedAddress]); 

  // Auto-connect on mount if already permitted
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.request({ method: 'eth_accounts' })
            .then((accounts: string[]) => {
                if (accounts.length > 0) {
                    // If accounts are found, it means the site was previously connected.
                    // We can proceed to call connectWallet which handles fetching account, balance and setting listeners.
                    connectWallet(); 
                } else {
                    // No accounts found, user needs to manually connect.
                    setNetworkStatus('disconnected');
                }
            })
            .catch((err: any) => {
                console.error("Error checking for existing accounts:", err);
                setNetworkStatus('disconnected'); // Default to disconnected on error
            });
    } else {
        // No ethereum provider found.
        setNetworkStatus('disconnected');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // connectWallet is memoized, so it's safe to add as dependency, but for auto-connect this should run once.


  const switchNetwork = async () => {
    if (provider) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: fujiChainId }],
        });
        // After successful switch, onChainChanged listener should update status and balance.
      } catch (error: any) {
        // Handle specific error codes for user-rejected request or chain not added
        if (error.code === 4902) { // Chain not added
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: fujiChainId,
                  chainName: 'Avalanche Fuji Testnet',
                  nativeCurrency: {
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    decimals: 18,
                  },
                  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add Fuji Testnet:', addError);
            toast({
              title: 'Add Network Failed',
              description: 'Could not add Fuji Testnet to your wallet.',
              variant: 'destructive',
            });
          }
        } else {
          console.error("Failed to switch network:", error);
          toast({
            title: "Switch Network Failed",
            description: error.message || "Could not switch to Fuji Testnet.",
            variant: "destructive",
          });
        }
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
  }, [connectedAddress, networkStatus, toast]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
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
              Your wallet is connected to a different network. Please switch to Avalanche Fuji Testnet (Chain ID {fujiChainIdDecimal}).
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
            <p className="text-sm text-muted-foreground flex items-center">
              <ServerIcon className="mr-2 h-4 w-4 text-primary/80" />
              Balance: {walletBalance !== null ? `${walletBalance} AVAX` : (networkStatus === 'connected' ? 'Fetching...' : 'N/A')}
            </p>
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
          <div className="w-full space-y-2">
            {networkStatus === 'wrong_network' && (
              <Button onClick={switchNetwork} className="w-full">
                 <ServerIcon className="mr-2 h-4 w-4" />
                Switch to Fuji Testnet
              </Button>
            )}
             <Button onClick={() => {
                handleDisconnect();
                toast({ 
                    title: "Wallet Disconnected",
                    variant: "default",
                });
             }} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
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
    
