
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

  // Database States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);

  // Fetch Data from Supabase
  const fetchAllData = async () => {
    if (!currentUser) return;

    const { data: pData } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (pData) setPatients(pData.map(p => ({ ...p, birthDate: p.birth_date })));

    const { data: mData } = await supabase.from('medications').select('*').order('name', { ascending: true });
    if (mData) setMedications(mData);

    const { data: prData } = await supabase.from('prescriptions').select('*').order('date', { ascending: false });
    if (prData) setPrescriptions(prData.map(pr => ({ ...pr, patientId: pr.patient_id, usageType: pr.usage_type, doctorName: pr.doctor_name, doctorCrm: pr.doctor_crm })));

    const { data: eData } = await supabase.from('evolutions').select('*').order('date', { ascending: false });
    if (eData) setEvolutions(eData.map(e => ({ ...e, patientId: e.patient_id, doctorName: e.doctor_name, doctorCrm: e.doctor_crm })));
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    } else {
      setPatients([]);
      setPrescriptions([]);
      setMedications([]);
      setEvolutions([]);
    }
  }, [currentUser]);

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
  // CRUD Helpers
  const addPatient = async (newPatient: Omit<Patient, 'id'>) => {
    if (!currentUser) return;

    // Sanitize birthDate: empty string should be null for Date column
    const birthDate = newPatient.birthDate ? newPatient.birthDate : null;

    const { data, error } = await supabase.from('patients').insert([{
      user_id: currentUser.id,
      name: newPatient.name,
      cpf: newPatient.cpf,
      cns: newPatient.cns,
      phone: newPatient.phone,
      address: newPatient.address,
      birth_date: birthDate
    }]).select().single();

    if (error) {
      console.error("Error creating patient:", error);
      alert(`Erro ao criar paciente: ${error.message}`);
      return;
    }

    if (data) {
      const formatted = { ...data, birthDate: data.birth_date };
      setPatients(prev => [formatted, ...prev]);
      setIsAddingPatient(false);
      return formatted; // Although async, some callers might wait
    }
  };

  const updatePatient = async (updatedPatient: Patient) => {
    const { error } = await supabase.from('patients').update({
      name: updatedPatient.name,
      cpf: updatedPatient.cpf,
      cns: updatedPatient.cns,
      phone: updatedPatient.phone,
      address: updatedPatient.address,
      birth_date: updatedPatient.birthDate
    }).eq('id', updatedPatient.id);

    if (!error) {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    }
  };

  const deletePatient = async (id: string) => {
    if (confirm('Deseja excluir permanentemente este paciente?')) {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (!error) {
        setPatients(prev => prev.filter(p => p.id !== id));
        // Also cascade locally if needed, but DB handles cascade delete
        setPrescriptions(prev => prev.filter(p => p.patientId !== id));
        setEvolutions(prev => prev.filter(e => e.patientId !== id));
      }
    }
  };

  const savePrescription = async (prescription: Omit<Prescription, 'id'>) => {
    if (!currentUser) throw new Error("Usuário não autenticado.");

    // Always insert a new prescription (allow multiple per day)
    const { data: inserted, error: insertError } = await supabase.from('prescriptions').insert([{
      user_id: currentUser.id,
      patient_id: prescription.patientId,
      date: prescription.date,
      items: prescription.items,
      usage_type: prescription.usageType,
      location: prescription.location,
      doctor_name: prescription.doctorName,
      doctor_crm: prescription.doctorCrm
    }]).select().single();

    if (insertError) throw insertError;

    // Refresh all data to ensure consistency across views (Patients History, etc)
    await fetchAllData();

    // Auto-add medications if not exist is handled below...
    /* ... existing duplicate medication check code continues ... */

    // Auto-add medications if not exist
    // Use a Set to track existing names (normalized) to catch duplicates effectively
    const existingNames = new Set(medications.map(m => m.name.trim().toLowerCase()));

    for (const item of prescription.items) {
      if (!item.name) continue;

      const normalizedName = item.name.trim().toLowerCase();

      // 1. Check local batch cache first
      if (existingNames.has(normalizedName)) continue;

      // 2. Check Database (Source of Truth) to avoid duplicates from stale state
      const { data: dbExisting } = await supabase
        .from('medications')
        .select('id')
        .ilike('name', item.name.trim())
        .maybeSingle();

      if (dbExisting) {
        existingNames.add(normalizedName); // Add to cache so we don't query again
        continue;
      }

      // 3. If not found, insert
      if (!existingNames.has(normalizedName)) {
        await addMedication({
          name: item.name.trim(), // Save with original casing but trimmed
          description: item.dosage,
          category: 'Geral',
          form: 'Outro',
          stock: 0,
          price: 0,
          status: 'Estoque Baixo'
        });

        // 4. Update local cache
        existingNames.add(normalizedName);
      }
    }
  };

  const updateMedication = async (med: Medication) => {
    const { error } = await supabase.from('medications').update(med).eq('id', med.id);
    if (!error) setMedications(prev => prev.map(m => m.id === med.id ? med : m));
  };

  const addMedication = async (med: Omit<Medication, 'id'>) => {
    if (!currentUser) return;
    const { data } = await supabase.from('medications').insert([{ ...med, user_id: currentUser.id }]).select().single();
    if (data) setMedications(prev => [...prev, data]);
  };

  const deleteMedication = async (id: string) => {
    if (confirm('Deseja remover este item do estoque?')) {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (!error) setMedications(prev => prev.filter(m => m.id !== id));
    }
  };

  const saveEvolution = async (evolution: Omit<Evolution, 'id'>) => {
    if (!currentUser) return;
    const { data } = await supabase.from('evolutions').insert([{
      user_id: currentUser.id,
      patient_id: evolution.patientId,
      date: evolution.date,
      content: evolution.content,
      doctor_name: evolution.doctorName,
      doctor_crm: evolution.doctorCrm
    }]).select().single();

    if (data) {
      setEvolutions(prev => [{ ...data, patientId: data.patient_id, doctorName: data.doctor_name, doctorCrm: data.doctor_crm }, ...prev]);
    }
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
                  { label: 'Pacientes', value: patients.length, icon: 'group', color: 'blue', target: ViewType.PATIENTS },
                  { label: 'Prescrições', value: prescriptions.length, icon: 'description', color: 'indigo', target: ViewType.PRESCRIPTIONS },
                  { label: 'Medicamentos', value: medications.length, icon: 'medication', color: 'teal', target: ViewType.MEDICATIONS },
                  { label: 'Alertas', value: medications.filter(m => m.stock < 20).length, icon: 'warning', color: 'rose', target: ViewType.MEDICATIONS, filter: true },
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
              prescriptions={prescriptions}
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
