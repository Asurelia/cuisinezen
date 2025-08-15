
'use client'

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateUserForm } from "@/components/create-user-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default function AccountPage() {
    const { user, isAdmin } = useAuth()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Mon Compte</h1>
                <p className="text-muted-foreground">
                    Gérez les informations de votre compte et les accès utilisateurs.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Email :</strong> {user?.email}</p>
                    <p><strong>Rôle :</strong> {isAdmin ? 'Administrateur' : 'Utilisateur'}</p>
                </CardContent>
            </Card>

            {isAdmin && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Gestion des utilisateurs</CardTitle>
                        <CardDescription>
                            Créez de nouveaux comptes pour les membres de votre famille ou vos amis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6">
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>Comment ça marche ?</AlertTitle>
                            <AlertDescription>
                                La création d'utilisateur est une action sensible. Pour des raisons de sécurité, cette fonctionnalité n'est pas implémentée directement depuis le client. Vous devez utiliser une **Firebase Function (Cloud Function)** pour créer des utilisateurs de manière sécurisée.
                                <br /><br />
                                Ce formulaire est une maquette pour vous montrer comment l'interface pourrait fonctionner.
                            </AlertDescription>
                        </Alert>
                       <CreateUserForm />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
