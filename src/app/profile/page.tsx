
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
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Switch } from '@/components/ui/switch';

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
  return (
    <AppLayout title="Profile">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} />
            <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{mockUser.name}</h2>
          <p className="text-muted-foreground">omar@gmail.com</p>
        </div>

        <Card className="bg-green-800/20">
          <CardHeader>
            <CardTitle className="text-green-400">Try Premium</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Remove ads
            </p>
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Exclusive
              Tournaments
            </p>
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Access to 8000+
              game library
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item, index) => {
            if (item.hasSwitch) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-start h-14 w-full px-4"
                >
                  <item.icon className="mr-4 h-6 w-6 text-muted-foreground" />
                  <span className="flex-grow text-left">{item.text}</span>
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
                <item.icon className="mr-4 h-6 w-6 text-muted-foreground" />
                <span className="flex-grow text-left">{item.text}</span>
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
