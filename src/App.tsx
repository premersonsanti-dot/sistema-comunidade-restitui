
import React, { useState, useEffect } from 'react';
import { ViewType, Patient, Prescription, Medication, Evolution } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './views/LoginView';
import { PrescriptionView } from './views/PrescriptionView';
import { InventoryView } from './views/InventoryView';
import { PatientsView } from './views/PatientsView';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Initialization: Check for persistent session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email,
          email: session.user.email
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email,
          email: session.user.email
        });
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Database States with LocalStorage Sync
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('medsys_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem('medsys_prescriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('medsys_medications');
    return saved ? JSON.parse(saved) : [];
  });

  const [evolutions, setEvolutions] = useState<Evolution[]>(() => {
    const saved = localStorage.getItem('medsys_evolutions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('medsys_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('medsys_prescriptions', JSON.stringify(prescriptions)); }, [prescriptions]);
  useEffect(() => { localStorage.setItem('medsys_medications', JSON.stringify(medications)); }, [medications]);
  useEffect(() => { localStorage.setItem('medsys_evolutions', JSON.stringify(evolutions)); }, [evolutions]);

  const handleLogin = async (stayConnected: boolean, credentials: { user: string; pass: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.user,
      password: credentials.pass,
    });

    if (error) {
      alert(`Erro ao entrar: ${error.message}`);
      return false;
    }

    if (stayConnected) {
      localStorage.setItem('medsys_remembered_user', JSON.stringify({
        user: credentials.user,
        pass: credentials.pass
      }));
    } else {
      localStorage.removeItem('medsys_remembered_user');
    }

    return true;
  };

  const handleRegister = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
        }
      }
    });

    if (error) {
      alert(`Erro ao cadastrar: ${error.message}`);
      return false;
    }

    alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de tentar o primeiro login.');
    return true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      alert(`Erro ao entrar com Google: ${error.message}`);
    }
  };

  // CRUD Helpers
  const addPatient = (newPatient: Omit<Patient, 'id'>) => {
    const patientWithId = { ...newPatient, id: Date.now().toString() };
    setPatients(prev => [patientWithId, ...prev]);
    setIsAddingPatient(false);
    return patientWithId;
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const deletePatient = (id: string) => {
    if (confirm('Deseja excluir permanentemente este paciente?')) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  };

  const savePrescription = (prescription: Omit<Prescription, 'id'>) => {
    setPrescriptions(prev => {
      // Check if a prescription already exists for this patient on this date
      const existingIdx = prev.findIndex(p => p.patientId === prescription.patientId && p.date === prescription.date);

      if (existingIdx !== -1) {
        // Update existing prescription: replace items with the new list (which includes accumulated items)
        const updated = [...prev];
        updated[existingIdx] = { ...prev[existingIdx], ...prescription };
        return updated;
      }

      // Create new prescription
      const newPrescription = { ...prescription, id: Date.now().toString() };
      return [newPrescription, ...prev];
    });

    prescription.items.forEach(item => {
      const exists = medications.find(m => m.name.toLowerCase() === item.name.toLowerCase());
      if (!exists) {
        const newMed: Medication = {
          id: Date.now().toString() + Math.random(),
          name: item.name,
          description: item.dosage,
          category: 'Geral',
          form: 'Outro',
          stock: 0,
          price: 0,
          status: 'Estoque Baixo'
        };
        setMedications(prev => [...prev, newMed]);
      }
    });
  };

  const updateMedication = (med: Medication) => setMedications(prev => prev.map(m => m.id === med.id ? med : m));
  const addMedication = (med: Omit<Medication, 'id'>) => setMedications(prev => [...prev, { ...med, id: Date.now().toString() }]);
  const deleteMedication = (id: string) => {
    if (confirm('Deseja remover este item do estoque?')) {
      setMedications(prev => prev.filter(m => m.id !== id));
    }
  };

  const saveEvolution = (evolution: Omit<Evolution, 'id'>) => {
    const newEvolution = { ...evolution, id: Date.now().toString() };
    setEvolutions(prev => [newEvolution, ...prev]);
  };

  const [prescribingPatient, setPrescribingPatient] = useState<{ patient?: Patient, prescription?: Prescription } | null>(null);

  const handleStartPrescription = (data: { patient?: Patient, prescription?: Prescription }) => {
    setPrescribingPatient(data);
    setCurrentView(ViewType.PRESCRIPTIONS);
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} onForgotPassword={() => { }} />;
  }

  return (
    <div className="flex h-screen w-full flex-row bg-background-light">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view !== ViewType.MEDICATIONS) setShowLowStockOnly(false);
          setCurrentView(view);
        }}
        onLogout={handleLogout}
        userName={currentUser?.name}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header currentView={currentView} userName={currentUser?.name || 'Usuário'} />

        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === ViewType.DASHBOARD && (
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Olá, {currentUser?.name?.split(' ')[0]}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Pacientes', value: Math.max(0, patients.length - 2), icon: 'group', color: 'blue', target: ViewType.PATIENTS },
                  { label: 'Prescrições', value: Math.max(0, prescriptions.length - 2), icon: 'description', color: 'indigo', target: ViewType.PRESCRIPTIONS },
                  { label: 'Medicamentos', value: Math.max(0, medications.length - 2), icon: 'medication', color: 'teal', target: ViewType.MEDICATIONS },
                  { label: 'Alertas', value: Math.max(0, medications.filter(m => m.stock < 20).length - 2), icon: 'warning', color: 'rose', target: ViewType.MEDICATIONS, filter: true },
                ].map((card, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if ('filter' in card && card.filter) setShowLowStockOnly(true);
                      else setShowLowStockOnly(false);
                      setCurrentView(card.target as any);
                    }}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className={`size-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center`}><span className="material-icons-round">{card.icon}</span></div>
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
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
