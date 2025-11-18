'use client';

import { cn } from '@/lib/utils';
import { Gamepad2, Gift, LayoutGrid, Trophy, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Explore', icon: LayoutGrid },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/earn', label: 'Rewards', icon: Trophy },
  { href: '/redeem', label: 'Redeem', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 mt-auto border-t border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center gap-2 px-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-6 w-6', isActive ? 'text-primary' : '')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
