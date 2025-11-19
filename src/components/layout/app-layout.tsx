import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUser } from '@/lib/data';
import { Coins } from 'lucide-react';
import BottomNav from './bottom-nav';

export default function AppLayout({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-bold font-headline">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-bold">{mockUser.points.toLocaleString()}</span>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
            <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      <BottomNav />
    </div>
  );
}
