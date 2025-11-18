import { games } from '@/lib/data';
import { notFound } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GamePage({ params }: { params: { id: string } }) {
  const game = games.find((g) => g.id === params.id);

  if (!game) {
    notFound();
  }

  return (
    <AppLayout title={game.name}>
      <div className="space-y-4">
        <Card className="w-full aspect-[16/9] overflow-hidden bg-black">
          <iframe
            src={game.iframeUrl}
            title={game.name}
            className="w-full h-full border-0"
            allow="fullscreen; gamepad; autoplay;"
            sandbox="allow-scripts allow-same-origin"
          />
        </Card>
        <div className="flex justify-between items-center">
            <p className="text-muted-foreground text-sm">Now playing: {game.name}</p>
            <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Progress
            </Button>
        </div>
      </div>
    </AppLayout>
  );
}
