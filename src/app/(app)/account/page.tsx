
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
                            <AlertTitle>Action Requise</AlertTitle>
                            <AlertDescription>
                                Pour que la création d'utilisateur fonctionne, vous devez déployer une **Firebase Function** sécurisée. 
                                Ce formulaire est prêt à appeler votre fonction une fois qu'elle sera en ligne. 
                                Consultez la documentation de Firebase pour créer une fonction "callable" qui utilise le SDK Admin pour créer des utilisateurs.
                            </AlertDescription>
                        </Alert>
                       <CreateUserForm />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
