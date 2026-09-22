import React from 'react';
import {
  Key,
  Wallet,
  Glasses,
  BatteryCharging,
  IdCard,
  Briefcase,
  Smartphone,
  Watch,
  Book,
  Laptop,
  Folder,
  Package,
} from 'lucide-react';

export function getItemIcon(itemName: string) {
  const lower = itemName.toLowerCase();

  if (lower.includes('key') || lower.includes('சாவி')) {
    return <Key className="w-5 h-5 text-amber-500" />;
  }
  if (lower.includes('wallet') || lower.includes('பணப்பை') || lower.includes('purse')) {
    return <Wallet className="w-5 h-5 text-emerald-500" />;
  }
  if (lower.includes('spectacle') || lower.includes('glass') || lower.includes('கண்ணாடி')) {
    return <Glasses className="w-5 h-5 text-indigo-500" />;
  }
  if (lower.includes('charger') || lower.includes('சார்ஜர்') || lower.includes('cable')) {
    return <BatteryCharging className="w-5 h-5 text-cyan-500" />;
  }
  if (lower.includes('id') || lower.includes('card') || lower.includes('அட்டை')) {
    return <IdCard className="w-5 h-5 text-purple-500" />;
  }
  if (lower.includes('bag') || lower.includes('backpack') || lower.includes('பை')) {
    return <Briefcase className="w-5 h-5 text-blue-500" />;
  }
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('போன்')) {
    return <Smartphone className="w-5 h-5 text-rose-500" />;
  }
  if (lower.includes('watch') || lower.includes('வாட்ச்')) {
    return <Watch className="w-5 h-5 text-yellow-600" />;
  }
  if (lower.includes('book') || lower.includes('புத்தகம்') || lower.includes('note')) {
    return <Book className="w-5 h-5 text-teal-500" />;
  }
  if (lower.includes('laptop') || lower.includes('கம்ப்யூட்டர்') || lower.includes('mac')) {
    return <Laptop className="w-5 h-5 text-slate-600 dark:text-slate-300" />;
  }
  if (lower.includes('file') || lower.includes('document')) {
    return <Folder className="w-5 h-5 text-amber-600" />;
  }

  return <Package className="w-5 h-5 text-emerald-600" />;
}
