
import React from 'react';
import { ViewType } from '../types';
import { MENU_ITEMS, DOCTOR_INFO } from '../constants';

interface SidebarProps {
  currentView: string;
  userName?: string;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, userName }) => {
  return (
    <aside className="w-64 bg-secondary flex flex-col justify-between shrink-0 h-full border-r border-slate-800 transition-all duration-300 print:hidden">
      <div className="flex flex-col h-full">
        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 text-white border-b border-slate-800 gap-3">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <span className="material-icons-round text-primary text-2xl">local_hospital</span>
          </div>
          <span className="font-bold text-lg tracking-tight">MedSys<span className="text-primary">.Pro</span></span>
        </div>

        {/* Doctor Summary */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full ring-2 ring-primary/30 overflow-hidden bg-slate-700 flex items-center justify-center">
              {/* <img src="https://picsum.photos/seed/doctor/100/100" alt="Doctor" className="size-full object-cover" /> */}
              <span className="material-symbols-outlined text-slate-300">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-sm font-bold truncate">{userName || 'Usuário'}</p>
              <p className="text-slate-400 text-xs truncate">Online agora</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewType)}
              className={`flex items-center px-4 py-3 rounded-lg transition-all group ${currentView === item.id
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${currentView === item.id ? '' : 'group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="ml-3 font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Support */}
        <div className="mt-auto p-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-icons-round text-sm">help_outline</span>
              <span className="text-xs font-bold uppercase tracking-wider">Suporte Técnico</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Canal exclusivo para profissionais.</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 h-10 rounded-lg bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
