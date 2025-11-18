import AppLayout from '@/components/layout/app-layout';
import { rewards } from '@/lib/data';
import RewardCard from '@/components/app/reward-card';

export default function RedeemPage() {
  return (
    <AppLayout title="Redeem Rewards">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-headline">Your Rewards Store</h2>
        <p className="text-muted-foreground mt-2">
          Use your points to claim awesome rewards.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </div>
    </AppLayout>
  );
}
