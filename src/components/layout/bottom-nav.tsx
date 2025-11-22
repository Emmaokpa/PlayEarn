'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Gamepad2,
  Gift,
  LayoutGrid,
  User,
  Menu as MenuIcon,
  Trophy,
  ShoppingCart,
  BarChart,
  Home,
  Shield,
  Handshake,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';


const bottomNavItems = [
  { href: '/dashboard', label: 'Explore', icon: Home },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/predictor', label: 'Predict', icon: BarChart },
  { href: '/store', label: 'Store', icon: ShoppingCart },
];

const sidebarNavItems = [
    { href: '/dashboard', label: 'Explore', icon: LayoutGrid },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Award },
    { href: '/earn', label: 'Earn', icon: Trophy },
    { href: '/earn/affiliate', label: 'Affiliate', icon: Handshake },
    { href: '/redeem', label: 'Redeem', icon: Gift },
    { href: '/store', label: 'Store', icon: ShoppingCart },
    { href: '/predictor', label: 'Predictor', icon: BarChart },
    { href: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
    { href: '/admin', label: 'Admin', icon: Shield },
]

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isSidebar = false,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isSidebar?: boolean;
  onClick?: () => void;
}) {
  const isAuthPage = href === '/login' || href === '/signup';
  if (isAuthPage) return null;


  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary',
        isSidebar ? 'text-base' : 'flex-col justify-center text-sm h-full gap-1 p-2'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className={cn(isSidebar ? 'flex-1' : 'text-xs truncate')}>
        {label}
      </span>
    </Link>
  );
}

function SidebarNav({
  closeSidebar,
  isAdmin,
}: {
  closeSidebar: () => void;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const items = isAdmin ? [...sidebarNavItems, ...adminNavItems] : sidebarNavItems;
  return (
    <nav className="grid items-start gap-2 text-sm font-medium">
      {items.map((item) => {
         const isActive =
         item.href === '/dashboard' || item.href === '/earn' || item.href === '/leaderboard'
           ? pathname === item.href
           : pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/earn' && item.href !== '/leaderboard';
        return (
          <NavLink
            key={item.href}
            {...item}
            isActive={isActive}
            isSidebar
            onClick={closeSidebar}
          />
        );
      })}
    </nav>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, firestore } = useFirebase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const isAdmin = userProfile?.isAdmin ?? false;

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <nav className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/90 backdrop-blur-sm">
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch gap-2 px-4">
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <MenuIcon className="h-5 w-5" />
                <span className="text-xs truncate">Menu</span>
              </button>
            </SheetTrigger>
            {bottomNavItems.map((item) => {
              const isActive =
                ['/dashboard', '/leaderboard', '/store', '/predictor'].includes(item.href)
                  ? pathname === item.href
                  : pathname.startsWith(item.href) && !['/dashboard', '/leaderboard', '/store', '/predictor'].includes(item.href);
              return (
                 <NavLink
                    key={item.href}
                    {...item}
                    isActive={isActive}
                  />
              );
            })}
          </div>
        </nav>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SidebarNav isAdmin={isAdmin} closeSidebar={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
