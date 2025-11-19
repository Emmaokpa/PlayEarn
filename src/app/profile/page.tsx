'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUser } from '@/lib/data';
import {
  ChevronRight,
  CreditCard,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Paintbrush,
  Shield,
  User as UserIcon,
  Crown,
  Sparkles,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  { icon: UserIcon, text: 'Edit Profile' },
  { icon: Shield, text: 'Change Password' },
  { icon: Moon, text: 'Dark/light themes', hasSwitch: true },
  { icon: CreditCard, text: 'Payment history' },
  { icon: Paintbrush, text: 'Language' },
  { icon: Bell, text: 'Notifications' },
  { icon: FileText, text: 'Terms and conditions' },
  { icon: HelpCircle, text: 'Support' },
];

export default function ProfilePage() {
  const { isVip } = mockUser;

  return (
    <AppLayout title="Profile">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
              <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {isVip && (
              <div className="absolute -top-2 -right-2 transform rotate-12">
                <Badge className="bg-primary hover:bg-primary text-primary-foreground border-2 border-background">
                  <Crown className="mr-1 h-4 w-4" />
                  VIP
                </Badge>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold">{mockUser.name}</h2>
          <p className="text-muted-foreground">omar@gmail.com</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-yellow-400">
              <span>VIP Subscription</span>
              <span className="text-lg font-normal text-white">$4.99/month</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" /> 3x Earnings on all rewards
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-400" /> Remove all ads
              </li>
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-400" /> Claim exclusive gift cards
              </li>
            </ul>
             <Button className="w-full font-bold" size="lg">
              {isVip ? 'Manage Subscription' : 'Upgrade to VIP'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const content = (
              <>
                <item.icon className="mr-4 h-6 w-6 text-muted-foreground" />
                <span className="flex-grow text-left">{item.text}</span>
              </>
            );

            if (item.hasSwitch) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-start h-14 w-full px-4"
                >
                  {content}
                  <Switch defaultChecked />
                </div>
              );
            }
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-14"
              >
                {content}
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </Button>
            );
          })}
        </div>

        <Button variant="destructive" className="w-full">
          <LogOut className="mr-2" />
          Logout
        </Button>
      </div>
    </AppLayout>
  );
}
