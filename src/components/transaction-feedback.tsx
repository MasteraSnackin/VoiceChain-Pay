// src/components/transaction-feedback.tsx
import type { FC } from 'react';
import { AlertCircle, CheckCircle2, InfoIcon, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';

interface TransactionFeedbackProps {
  status: TransactionStatus;
  message?: string | null;
  title?: string;
}

const TransactionFeedback: FC<TransactionFeedbackProps> = ({ status, message, title }) => {
  if (status === 'idle' && !message) { // Only show card if there's a message or non-idle status
    return null; 
  }
  
  let alertVariant: "default" | "destructive" = "default";
  let IconComponent = InfoIcon;
  let statusTitle = title || "Transaction Status";

  switch (status) {
    case 'processing':
      IconComponent = Loader2;
      statusTitle = title || "Processing...";
      break;
    case 'success':
      alertVariant = "default"; // Potentially a success variant if ShadCN adds one
      IconComponent = CheckCircle2;
      statusTitle = title || "Success!";
      break;
    case 'error':
      alertVariant = "destructive";
      IconComponent = XCircle;
      statusTitle = title || "Error";
      break;
    case 'idle': // Show info if idle but with a message
       IconComponent = InfoIcon;
       statusTitle = title || "Information";
       break;
  }

  const iconColorClass = status === 'success' ? 'text-green-500' : 
                         status === 'error' ? 'text-destructive-foreground' : // Handled by alert variant
                         status === 'processing' ? 'text-primary' : 
                         'text-foreground';


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <IconComponent className={`h-6 w-6 ${iconColorClass} ${status === 'processing' ? 'animate-spin' : ''}`} />
          {statusTitle}
        </CardTitle>
      </CardHeader>
      {message && (
        <CardContent>
          <Alert variant={alertVariant} className={status === 'success' ? 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400' : ''}>
            <AlertDescription className={status === 'success' ? 'text-green-700 dark:text-green-400' : alertVariant === 'destructive' ? 'text-destructive-foreground' : 'text-foreground'}>
              {message}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
};

export default TransactionFeedback;
