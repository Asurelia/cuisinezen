
import { redirect } from 'next/navigation';

// La page d'accueil redirige maintenant vers la page de connexion par défaut.
// Le middleware se chargera de rediriger les utilisateurs déjà connectés vers l'inventaire.
export default function Home() {
  redirect('/login');
}
