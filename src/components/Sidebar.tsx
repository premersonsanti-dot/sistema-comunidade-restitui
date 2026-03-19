
import React from 'react';
import { ViewType, Clinic } from '../types';
import { MENU_ITEMS } from '../constants';

interface SidebarProps {
  currentView: string;
  userName?: string;
  userRole?: string;
  userProfession?: string;
  userEmail?: string;
  clinics: Clinic[];
  activeClinicId: string | null;
  onClinicChange: (id: string) => void;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  userName,
  userRole,
  userProfession,
  userEmail,
  clinics,
  activeClinicId,
  onClinicChange
}) => {
  const isAdmin = userRole === 'admin';

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    // Se não houver clínica ativa, só permite ver Perfil e Dashboard (embora o Dashboard esteja vazio)
    // Na verdade, se não tem clínica, o App.tsx vai forçar ONBOARDING, então o Sidebar
    // deve refletir essa restrição.
    if (!activeClinicId) {
      return item.id === 'PROFILE' || item.id === 'DASHBOARD';
    }

    // Admin vê tudo sempre
    if (isAdmin) return true;

    // Regras para usuários comuns:
    // 1. Médicos veem prescrições
    if (item.id === 'PRESCRIPTIONS') {
      return userProfession === 'Médico';
    }

    // 2. Esconder Estoque (MEDICATIONS) de não-admins
    if (item.id === 'MEDICATIONS') return false;

    return true;
  });

  return (
    <aside className="w-64 bg-secondary flex flex-col justify-between shrink-0 h-full border-r border-slate-800 transition-all duration-300 print:hidden">
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 text-white border-b border-slate-800 gap-3 shrink-0">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <span className="material-icons-round text-primary text-2xl">local_hospital</span>
          </div>
          <span className="font-bold text-lg tracking-tight">MedSys<span className="text-primary">.Pro</span></span>
        </div>

        {/* Clinic Selector */}
        <div className="px-4 py-4 border-b border-slate-800 bg-black/10">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">
            Clínica Ativa
          </label>
          <div className="relative">
            <select
              value={activeClinicId || ''}
              onChange={(e) => onClinicChange(e.target.value)}
              className="w-full bg-slate-800/50 text-white text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-all pr-8"
            >
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {clinics.length === 0 && (
                <option value="">Nenhuma clínica</option>
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <span className="material-icons-round text-sm">unfold_more</span>
            </div>
          </div>
        </div>

        {/* Doctor Summary */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full ring-2 ring-primary/30 overflow-hidden bg-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-300">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-sm font-bold truncate">{userName || 'Usuário'}</p>
              <div className="flex items-center gap-1.5">
                <div className={`size-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-green-400'}`}></div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">
                  {isAdmin ? 'Administrador' : 'Usuário Padrão'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {filteredMenuItems.map((item) => {
            const isDisabled = !activeClinicId && item.id !== 'PROFILE' && item.id !== 'DASHBOARD';

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onNavigate(item.id as ViewType)}
                disabled={isDisabled}
                className={`flex items-center px-4 py-3 rounded-lg transition-all group ${currentView === item.id
                  ? 'bg-primary text-white shadow-md'
                  : isDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                title={isDisabled ? "Vincule-se a uma clínica para acessar" : ""}
              >
                <span className={`material-symbols-outlined text-[24px] ${currentView === item.id ? '' : isDisabled ? '' : 'group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className="ml-3 font-medium text-sm">{item.label}</span>
                {isDisabled && (
                  <span className="material-icons-round text-[14px] ml-auto opacity-50">lock</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Support */}
        <div className="mt-auto p-4 shrink-0">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-icons-round text-sm">help_outline</span>
              <span className="text-xs font-bold uppercase tracking-wider">Suporte Técnico</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Canal exclusivo para profissionais.</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 shrink-0">
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
