
// src/app/auth/voice/page.tsx
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateVoiceAuthHash } from '@/ai/flows/generate-voice-auth-hash';
import { Lock, Mic, StopCircle, Loader2, ShieldCheck, ShieldX, Zap, Search, UserCheck, FileJson, HelpCircle, Coins, MapPin, NetworkIcon, Fuel } from 'lucide-react';

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

type RecipientType = 'EOA' | 'SmartContract' | 'Unknown' | null;
type AuthStatus = 'idle' | 'recording' | 'processing' | 'authenticated' | 'failed';

const VoiceWaveformVisualizer = () => {
  const barHeights = [10, 20, 15, 30, 25, 18, 22, 12, 28, 16, 24, 19, 14, 26, 10, 20, 15, 30, 25, 18];
  return (
    <div className="flex items-end justify-center space-x-1 h-16 my-4">
      {barHeights.map((height, index) => (
        <div
          key={index}
          className="w-1.5 bg-primary/70 rounded-full"
          style={{ height: `${height}px`, animation: `pulseWave 1s ease-in-out ${index * 0.05}s infinite alternate` }}
        />
      ))}
      <style jsx global>{`
        @keyframes pulseWave {
          0% { transform: scaleY(0.5); opacity: 0.7; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const DetailItem: React.FC<{icon: React.ElementType, label: string, value: string | null | undefined}> = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-background/30 rounded-md my-1.5">
      <div className="flex items-center">
        <Icon className="h-4 w-4 mr-2 text-primary/80" />
        <span className="text-muted-foreground text-sm">{label}:</span>
      </div>
      <span className="font-semibold text-foreground text-sm text-right break-all">{value}</span>
    </div>
  );
};

const RecipientTypeItem: React.FC<{recipientTypeVal: RecipientType | null}> = ({ recipientTypeVal }) => {
  if (!recipientTypeVal || recipientTypeVal === 'Unknown') return null;
  let Icon = HelpCircle;
  if (recipientTypeVal === 'EOA') Icon = UserCheck;
  else if (recipientTypeVal === 'SmartContract') Icon = FileJson;
  
  return (
     <div className="flex justify-between items-center py-2 px-3 bg-background/30 rounded-md my-1.5">
      <div className="flex items-center">
        <Icon className="h-4 w-4 mr-2 text-primary/80" />
        <span className="text-muted-foreground text-sm">Recipient Type:</span>
      </div>
      <span className="font-semibold text-foreground text-sm">{recipientTypeVal}</span>
    </div>
  );
};


function VoiceAuthenticationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [recipientType, setRecipientType] = useState<RecipientType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [gas, setGas] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [destinationChain, setDestinationChain] = useState<string | null>(null);


  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Verify your identity to complete the transaction.');
  const [statusTitle, setStatusTitle] = useState('Authentication Required');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);

  useEffect(() => {
    setAmount(searchParams.get('amount'));
    setRecipient(searchParams.get('recipient'));
    setRecipientType(searchParams.get('recipientType') as RecipientType);
    setToken(searchParams.get('token'));
    setGas(searchParams.get('gas'));
    setProtocol(searchParams.get('protocol'));
    setDestinationChain(searchParams.get('destinationChain'));
  }, [searchParams]);

  const handleAuthenticationResult = (success: boolean, voiceHash?: string) => {
    if (success) {
      setAuthStatus('authenticated');
      setStatusTitle('Authenticated!');
      setStatusMessage(`Authenticated successfully! Voice Hash: ${voiceHash?.substring(0,10)}...`);
      toast({ title: 'Authentication Successful', description: 'Transaction authorized. Redirecting to details page...', variant: 'default' });

      const currentParams = new URLSearchParams(searchParams.toString());
      // Ensure all relevant params are passed, especially recipientType
      if (recipientType) currentParams.set('recipientType', recipientType);
      router.push(`/transaction/success?${currentParams.toString()}`);

    } else {
      setAuthStatus('failed');
      setStatusTitle('Authentication Failed');
      setStatusMessage('Authentication failed. Please try again.');
      toast({ title: 'Authentication Failed', description: 'The voice signature did not match or an error occurred.', variant: 'destructive' });
    }
    setIsRecording(false);
    setCurrentTranscript('');
  };

  const processVoiceSample = async (audioDataUri: string) => {
    setAuthStatus('processing');
    setStatusTitle('Verifying Identity');
    setStatusMessage('Comparing with stored biometric data...');
    try {
      const { voiceAuthHash } = await generateVoiceAuthHash({ voiceSampleDataUri: audioDataUri });
      console.log('Generated Voice Auth Hash:', voiceAuthHash);
      // Simulate authentication success/failure
      const mockAuthSuccess = Math.random() > 0.3; // 70% chance of success for demo
      handleAuthenticationResult(mockAuthSuccess, voiceAuthHash);
    } catch (error) {
      console.error('Error generating voice auth hash:', error);
      handleAuthenticationResult(false);
    }
  };

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechApiSupported(false);
      setStatusTitle('Unsupported Browser');
      setStatusMessage('Voice input not supported by your browser.');
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support the Web Speech API for voice authentication.",
        variant: "destructive",
      });
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current!;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setCurrentTranscript(transcript);
      const pseudoAudioData = btoa(transcript);
      const pseudoAudioDataUri = `data:text/plain;base64,${pseudoAudioData}`;
      processVoiceSample(pseudoAudioDataUri);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (authStatus === 'recording' && !currentTranscript) {
        setAuthStatus('idle');
        setStatusTitle('Authentication Required');
        setStatusMessage('Recording stopped. Click Start Authentication to try again.');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error for auth", event.error, event.message);
      setIsRecording(false);
      setAuthStatus('failed');
      setStatusTitle('Microphone Error');
      setStatusMessage(`Mic error: ${event.error}. Try again.`);
      toast({ title: "Microphone Error", description: event.message || event.error, variant: "destructive" });
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
  }, [authStatus, currentTranscript]); 

  const handleStartAuthentication = () => {
    if (!speechApiSupported || !recognitionRef.current) {
      toast({ title: "Cannot Record", description: "Speech recognition not supported or not initialized.", variant: "destructive" });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setCurrentTranscript('');
      setAuthStatus('recording');
      setStatusTitle('Recording...');
      setStatusMessage('Say the passphrase: "My voice is my password."');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting speech recognition for auth", e);
        setAuthStatus('failed');
        setStatusTitle('Mic Start Failed');
        setStatusMessage('Failed to start mic. Check permissions.');
        toast({ title: "Mic Start Failed", description: "Could not start microphone.", variant: "destructive"});
      }
    }
  };


  const getAuthIcon = () => {
    switch (authStatus) {
      case 'recording':
        return <Mic className="h-20 w-20 text-primary animate-pulse" />;
      case 'processing':
        return <Search className="h-20 w-20 text-primary" />;
      case 'authenticated':
        return <ShieldCheck className="h-20 w-20 text-green-500" />;
      case 'failed':
        return <ShieldX className="h-20 w-20 text-destructive" />;
      default: // idle
        return <Lock className="h-20 w-20 text-accent" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-foreground">
      <Card className="w-full max-w-md bg-card/70 backdrop-blur-md border-border shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-card-foreground">Voice Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="relative w-48 h-48 rounded-full bg-background/30 flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-pulse"></div>
            <div className="relative z-10 p-6 rounded-full bg-background/50">
              {getAuthIcon()}
            </div>
          </div>

          {authStatus === 'processing' && <VoiceWaveformVisualizer />}

          <div className="text-center">
            <p className="text-xl font-semibold text-card-foreground">
              {statusTitle}
            </p>
            <p className="text-sm text-muted-foreground mt-1 min-h-[2.2em]">{statusMessage}</p>
            {currentTranscript && (isRecording || authStatus === 'processing') && (
                 <p className="text-xs text-muted-foreground/80 mt-1 italic">"{currentTranscript}"</p>
            )}
          </div>

          {authStatus !== 'authenticated' && authStatus !== 'processing' && (
            <Button
              onClick={handleStartAuthentication}
              disabled={!speechApiSupported || (authStatus === 'processing' && !isRecording)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-primary-foreground font-semibold py-3 text-lg rounded-lg shadow-lg transform transition-transform hover:scale-105 active:scale-95"
            >
              {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isRecording ? 'Stop Recording' : 'Start Authentication'}
            </Button>
          )}

          {(authStatus === 'authenticated' || authStatus === 'failed') && authStatus !== 'processing' && (
             <Button
              onClick={() => router.push('/')}
              variant="secondary"
              className="w-full font-semibold py-3 text-lg rounded-lg shadow-lg"
            >
              Return to Dashboard
            </Button>
          )}

          <div className="w-full p-4 bg-muted/30 rounded-lg text-sm space-y-1 border border-border shadow-inner">
            <h4 className="font-semibold text-card-foreground/90 mb-2 text-md">Transaction to Authorize:</h4>
            <DetailItem icon={Coins} label="Amount" value={amount && token ? `${amount} ${token}` : undefined} />
            <DetailItem icon={UserCheck} label="To" value={recipient} />
            <RecipientTypeItem recipientTypeVal={recipientType} />
            <DetailItem icon={MapPin} label="Destination" value={destinationChain && protocol && protocol !== 'SameChain' ? destinationChain : undefined} />
            <DetailItem icon={NetworkIcon} label="Protocol" value={protocol && protocol !== 'SameChain' ? protocol : undefined} />
            <DetailItem icon={Fuel} label="Est. Gas" value={gas && token ? `${gas} ${token}` : (gas ? `${gas} AVAX` : undefined)} />
            {!amount && !recipient && <p className="text-muted-foreground text-center py-2">No transaction details found.</p>}
          </div>
        </CardContent>
        <CardFooter className="text-center flex-col space-y-2 pt-6 pb-4 text-xs text-muted-foreground">
          <p className="flex items-center justify-center">
            <Lock className="h-3 w-3 mr-1.5 text-accent"/> Voice biometrics stored securely on-chain.
          </p>
          <p className="flex items-center justify-center">
            <Zap className="h-3 w-3 mr-1.5 text-primary"/> Powered by Avalanche Subnet Technology
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VoiceAuthenticationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-foreground"><Loader2 className="h-12 w-12 animate-spin text-primary" />Loading...</div>}>
      <VoiceAuthenticationContent />
    </Suspense>
  );
}
