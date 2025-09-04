'use client';

import {usePathname, useRouter} from 'next/navigation';
import {LayoutDashboard, Search, Settings} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Logo} from '@/components/icons';
import {useAuthState} from 'react-firebase-hooks/auth';
import {auth} from '@/lib/firebase';
import {useEffect} from 'react';
import {Loader2} from 'lucide-react';
import {signOut} from 'firebase/auth';

const menuItems = [
  {href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard},
  {href: '/finder', label: 'Find Care', icon: Search},
];

export default function AppLayout({children}: {children: React.ReactNode}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const pageTitle =
    menuItems.find((item) => pathname.startsWith(item.href))?.label ||
    'Dashboard';

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <Logo className="size-8 text-primary" />
            <h1 className="text-2xl font-bold">HealthChain</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  className="w-full justify-start text-base h-11 px-4"
                  tooltip={item.label}
                >
                  <a href={item.href}>
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>
                {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{user.displayName || user.email}</span>
              <span className="text-sm text-muted-foreground">Patient</span>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={handleSignOut}>
              <Settings className="size-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card p-4 lg:px-6">
          <SidebarTrigger />
          <h2 className="text-xl font-semibold">{pageTitle}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
