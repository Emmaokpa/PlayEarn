
import AppLayout from '@/components/layout/app-layout';

export default function StorePage() {
  return (
    <AppLayout title="Sticker Store">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Sticker Store</h2>
        <p className="text-muted-foreground">Coming Soon! Browse and buy exclusive digital stickers.</p>
      </div>
    </AppLayout>
  );
}
