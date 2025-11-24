
'use client';

import { cn } from '@/lib/utils';
import { Coins, Star } from 'lucide-react';
import React from 'react';

interface Prize {
  id: string;
  text: string;
  type: string;
  value: number | string;
  probability: number;
}


interface SpinWheelProps {
  prizes: Prize[];
  prizeIndex: number | null;
  isSpinning: boolean;
}

const segmentColors = [
  '#8A2BE2', // BlueViolet
  '#4169E1', // RoyalBlue
  '#6495ED', // CornflowerBlue
  '#9370DB', // MediumPurple
  '#BA55D3', // MediumOrchid
  '#4B0082', // Indigo
  '#DA70D6', // Orchid
  '#DB7093', // PaleVioletRed
];

const getArcPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  thickness: number
) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const innerStart = polarToCartesian(cx, cy, radius - thickness, endAngle);
  const innerEnd = polarToCartesian(cx, cy, radius - thickness, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', radius - thickness, radius - thickness, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z'
  ].join(' ');

  return d;
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
};

const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, prizeIndex, isSpinning }) => {
  const numPrizes = prizes.length;
  const segmentAngle = 360 / numPrizes;

  // This creates a more dramatic spin: starts fast, spins, then slows down nicely
  const rotation = isSpinning && prizeIndex !== null
    ? 360 * 5 + (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2) + (Math.random() * (segmentAngle * 0.8) - (segmentAngle * 0.4))
    : 0;
  
  const size = 384; // md:w-96, md:h-96
  const center = size / 2;
  const radius = size / 2 - 10;
  const thickness = 120;
  const gap = 2; // Gap in degrees

  return (
    <div className="relative flex h-80 w-80 items-center justify-center md:h-96 md:w-96">
      {/* Pointer */}
      <div 
        className="absolute top-0 z-20" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0L31.3923 24L0.607696 24L16 0Z" fill="url(#paint0_linear_pointer)"/>
          <path d="M16 48L31.3923 24H0.607696L16 48Z" fill="url(#paint1_linear_pointer)" fillOpacity="0.4"/>
          <defs>
            <linearGradient id="paint0_linear_pointer" x1="16" y1="0" x2="16" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FEF4D4"/>
              <stop offset="1" stopColor="#FDE089"/>
            </linearGradient>
            <linearGradient id="paint1_linear_pointer" x1="16" y1="48" x2="16" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE089" stopOpacity="0"/>
              <stop offset="1" stopColor="#FDE089"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wheel */}
      <div
        className="relative h-full w-full rounded-full"
        style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 5000ms cubic-bezier(.1, .6, .2, 1)' // Custom, more dynamic timing function
        }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE089" />
              <stop offset="100%" stopColor="#D4A43A" />
            </linearGradient>
             {segmentColors.map((color, index) => (
              <linearGradient key={index} id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: color, stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: segmentColors[(index + 1) % segmentColors.length], stopOpacity: 0.7}} />
              </linearGradient>
            ))}
          </defs>
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngle + gap;
            const endAngle = (index + 1) * segmentAngle - gap;
            
            const isJackpot = prize.text === 'JACKPOT';
            const color = isJackpot ? 'url(#gold-gradient)' : `url(#grad-${index % segmentColors.length})`;

            const textAngle = startAngle + segmentAngle / 2;
            const textPosition = polarToCartesian(center, center, radius - thickness / 2, textAngle);

            return (
              <g key={prize.id}>
                <path d={getArcPath(center, center, radius, startAngle, endAngle, thickness)} fill={color} />
                <text
                  x={textPosition.x}
                  y={textPosition.y}
                  dy=".3em"
                  textAnchor="middle"
                  fill={isJackpot ? "#422B09" : "white"}
                  fontSize="16"
                  fontWeight="bold"
                  transform={`rotate(${textAngle}, ${textPosition.x}, ${textPosition.y}) rotate(90, ${textPosition.x}, ${textPosition.y})`}
                >
                  {prize.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

       {/* Center Circle */}
       <div className="absolute z-10 flex h-[130px] w-[130px] items-center justify-center rounded-full bg-gradient-to-b from-[#FDE089] to-[#D4A43A] shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
        <div className="flex h-[118px] w-[118px] items-center justify-center rounded-full bg-gradient-to-b from-[#FDE089] to-[#D4A43A]">
           <span className="text-4xl font-black text-[#6A460A] drop-shadow-sm">SPIN</span>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
