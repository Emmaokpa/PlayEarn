
'use client';

import AppLayout from '@/components/layout/app-layout';
import { Laptop } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PhysicalGoodsPage() {
  return (
    <AppLayout title="Physical Goods">
       <div className="space-y-12">
        <div className="text-center">
            <Laptop className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="font-headline text-3xl font-bold">Physical Goods</h2>
            <p className="mt-2 text-muted-foreground">
              Use your earnings to get real-world items.
            </p>
        </div>

        <Card className="flex flex-col items-center justify-center py-24 text-center bg-secondary/50 border-dashed">
            <CardHeader>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                    <Laptop className="h-10 w-10 text-secondary-foreground" />
                </div>
                <CardTitle className="mt-4 text-2xl">Coming Soon!</CardTitle>
                <CardDescription>
                    A marketplace for gadgets, watches, and more will be available here.<br/> Stay tuned for exciting products you can redeem with your coins.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    </AppLayout>
  );
}
