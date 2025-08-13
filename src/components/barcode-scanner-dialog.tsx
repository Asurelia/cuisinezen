
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BarcodeScanner } from 'react-zxing';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { VideoOff } from 'lucide-react';

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onScan: (result: string) => void;
}

export function BarcodeScannerDialog({ isOpen, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleScan = (result: any) => {
    if (result) {
      onScan(result.getText());
    }
  };

  const handleError = (error: Error) => {
    console.error(error);
    if (error.name === 'NotAllowedError') {
        setHasPermission(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Erreur du scanner',
            description: error.message || 'Une erreur inconnue est survenue.',
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scanner un code-barres</DialogTitle>
          <DialogDescription>
            Placez le code-barres du produit devant la caméra.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-lg overflow-hidden aspect-video">
            {hasPermission === false ? (
                 <div className="h-full w-full bg-muted flex flex-col items-center justify-center text-center">
                    <Alert variant="destructive">
                        <VideoOff className="h-4 w-4" />
                        <AlertTitle>Accès à la caméra refusé</AlertTitle>
                        <AlertDescription>
                            Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <BarcodeScanner
                    onResult={handleScan}
                    onError={handleError}
                    onCameraStream={(stream) => setHasPermission(!!stream)}
                />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
