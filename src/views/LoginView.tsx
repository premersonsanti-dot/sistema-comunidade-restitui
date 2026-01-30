
import React, { useState, useEffect } from 'react';

interface LoginViewProps {
  onLogin: (stayConnected: boolean, credentials: { user: string; pass: string }) => boolean | Promise<boolean>;
  onRegister: (userData: any) => boolean | Promise<boolean>;
  onGoogleLogin: () => void;
  onForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, onGoogleLogin, onForgotPassword }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [stayConnected, setStayConnected] = useState(true);
  const [showPass, setShowPass] = useState(false);

  // Load remembered credentials
  useEffect(() => {
    const saved = localStorage.getItem('medsys_remembered_user');
    if (saved) {
      try {
        const { user: savedUser, pass: savedPass } = JSON.parse(saved);
        setUser(savedUser);
        setPass(savedPass);
        setStayConnected(true);
      } catch (e) {
        localStorage.removeItem('medsys_remembered_user');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (!name) { alert('Por favor, informe seu nome completo.'); return; }
      if (pass !== confirmPass) {
        alert('As senhas digitadas não coincidem.');
        return;
      }
      if (pass.length < 6) {
        alert('A senha deve conter ao menos 6 caracteres.');
        return;
      }
      onRegister({ name, email: user, password: pass });
    } else {
      onLogin(stayConnected, { user, pass });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 overflow-hidden relative">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 size-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[380px] z-10 transition-all">
        <div className="flex flex-col items-center mb-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl mb-3">
            <span className="material-symbols-outlined text-primary text-[24px]">medical_services</span>
          </div>
          <h1 className="text-white text-xl font-black tracking-tight">MedSys<span className="text-primary">.Pro</span></h1>
        </div>

        <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 shadow-2xl transition-all duration-300">
          <div className="text-center mb-5">
            <h2 className="text-slate-900 text-base font-bold">{isRegistering ? 'Nova Conta Profissional' : 'Acesso ao Painel'}</h2>
            <p className="text-slate-500 text-[10px] mt-1">{isRegistering ? 'Cadastre seu nome e e-mail para começar.' : 'Insira suas credenciais para continuar.'}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-1">Nome Completo</label>
                <input
                  required
                  className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  type="text"
                  placeholder="Nome do Profissional"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-1">E-mail Profissional</label>
              <input
                required
                className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="exemplo@clinica.com"
                type="email"
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-1">Senha de Acesso</label>
              <input
                required
                className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-4 pr-12 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-9 text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{showPass ? "visibility" : "visibility_off"}</span>
              </button>
            </div>

            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider ml-1">Confirmar Senha</label>
                <input
                  required
                  className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
            )}

            {!isRegistering && (
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`size-5 rounded border-2 flex items-center justify-center transition-all ${stayConnected ? 'bg-primary border-primary' : 'bg-white border-slate-200 group-hover:border-primary/50'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={stayConnected}
                      onChange={(e) => setStayConnected(e.target.checked)}
                    />
                    {stayConnected && <span className="material-icons-round text-white text-[16px]">check</span>}
                  </div>
                  <span className="text-slate-600 text-xs font-bold select-none">Manter conectado</span>
                </label>
                <button type="button" onClick={onForgotPassword} className="text-primary text-xs font-bold hover:underline">Esqueci a senha</button>
              </div>
            )}

            <button className="w-full h-14 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all mt-4 transform active:scale-95">
              {isRegistering ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative px-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest">ou entrar com</span>
            </div>

            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5" />
              <span className="text-slate-700 text-sm font-bold">Continuar com Google</span>
            </button>
          </div>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-slate-500 hover:text-primary transition-colors"
            >
              {isRegistering ? 'Já possui conta? Faça o login' : 'Não tem conta? Cadastre-se gratuitamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
