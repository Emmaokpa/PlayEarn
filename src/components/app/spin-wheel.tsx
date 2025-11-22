'use client';

import { cn } from '@/lib/utils';
import { Coins, Star } from 'lucide-react';
import React from 'react';

interface Prize {
  id: string;
  text: string;
  type: string;
}

interface SpinWheelProps {
  prizes: Prize[];
  prizeIndex: number | null;
  isSpinning: boolean;
}

// Pre-defined color sequence for the wheel segments
const segmentColors = [
  '#4B0082', // Indigo
  '#8A2BE2', // BlueViolet
  '#4169E1', // RoyalBlue
  '#6495ED', // CornflowerBlue
  '#9370DB', // MediumPurple
  '#BA55D3', // MediumOrchid
  '#DA70D6', // Orchid
  '#DDA0DD', // Plum
  '#DB7093', // PaleVioletRed
  '#FF7F50', // Coral
  '#FFD700', // Gold
  '#ADFF2F', // GreenYellow
];


const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, prizeIndex, isSpinning }) => {
  const numPrizes = prizes.length;
  const segmentAngle = 360 / numPrizes;

  // Calculate the rotation needed to land on the prize
  // Base rotation (at least 5 full spins) + prize-specific angle + small random offset
  const rotation = isSpinning && prizeIndex !== null
    ? 360 * 5 + (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2) + (Math.random() * (segmentAngle * 0.8) - (segmentAngle * 0.4))
    : 0;

  return (
    <div className="relative flex h-80 w-80 items-center justify-center rounded-full border-8 border-primary shadow-2xl md:h-96 md:w-96">
      {/* Pointer */}
      <div className="absolute -top-4 z-10 h-10 w-10">
        <div 
          className="h-0 w-0 border-x-8 border-b-[16px] border-x-transparent border-b-accent"
          style={{ transform: 'translateX(-50%)', left: '50%' }}
        />
      </div>

      {/* Wheel */}
      <div
        className={cn(
          'relative h-full w-full rounded-full transition-transform duration-[8000ms] ease-in-out',
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {prizes.map((prize, index) => {
          const angle = index * segmentAngle;
          const color = segmentColors[index % segmentColors.length];

          return (
            <div
              key={prize.id}
              className="absolute left-0 top-0 h-full w-full"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div
                className="absolute left-1/2 top-0 h-1/2 w-1/2 origin-bottom-left"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% 100%)`, // Creates a triangle
                  transform: `rotate(${segmentAngle}deg)`,
                  backgroundColor: color,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
              <div
                className="absolute left-1/2 top-0 h-1/2 w-1/2 origin-bottom-left flex items-center justify-center"
                style={{
                  clipPath: `polygon(0 0, 100% 0, 0 100%)`, // Creates a triangle
                   backgroundColor: color,
                   border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                 <div
                    className="flex transform items-center justify-center text-center font-bold text-white"
                    style={{
                      transform: `translateY(50%) rotate(${segmentAngle / 2}deg) translateY(-20px)`,
                       width: '80px'
                    }}
                  >
                   <span className="truncate">{prize.text}</span>
                   {prize.type === 'coins' && <Coins className="ml-1 h-4 w-4" />}
                   {prize.type === 'sticker' && <Star className="ml-1 h-4 w-4" />}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
      
       {/* Center Circle */}
      <div className="absolute flex h-20 w-20 items-center justify-center rounded-full border-4 border-accent bg-background">
        <span className="font-bold text-primary">SPIN</span>
      </div>
    </div>
  );
};

export default SpinWheel;
