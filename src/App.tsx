
import React, { useState } from 'react';
import { ViewType, Prescription } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { PrescriptionView } from './views/PrescriptionView';
import { InventoryView } from './views/InventoryView';
import { PatientsView } from './views/PatientsView';
import { ProfileView } from './views/ProfileView';
import { OnboardingView } from './views/OnboardingView';
import { Modal } from './components/Modal';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import { useAuth } from './hooks/useAuth';
import { useClinicData } from './hooks/useClinicData';

const App: React.FC = () => {
  const {
    isLoggedIn,
    currentUser,
    handleLogin,
    handleRegister,
    handleLogout,
    handleGoogleLogin
  } = useAuth();

  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [prescribingPatient, setPrescribingPatient] = useState<{ patient?: any, prescription?: Prescription } | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const {
    patients,
    prescriptions,
    medications,
    evolutions,
    profile,
    allProfiles,
    clinics,
    activeClinicId,
    setActiveClinicId,
    activeClinic,
    addPatient,
    updatePatient,
    deletePatient,
    savePrescription,
    addMedication,
    updateMedication,
    deleteMedication,
    saveEvolution,
    updateProfile,
    updateProfileRole,
    updateClinic,
    addClinic,
    joinClinic,
    uploadClinicLogo
  } = useClinicData(currentUser, currentView, setCurrentView);

  // Dashboard Helpers
  const today = new Date();
  const expiringPrescriptions = prescriptions.filter(p => {
    if (!p.date) return false;
    const date = parseISO(p.date);
    const expiryDate = addDays(date, 60);
    const daysUntil = differenceInDays(expiryDate, today);
    return daysUntil <= 7;
  }).sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

  const handleRenewFromDashboard = (p: Prescription) => {
    setPrescribingPatient({ prescription: p });
    setCurrentView(ViewType.PRESCRIPTIONS);
    setIsAlertModalOpen(false);
  };

  const handleStartPrescription = (data: { patient?: any, prescription?: Prescription }) => {
    setPrescribingPatient(data);
    setCurrentView(ViewType.PRESCRIPTIONS);
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleLogin={handleGoogleLogin}
        onForgotPassword={() => { }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full flex-row bg-background-light">
      <Sidebar
        currentView={currentView}
        userRole={profile?.role}
        userProfession={profile?.profession}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
        clinics={clinics}
        activeClinicId={activeClinicId}
        onClinicChange={(id) => {
          setActiveClinicId(id);
          localStorage.setItem('medsys_active_clinic', id);
        }}
        onNavigate={(view) => {
          if (!activeClinicId && view !== ViewType.PROFILE && view !== ViewType.ONBOARDING) {
            setCurrentView(ViewType.ONBOARDING);
            return;
          }
          if (view !== ViewType.MEDICATIONS) setShowLowStockOnly(false);
          setCurrentView(view);
        }}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header currentView={currentView} userName={currentUser?.name || 'Usuário'} />

        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === ViewType.DASHBOARD && (
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Olá, {currentUser?.name?.split(' ')[0]}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {[
                  { label: 'Pacientes', value: patients.length, icon: 'group', color: 'blue', target: ViewType.PATIENTS },
                  { label: 'Prescrições', value: prescriptions.length, icon: 'description', color: 'indigo', target: ViewType.PRESCRIPTIONS },
                  { label: 'Medicamentos', value: medications.length, icon: 'medication', color: 'teal', target: ViewType.MEDICATIONS },
                  { label: 'Estoque Baixo', value: medications.filter(m => m.stock < 20).length, icon: 'inventory_2', color: 'rose', target: ViewType.MEDICATIONS, filter: true },
                  { label: 'Receitas Vencendo', value: expiringPrescriptions.length, icon: 'schedule', color: 'amber', isAlertModal: true },
                ].map((card, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if ('isAlertModal' in card && card.isAlertModal) {
                        setIsAlertModalOpen(true);
                      } else {
                        if ('filter' in card && card.filter) setShowLowStockOnly(true);
                        else setShowLowStockOnly(false);
                        setCurrentView((card as any).target);
                      }
                    }}
                    className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 ${card.isAlertModal && expiringPrescriptions.length > 0 ? 'ring-2 ring-amber-200 border-amber-200' : ''}`}
                  >
                    <div className={`size-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center relative`}>
                      <span className="material-icons-round">{card.icon}</span>
                      {'isAlertModal' in card && expiringPrescriptions.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white animate-pulse">
                          {expiringPrescriptions.length}
                        </span>
                      )}
                    </div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p><h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentView === ViewType.PRESCRIPTIONS && (
            <PrescriptionView
              patients={patients}
              medications={medications}
              onAddPatient={addPatient}
              onSavePrescription={savePrescription}
              initialPatient={prescribingPatient?.patient}
              initialPrescription={prescribingPatient?.prescription}
              prescriptions={prescriptions}
              userProfile={profile}
              clinicSettings={activeClinic as any}
            />
          )}
          {currentView === ViewType.MEDICATIONS && (
            <InventoryView
              medications={medications}
              onAddMedication={addMedication}
              onUpdateMedication={updateMedication}
              onDeleteMedication={deleteMedication}
              showLowStockOnly={showLowStockOnly}
            />
          )}
          {currentView === ViewType.PATIENTS && (
            <PatientsView
              patients={patients}
              prescriptions={prescriptions}
              evolutions={evolutions}
              onAddPatient={addPatient}
              onUpdatePatient={updatePatient}
              onDeletePatient={deletePatient}
              isInitialFormOpen={isAddingPatient}
              onCloseForm={() => setIsAddingPatient(false)}
              onNewPrescription={(patient) => handleStartPrescription({ patient })}
              onRepeatPrescription={(prescription) => handleStartPrescription({ prescription })}
              onSaveEvolution={saveEvolution}
              userProfile={profile}
              clinicSettings={activeClinic as any}
            />
          )}
          {currentView === ViewType.PROFILE && (
            <ProfileView
              profile={profile}
              onUpdateProfile={updateProfile}
              clinicSettings={activeClinic as any}
              onUpdateClinic={updateClinic as any}
              onAddClinic={addClinic}
              onUploadClinicLogo={uploadClinicLogo}
              allProfiles={allProfiles}
              onUpdateProfileRole={updateProfileRole}
              userEmail={currentUser?.email}
            />
          )}
          {currentView === ViewType.ONBOARDING && (
            <OnboardingView
              userName={currentUser?.name || 'Usuário'}
              onLogout={handleLogout}
              onCreateClinic={addClinic}
              onJoinClinic={joinClinic}
              onUploadLogo={uploadClinicLogo}
            />
          )}
        </div>
      </main>

      <Modal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title="Alertas de Vencimento"
        subtitle="Prescrições vencidas ou próximas do vencimento (60 dias)"
        icon="warning"
        iconBgColor="bg-amber-50 text-amber-500"
        maxWidth="max-w-4xl"
      >
        <div className="p-6">
          {expiringPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="material-icons-round text-4xl mb-2 opacity-50">check_circle</span>
              <p>Nenhuma prescrição próxima do vencimento.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-slate-100">
                  <th className="pb-3 pl-4">Paciente</th>
                  <th className="pb-3">Data Emissão</th>
                  <th className="pb-3">Vencimento</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expiringPrescriptions.map(p => {
                  const pDate = parseISO(p.date);
                  const expiryDate = addDays(pDate, 60);
                  const daysUntil = differenceInDays(expiryDate, today);
                  const patient = patients.find(pt => pt.id === p.patientId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pl-4">
                        <p className="font-bold text-slate-700 text-sm">{patient?.name || 'Paciente desconhecido'}</p>
                        <p className="text-[10px] text-slate-400">{patient?.cpf}</p>
                      </td>
                      <td className="py-3 text-sm text-slate-600">{format(pDate, "dd/MM/yyyy")}</td>
                      <td className="py-3 text-sm text-slate-600">{format(expiryDate, "dd/MM/yyyy")}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${daysUntil < 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {daysUntil < 0 ? 'VENCEU' : `VENCE EM ${daysUntil} DIAS`}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <button
                          onClick={() => handleRenewFromDashboard(p)}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                        >
                          Renovar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default App;
