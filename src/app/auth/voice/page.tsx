// src/app/auth/voice/page.tsx
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateVoiceAuthHash } from '@/ai/flows/generate-voice-auth-hash';
import { Lock, Mic, StopCircle, Loader2, ShieldCheck, ShieldX, Zap } from 'lucide-react';

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

type AuthStatus = 'idle' | 'recording' | 'processing' | 'authenticated' | 'failed';

function VoiceAuthenticationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [gas, setGas] = useState<string | null>(null);

  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Verify your identity to complete the transaction.');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechApiSupported, setSpeechApiSupported] = useState<boolean>(true);

  useEffect(() => {
    setAmount(searchParams.get('amount'));
    setRecipient(searchParams.get('recipient'));
    setToken(searchParams.get('token'));
    setGas(searchParams.get('gas'));
  }, [searchParams]);

  const handleAuthenticationResult = (success: boolean, voiceHash?: string) => {
    if (success) {
      setAuthStatus('authenticated');
      setStatusMessage(`Authenticated successfully! Voice Hash: ${voiceHash?.substring(0,10)}...`);
      toast({ title: 'Authentication Successful', description: 'Transaction can now proceed (simulated).', variant: 'default' });
      // Simulate redirecting to a success page or back to main page with success status
      setTimeout(() => router.push('/?auth=success'), 2000);
    } else {
      setAuthStatus('failed');
      setStatusMessage('Authentication failed. Please try again.');
      toast({ title: 'Authentication Failed', description: 'The voice signature did not match or an error occurred.', variant: 'destructive' });
    }
    setIsRecording(false);
    setCurrentTranscript('');
  };
  
  const processVoiceSample = async (audioDataUri: string) => {
    setAuthStatus('processing');
    setStatusMessage('Verifying voice signature...');
    try {
      const { voiceAuthHash } = await generateVoiceAuthHash({ voiceSampleDataUri: audioDataUri });
      // In a real app, you'd compare this hash with a stored hash.
      // For this demo, we'll simulate success/failure.
      console.log('Generated Voice Auth Hash:', voiceAuthHash);
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
    recognition.interimResults = false; // We only want the final result for auth
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setCurrentTranscript(transcript); // Store transcript for potential use
      
      // For voice auth, we need the audio data, not just transcript.
      // This part is tricky as Web Speech API doesn't directly give raw audio for hashing.
      // A common approach is to record audio separately using MediaRecorder API
      // then convert to base64. For simplicity in this Genkit context,
      // we'll use the transcript itself as a proxy for the "voice sample data"
      // that the generateVoiceAuthHash flow expects as a base64 string.
      // THIS IS A SIMPLIFICATION FOR THE DEMO.
      // In a real scenario, you'd capture actual audio, convert to base64, and send that.
      const pseudoAudioData = btoa(transcript); // Base64 encode the transcript
      const pseudoAudioDataUri = `data:text/plain;base64,${pseudoAudioData}`;
      
      processVoiceSample(pseudoAudioDataUri);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (authStatus === 'recording') { // If it ended without a result
        setAuthStatus('idle');
        setStatusMessage('Recording stopped. Click Start Authentication to try again.');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error for auth", event.error, event.message);
      setIsRecording(false);
      setAuthStatus('failed');
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
  }, []); // Run once on mount

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
      setStatusMessage('Say the passphrase: "My voice is my password."'); // Example passphrase
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting speech recognition for auth", e);
        setAuthStatus('failed');
        setStatusMessage('Failed to start mic. Check permissions.');
        toast({ title: "Mic Start Failed", description: "Could not start microphone.", variant: "destructive"});
      }
    }
  };


  const getAuthIcon = () => {
    switch (authStatus) {
      case 'recording':
        return <Mic className="h-20 w-20 text-blue-400 animate-pulse" />;
      case 'processing':
        return <Loader2 className="h-20 w-20 text-blue-400 animate-spin" />;
      case 'authenticated':
        return <ShieldCheck className="h-20 w-20 text-green-400" />;
      case 'failed':
        return <ShieldX className="h-20 w-20 text-red-400" />;
      default: // idle
        return <Lock className="h-20 w-20 text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-800 flex flex-col items-center justify-center p-4 text-white">
      <Card className="w-full max-w-md bg-purple-900/50 backdrop-blur-md border-purple-700 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Voice Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="relative w-48 h-48 rounded-full bg-purple-800/70 flex items-center justify-center shadow-inner">
            <div className="absolute inset-0 rounded-full border-4 border-purple-600/50 animate-pulse"></div>
            <div className="relative z-10 p-6 rounded-full bg-purple-900/60"> {/* Adjusted padding */}
              {getAuthIcon()} {/* Icon size adjusted in getAuthIcon */}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xl font-semibold">
              {authStatus === 'idle' && "Authentication Required"}
              {authStatus === 'recording' && "Recording..."}
              {authStatus === 'processing' && "Processing..."}
              {authStatus === 'authenticated' && "Authenticated!"}
              {authStatus === 'failed' && "Authentication Failed"}
            </p>
            <p className="text-sm text-purple-300 mt-1 min-h-[2.2em]">{statusMessage}</p>
            {currentTranscript && (isRecording || authStatus === 'processing') && (
                 <p className="text-xs text-purple-400 mt-1 italic">"{currentTranscript}"</p>
            )}
          </div>

          {authStatus !== 'authenticated' && authStatus !== 'processing' && (
            <Button 
              onClick={handleStartAuthentication} 
              disabled={!speechApiSupported || isRecording || authStatus === 'processing'}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 text-lg rounded-lg shadow-lg transform transition-transform hover:scale-105 active:scale-95"
            >
              {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isRecording ? 'Stop Recording' : 'Start Authentication'}
            </Button>
          )}

          {(authStatus === 'authenticated' || authStatus === 'failed') && authStatus !== 'processing' && (
             <Button 
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 text-lg rounded-lg shadow-lg"
            >
              Return to Dashboard
            </Button>
          )}


          <div className="w-full p-4 bg-purple-800/60 rounded-lg text-sm space-y-2 border border-purple-700">
            <h4 className="font-semibold text-purple-200">Transaction to Authorize:</h4>
            {amount && token && <p>Amount: <span className="font-bold text-white">{amount} {token}</span></p>}
            {recipient && <p>To: <span className="font-bold text-white">{recipient}</span></p>}
            {gas && <p>Est. Gas: <span className="font-bold text-white">{gas} {token || 'AVAX'}</span></p>}
            {!amount && !recipient && <p className="text-purple-400">No transaction details found.</p>}
          </div>
        </CardContent>
        <CardFooter className="text-center flex-col space-y-2 pt-6 pb-4 text-xs text-purple-400">
          <p className="flex items-center justify-center">
            <Lock className="h-3 w-3 mr-1.5"/> Voice biometrics stored securely on-chain.
          </p>
          <p className="flex items-center justify-center">
            <Zap className="h-3 w-3 mr-1.5"/> Powered by Avalanche Subnet Technology
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VoiceAuthenticationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-indigo-700 flex items-center justify-center text-white"><Loader2 className="h-12 w-12 animate-spin" />Loading...</div>}>
      <VoiceAuthenticationContent />
    </Suspense>
  );
}
