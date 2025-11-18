import AppLayout from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star, Trophy } from 'lucide-react';
import { games, mockUser } from '@/lib/data';
import GameCard from '@/components/app/game-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        <Card className="bg-primary/10 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Welcome back, {mockUser.name}!</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Reward Points</p>
              <p className="text-4xl font-bold">
                {mockUser.points.toLocaleString()}
              </p>
            </div>
            <Star className="h-16 w-16 text-yellow-400/50" />
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Featured Games</h2>
            <Link href="/games">
              <Button variant="link" className="text-primary">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {games.slice(0, 4).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-accent" />
              <span>Quick Earn</span>
            </CardTitle>
            <CardDescription>
              Watch a short ad to earn quick points.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">Get 10 points for every video.</p>
            <Link href="/earn">
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Watch Ad
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
