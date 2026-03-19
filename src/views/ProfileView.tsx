
import React, { useState, useEffect } from 'react';
import { Profile, Clinic } from '../types';

interface ProfileViewProps {
    profile: Profile | null;
    clinicSettings: Clinic | null;
    userEmail?: string;
    onUpdateProfile: (updated: Profile) => Promise<void>;
    onUpdateClinic: (updated: Clinic) => Promise<void>;
    onAddClinic: (clinic: Omit<Clinic, 'id'>) => Promise<any>;
    onUploadClinicLogo: (file: File, clinicId: string) => Promise<string | null>;
    allProfiles: Profile[];
    onUpdateProfileRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    profile,
    clinicSettings,
    userEmail,
    onUpdateProfile,
    onUpdateClinic,
    onAddClinic,
    onUploadClinicLogo,
    allProfiles,
    onUpdateProfileRole
}) => {
    const isAdmin = profile?.role === 'admin';

    const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'security' | 'users'>(isAdmin ? 'users' : 'profile');

    const [profileData, setProfileData] = useState<Partial<Profile>>({});
    const [clinicData, setClinicData] = useState<Partial<Clinic>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingNewClinic, setIsAddingNewClinic] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (profile) setProfileData(profile);
        if (clinicSettings) setClinicData(clinicSettings);
        else setClinicData({});
    }, [profile, clinicSettings]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onUpdateProfile(profileData as Profile);
        setIsSaving(false);
        alert('Perfil atualizado com sucesso!');
    };

    const handleSaveClinic = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (isAddingNewClinic) {
            await onAddClinic(clinicData as Omit<Clinic, 'id'>);
            setIsAddingNewClinic(false);
            alert('Nova clínica cadastrada com sucesso! Selecione ela no menu lateral.');
        } else {
            await onUpdateClinic(clinicData as Clinic);
            alert('Dados da clínica atualizados!');
        }
        setIsSaving(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!clinicSettings?.id && !isAddingNewClinic) return;

        setIsUploading(true);
        const clinicId = clinicSettings?.id || 'new-clinic';
        const publicUrl = await onUploadClinicLogo(file, clinicId);
        if (publicUrl) {
            setClinicData(prev => ({ ...prev, logo_url: publicUrl }));
            if (!isAddingNewClinic) {
                await onUpdateClinic({ ...clinicSettings, logo_url: publicUrl });
                alert('Logo atualizada com sucesso!');
            }
        }
        setIsUploading(false);
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {isAdmin ? 'Painel Administrativo' : 'Meu Perfil'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {isAdmin
                            ? 'Gerenciamento de profissionais, múltiplas clínicas e seu perfil.'
                            : 'Gerencie suas informações profissionais e dados de acesso.'}
                    </p>
                </div>

                <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 w-fit gap-1">
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <span className="material-icons-round text-sm">group</span>
                            Profissionais
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons-round text-sm">person</span>
                        Meus Dados
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('clinic')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'clinic' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <span className="material-icons-round text-sm">business</span>
                            Dados da Clínica
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="material-icons-round text-sm">security</span>
                        Segurança
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    {activeTab === 'users' && isAdmin && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Gerenciar Profissionais</h3>
                                    <p className="text-sm text-slate-500">Controle quem tem acesso ao sistema e quais são suas permissões.</p>
                                </div>
                                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <span className="material-icons-round text-sm">how_to_reg</span>
                                    {allProfiles.length} Registrados
                                </div>
                            </div>

                            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Profissional</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidade / Cargo</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nível de Acesso</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allProfiles.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                                            {p.full_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{p.full_name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">ID: {p.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {p.specialty || p.profession || 'Não informado'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${p.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        <span className={`size-1.5 rounded-full ${p.role === 'admin' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                                            {p.role === 'admin' ? 'Administrador' : 'Usuário'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {p.id !== profile?.id && (
                                                        <button
                                                            onClick={async () => {
                                                                const newRole = p.role === 'admin' ? 'user' : 'admin';
                                                                if (window.confirm(`Tem certeza que deseja alterar o acesso de ${p.full_name} para ${newRole === 'admin' ? 'Administrador' : 'Usuário Padrão'}?`)) {
                                                                    await onUpdateProfileRole(p.id, newRole);
                                                                }
                                                            }}
                                                            className="px-3 py-1.5 text-[10px] font-black bg-slate-100 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                                                        >
                                                            Mudar Permissão
                                                        </button>
                                                    )}
                                                    {p.id === profile?.id && (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">Você</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={profileData.full_name || ''}
                                        onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissão / Atuação</label>
                                    <select
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={profileData.profession || 'Médico'}
                                        onChange={e => setProfileData({ ...profileData, profession: e.target.value as any })}
                                    >
                                        <option value="Médico">Médico(a)</option>
                                        <option value="Enfermeiro">Enfermeiro(a)</option>
                                        <option value="Psicólogo">Psicólogo(a)</option>
                                        <option value="Terapeuta">Terapeuta</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Conselho (Ex: CRM, COREN)</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="CRM-SP"
                                        value={profileData.council_type || ''}
                                        onChange={e => setProfileData({ ...profileData, council_type: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número do Registro</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        value={profileData.council_number || ''}
                                        onChange={e => setProfileData({ ...profileData, council_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Especialidade</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="Ex: Cardiologia, Pediatria..."
                                        value={profileData.specialty || ''}
                                        onChange={e => setProfileData({ ...profileData, specialty: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">URL da Assinatura Digital</label>
                                    <input
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                        placeholder="https://sua-imagem.com/assinatura.png"
                                        value={profileData.signature_url || ''}
                                        onChange={e => setProfileData({ ...profileData, signature_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={isSaving} className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/30 disabled:opacity-50">
                                {isSaving ? 'Salvando...' : 'Salvar Meus Dados'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'clinic' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{isAddingNewClinic ? 'Cadastrar Nova Clínica' : (clinicSettings?.name || 'Clínica Não Selecionada')}</h3>
                                    <p className="text-xs text-slate-500">{isAddingNewClinic ? 'Preencha os dados da nova instituição' : 'Gerencie os dados da clínica ativa'}</p>
                                    {!isAddingNewClinic && clinicSettings?.id && (
                                        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg w-fit">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID da Clínica:</span>
                                            <code className="text-[11px] font-bold text-primary select-all">{clinicSettings.id}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(clinicSettings.id);
                                                    alert('ID copiado para a área de transferência!');
                                                }}
                                                className="hover:text-primary transition-colors flex items-center"
                                                title="Copiar ID"
                                            >
                                                <span className="material-icons-round text-sm">content_copy</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isAdmin && !isAddingNewClinic && (
                                    <button
                                        onClick={() => {
                                            setIsAddingNewClinic(true);
                                            setClinicData({});
                                        }}
                                        className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-sm">add_business</span>
                                        Nova Clínica
                                    </button>
                                )}
                                {isAddingNewClinic && (
                                    <button
                                        onClick={() => {
                                            setIsAddingNewClinic(false);
                                            setClinicData(clinicSettings || {});
                                        }}
                                        className="px-4 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-300 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSaveClinic} className="space-y-6">
                                {!isAdmin && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 mb-6">
                                        <span className="material-icons-round text-amber-500">warning_amber</span>
                                        <div>
                                            <p className="text-sm text-amber-900 font-bold">Acesso Restrito</p>
                                            <p className="text-xs text-amber-700">Apenas administradores podem modificar as informações da clínica.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo da Instituição</label>
                                        <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                            <div className="size-20 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
                                                {clinicData.logo_url ? (
                                                    <img src={clinicData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="material-icons-round text-slate-300 text-3xl">business</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-700 mb-1">Upload de Nova Imagem</p>
                                                <p className="text-[10px] text-slate-500 mb-3">Recomendado: 400x400px, PNG ou JPG.</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={!isAdmin || isUploading}
                                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-white transition-all cursor-pointer"
                                                />
                                                {isUploading && <p className="text-[10px] text-primary font-bold mt-2 animate-pulse">Carregando imagem...</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Instituição</label>
                                        <input
                                            disabled={!isAdmin}
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:text-slate-400"
                                            value={clinicData.name || ''}
                                            onChange={e => setClinicData({ ...clinicData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</label>
                                        <input
                                            disabled={!isAdmin}
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:text-slate-400"
                                            placeholder="00.000.000/0000-00"
                                            value={clinicData.cnpj || ''}
                                            onChange={e => setClinicData({ ...clinicData, cnpj: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Institucional</label>
                                        <input
                                            disabled={!isAdmin}
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:text-slate-400"
                                            value={clinicData.email || ''}
                                            onChange={e => setClinicData({ ...clinicData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefones de Contato</label>
                                        <input
                                            disabled={!isAdmin}
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:text-slate-400"
                                            placeholder="(00) 00000-0000"
                                            value={clinicData.phones || ''}
                                            onChange={e => setClinicData({ ...clinicData, phones: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                                        <input
                                            disabled={!isAdmin}
                                            className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:text-slate-400"
                                            value={clinicData.address || ''}
                                            onChange={e => setClinicData({ ...clinicData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center gap-3"
                                        >
                                            <span className="material-icons-round text-sm">{isAddingNewClinic ? 'add_business' : 'save'}</span>
                                            {isSaving ? 'Salvando...' : (isAddingNewClinic ? 'Cadastrar Clínica' : 'Salvar Alterações')}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <span className="material-icons-round text-primary">lock</span>
                                    Segurança da Conta
                                </h3>
                                <p className="text-sm text-slate-500 mb-6">Mantenha sua senha atualizada para garantir a proteção dos dados dos pacientes.</p>
                                <button
                                    onClick={() => alert('Para sua segurança, um e-mail de redefinição de senha será enviado.')}
                                    className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    Solicitar Nova Senha
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
