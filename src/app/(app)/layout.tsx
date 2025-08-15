
'use client';

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, UtensilsCrossed, BookHeart, ShoppingCart, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            {/* Vous pouvez mettre un spinner ou un skeleton screen ici */}
            <p>Chargement...</p>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <div className="p-4 flex items-center gap-2">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
          >
              <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 2.3.9 4.4 2.5 5.9.3.3.5.7.5 1.1v2c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-2c0-.4.2-.8.5-1.1C19.1 14.4 20 12.3 20 10z" />
              <path d="M12 2v2" />
              <path d="M12 19v3" />
              <path d="M4 12H2" />
              <path d="M6.3 6.3l-1.4-1.4" />
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
              CuisineZen
          </h1>
        </div>
        <SidebarMenu className="flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Inventaire" isActive={isActive('/inventory')}>
              <Link href="/inventory">
                <Home />
                <span>Inventaire</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Menus" isActive={isActive('/menu')}>
              <Link href="/menu">
                <UtensilsCrossed />
                <span>Menus</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Recettes" isActive={isActive('/recipes')}>
              <Link href="/recipes">
                <BookHeart />
                <span>Recettes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Liste de courses" isActive={isActive('/shopping-list')}>
              <Link href="/shopping-list">
                <ShoppingCart />
                <span>Liste de courses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
         <SidebarMenu>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Mon Compte" isActive={isActive('/account')}>
              <Link href="/account">
                <User />
                <span>Mon Compte</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Déconnexion">
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-6">
           {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
