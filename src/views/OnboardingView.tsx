
import React, { useState } from 'react';

interface OnboardingViewProps {
    userName: string;
    onLogout: () => void;
    onCreateClinic: (clinicData: any) => Promise<any>;
    onJoinClinic: (code: string) => Promise<boolean>;
    onUploadLogo: (file: File, clinicId: string) => Promise<string | null>;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userName, onLogout, onCreateClinic, onJoinClinic, onUploadLogo }) => {
    const [step, setStep] = useState<'CHOICE' | 'CREATE' | 'JOIN'>('CHOICE');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [newClinic, setNewClinic] = useState({
        name: '', cnpj: '', email: '', phones: '', address: '', logo_url: ''
    });
    const [joinCode, setJoinCode] = useState('');

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        // Use a temporary ID for storage if the clinic doesn't exist yet, or a generic path
        const publicUrl = await onUploadLogo(file, 'new-clinic');
        if (publicUrl) {
            setNewClinic(prev => ({ ...prev, logo_url: publicUrl }));
        }
        setIsUploading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onCreateClinic(newClinic);
        setLoading(false);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await onJoinClinic(joinCode);
        setLoading(false);
        if (!success) alert('Código inválido ou clínica não encontrada.');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="size-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="material-icons-round text-3xl">medical_services</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo(a), {userName.split(' ')[0]}!</h1>
                    <p className="text-slate-500 mt-2">Para começar a usar o MedSys, precisamos configurar sua clínica.</p>
                </div>

                {step === 'CHOICE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => setStep('JOIN')}
                            className="bg-white p-8 rounded-[2rem] border-2 border-primary/20 shadow-xl hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 transition-all group flex flex-col items-center text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                Recomendado
                            </div>
                            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                                <span className="material-icons-round">key</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Entrar com Código/ID</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Já trabalho em uma clínica que utiliza o sistema e possuo um código de acesso.</p>
                        </button>

                        <button
                            onClick={() => setStep('CREATE')}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center"
                        >
                            <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <span className="material-icons-round">add_business</span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2">Criar Minha Clínica</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Sou proprietário ou administrador e quero configurar uma nova unidade.</p>
                        </button>
                    </div>
                )}

                {step === 'CREATE' && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setStep('CHOICE')}
                                className="size-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                            >
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <h2 className="text-xl font-black text-slate-900">Sobre sua Instituição</h2>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5 mb-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo da Clínica (Opcional)</label>
                                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="size-14 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                        {newClinic.logo_url ? (
                                            <img src={newClinic.logo_url} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="material-icons-round text-slate-300 text-xl">business</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                            className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white transition-all cursor-pointer"
                                        />
                                        {isUploading && <p className="text-[9px] text-primary font-bold mt-1 animate-pulse">Carregando...</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Clínica</label>
                                <input
                                    required
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="Ex: Clínica Saúde Total"
                                    value={newClinic.name}
                                    onChange={e => setNewClinic({ ...newClinic, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ (Opcional)</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="00.000..."
                                        value={newClinic.cnpj}
                                        onChange={e => setNewClinic({ ...newClinic, cnpj: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                        value={newClinic.phones}
                                        onChange={e => setNewClinic({ ...newClinic, phones: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                                <input
                                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                    value={newClinic.address}
                                    onChange={e => setNewClinic({ ...newClinic, address: e.target.value })}
                                />
                            </div>
                            <button
                                disabled={loading || !newClinic.name}
                                className="w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all mt-4 disabled:opacity-50"
                            >
                                {loading ? 'Configurando...' : 'Começar a Usar Agora'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'JOIN' && (
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setStep('CHOICE')}
                                className="size-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                            >
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <h2 className="text-xl font-black text-slate-900">Vincular Conta</h2>
                        </div>

                        <p className="text-sm text-slate-500 mb-6">Peça ao administrador da sua clínica o **Código de Visualização** ou o ID da instituição.</p>

                        <form onSubmit={handleJoin} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID da Clínica</label>
                                <input
                                    required
                                    className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-center text-lg font-black tracking-widest focus:border-primary outline-none transition-all uppercase"
                                    placeholder="ID-DA-CLINICA"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                />
                            </div>
                            <button
                                disabled={loading || !joinCode}
                                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Validando...' : 'Vincular e Entrar'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Footer Support */}
                <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center text-slate-400">
                    <button onClick={onLogout} className="text-xs font-bold hover:text-rose-500 transition-all flex items-center gap-2">
                        <span className="material-icons-round text-sm">logout</span>
                        Sair da conta
                    </button>
                    <p className="text-[10px] font-medium tracking-tight">Precisa de ajuda? <span className="text-primary font-bold cursor-pointer">Suporte MedSys</span></p>
                </div>
            </div>
        </div>
    );
};
