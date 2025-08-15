
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Terminal } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInUser, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFirebaseConfigured) {
        toast({
            variant: 'destructive',
            title: 'Configuration requise',
            description: 'La configuration de Firebase est manquante.',
        });
        return;
    }
    setLoading(true);
    try {
      await signInUser(email, password);
      // The auth provider and middleware will handle redirection
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: error.message || 'Email ou mot de passe incorrect.',
      })
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez votre email et mot de passe pour vous connecter.
          </CardDescription>
        </CardHeader>
        {!isFirebaseConfigured && (
            <div className="px-6 pb-4">
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Configuration Firebase manquante !</AlertTitle>
                    <AlertDescription>
                        Remplissez vos informations dans <code className="font-mono text-xs">src/lib/firebase.ts</code> pour activer la connexion.
                    </AlertDescription>
                </Alert>
            </div>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@exemple.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={!isFirebaseConfigured}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={!isFirebaseConfigured}/>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading || !isFirebaseConfigured}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
