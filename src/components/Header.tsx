
import React from 'react';
import { ViewType } from '../types';
import { MENU_ITEMS } from '../constants';

interface HeaderProps {
  currentView: ViewType;
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({ currentView, userName }) => {
  const currentItem = MENU_ITEMS.find(item => item.id === currentView);
  const viewLabel = currentItem ? currentItem.label : currentView.toLowerCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm print:hidden">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <span>Home</span>
          <span className="material-icons-round text-xs">chevron_right</span>
          <span className="text-slate-900 font-bold capitalize">{viewLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-900">{userName}</p>
          <p className="text-[10px] text-primary uppercase font-black tracking-tighter">Sessão Ativa</p>
        </div>
        <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
          {userName?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};
