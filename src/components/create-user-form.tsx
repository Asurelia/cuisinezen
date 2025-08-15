
'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase"

const formSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer un email valide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
})

export function CreateUserForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    
    try {
      const functions = getFunctions(app!, 'europe-west1'); // Assurez-vous que la région correspond à celle de votre fonction
      const createUser = httpsCallable(functions, 'createUser');
      const result: any = await createUser(values);

      if (result.data.success) {
          toast({
            title: "Utilisateur créé !",
            description: result.data.message || `Le compte pour ${values.email} a été créé.`,
          })
          form.reset();
      } else {
         throw new Error(result.data.message || "Une erreur inconnue est survenue.");
      }

    } catch (error: any) {
      console.error("Erreur lors de l'appel de la fonction:", error);
      toast({
        variant: 'destructive',
        title: "Erreur lors de la création",
        // L'erreur de la fonction callable a un format spécifique
        description: error.message || "Une erreur est survenue.",
      })
    } finally {
        setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email du nouvel utilisateur</Label>
        <Input
          id="email"
          type="email"
          placeholder="nouveau.membre@famille.com"
          {...form.register("email")}
          disabled={loading}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Mot de passe temporaire</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          disabled={loading}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer le compte
      </Button>
    </form>
  )
}
