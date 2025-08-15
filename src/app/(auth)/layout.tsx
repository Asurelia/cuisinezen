
'use client';

import { useAuthSession } from "@/hooks/use-auth-session";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthSession();
  
  return <>{children}</>;
}
