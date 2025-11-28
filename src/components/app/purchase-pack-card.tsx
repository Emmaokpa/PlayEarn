
'use client';

import type { InAppPurchase } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Gem, Star } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { doc, increment, writeBatch } from 'firebase/firestore';
import Image from 'next/image';

interface PurchasePackCardProps {
  pack: InAppPurchase;
}

// Placeholder for the function that will eventually call your backend
async function initiateTelegramPayment(payload: any) {
  console.log("Preparing to initiate payment with payload:", payload);
  // In a real implementation, this would be:
  // const response = await fetch('/api/create-invoice', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // });
  // const { invoiceUrl } = await response.json();
  // if (invoiceUrl) {
  //   Telegram.WebApp.openInvoice(invoiceUrl);
  // }
  alert("Payment flow not implemented. Check console for payload.");
}


export default function PurchasePackCard({ pack }: PurchasePackCardProps) {
  const { toast } = useToast();
  const { user } = useFirebase();

  const handleBuy = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to make a purchase.',
      });
      return;
    }

    if (pack.purchaseType === 'digital') {
      // PATH A: Digital Goods - Use Telegram Stars (XTR)
      const USD_TO_STARS_RATE = 113; // 1 USD = 113 Stars
      const priceInStars = Math.ceil(pack.price * USD_TO_STARS_RATE);
      
      const payload = {
        title: pack.name,
        description: pack.description,
        payload: `purchase-${user.uid}-${pack.id}-${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: `${pack.amount} ${pack.type}`, amount: priceInStars }],
        provider_token: "", // Empty for Stars
      };
      
      await initiateTelegramPayment(payload);

    } else if (pack.purchaseType === 'physical') {
      // PATH B: Physical Goods - Use Real Currency (USD)
      const PHYSICAL_GOODS_PROVIDER_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_PHYSICAL_PROVIDER_TOKEN || "";
      
      if (!PHYSICAL_GOODS_PROVIDER_TOKEN) {
        console.error("TELEGRAM_PHYSICAL_PROVIDER_TOKEN is not set in environment variables.");
        toast({ variant: 'destructive', title: 'Configuration Error', description: 'Physical goods payment provider is not configured.'});
        return;
      }

      const payload = {
        title: pack.name,
        description: pack.description,
        payload: `purchase-${user.uid}-${pack.id}-${Date.now()}`,
        currency: 'USD',
        prices: [{ label: pack.name, amount: Math.ceil(pack.price * 100) }], // Price in cents
        provider_token: PHYSICAL_GOODS_PROVIDER_TOKEN,
        need_shipping_address: true,
      };

      await initiateTelegramPayment(payload);

    } else {
        toast({ variant: 'destructive', title: 'Unknown Product Type', description: 'This item cannot be purchased.'});
    }
  };

  const getIcon = () => {
    switch (pack.type) {
        case 'coins':
            return <Coins className="h-10 w-10" />;
        case 'spins':
            return <Star className="h-10 w-10" />;
        default:
            return <Gem className="h-10 w-10" />;
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary">
       {pack.imageUrl ? (
         <CardHeader className="p-0">
           <div className="relative aspect-video">
             <Image
              src={pack.imageUrl}
              alt={pack.name}
              fill
              className="rounded-t-lg object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              referrerPolicy="no-referrer"
              unoptimized
            />
           </div>
         </CardHeader>
      ) : (
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Gem className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-2xl">{pack.name}</CardTitle>
                    <CardDescription className="mt-1">{pack.description}</CardDescription>
                </div>
            </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
         <div className="flex items-baseline gap-2 text-5xl font-bold text-primary">
            {getIcon()}
            <span>{pack.amount.toLocaleString()}</span>
         </div>
         <p className="text-muted-foreground">{pack.type}</p>
         {!pack.imageUrl && <CardDescription className="mt-2">{pack.description}</CardDescription>}
      </CardContent>
      <CardFooter className="flex-col items-stretch p-4">
        <Button onClick={handleBuy} size="lg" className="w-full text-lg font-bold">
            Buy for ${pack.price.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}
