
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Patient, Prescription, Medication, Evolution, Profile, Clinic, ViewType } from '../types';

export const useClinicData = (currentUser: any, currentView: ViewType, setCurrentView: (v: ViewType) => void) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [evolutions, setEvolutions] = useState<Evolution[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [activeClinicId, setActiveClinicId] = useState<string | null>(localStorage.getItem('medsys_active_clinic'));
    const [loading, setLoading] = useState(false);

    const activeClinic = clinics.find(c => c.id === activeClinicId) || null;

    const fetchAllData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);

        try {
            // 1. Fetch Clinics first
            const { data: cData } = await supabase
                .from('clinics')
                .select('*')
                .order('name', { ascending: true });

            if (cData && cData.length > 0) {
                setClinics(cData);

                if (!activeClinicId || !cData.find(c => c.id === activeClinicId)) {
                    const firstClinicId = cData[0].id;
                    setActiveClinicId(firstClinicId);
                    localStorage.setItem('medsys_active_clinic', firstClinicId);
                }
            } else {
                // Check for pending clinic join
                const { data: { user } } = await supabase.auth.getUser();
                const pendingCode = user?.user_metadata?.clinic_code;

                if (pendingCode) {
                    const joined = await joinClinic(pendingCode);
                    if (joined) {
                        const { data: newClinics } = await supabase.from('clinics').select('*');
                        if (newClinics && newClinics.length > 0) {
                            setClinics(newClinics);
                            setActiveClinicId(newClinics[0].id);
                            return;
                        }
                    }
                }

                setClinics([]);
                if (currentView !== ViewType.PROFILE) {
                    setCurrentView(ViewType.ONBOARDING);
                }
            }

            // 2. Fetch Clinical Data
            const currentClinicId = activeClinicId || (cData && cData.length > 0 ? cData[0].id : null);

            if (currentClinicId) {
                const { data: pData } = await supabase.from('patients').select('*').eq('clinic_id', currentClinicId).order('created_at', { ascending: false });
                if (pData) setPatients(pData.map(p => ({ ...p, birthDate: p.birth_date })));

                const { data: mData } = await supabase.from('medications').select('*').eq('clinic_id', currentClinicId).order('name', { ascending: true });
                if (mData) setMedications(mData);

                const { data: prData } = await supabase.from('prescriptions').select('*').eq('clinic_id', currentClinicId).order('date', { ascending: false });
                if (prData) setPrescriptions(prData.map(pr => ({ ...pr, patientId: pr.patient_id, usageType: pr.usage_type, doctorName: pr.doctor_name, doctorCrm: pr.doctor_crm })));

                const { data: eData } = await supabase.from('evolutions').select('*').eq('clinic_id', currentClinicId).order('date', { ascending: false });
                if (eData) setEvolutions(eData.map(e => ({ ...e, patientId: e.patient_id, doctorName: e.doctor_name, doctorCrm: e.doctor_crm })));
            } else {
                setPatients([]);
                setMedications([]);
                setPrescriptions([]);
                setEvolutions([]);
                if (currentView !== ViewType.PROFILE) {
                    setCurrentView(ViewType.ONBOARDING);
                }
            }

            // 3. Fetch Profile
            let { data: profData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();

            if (profData) {
                setProfile(profData as Profile);

                if (profData.role === 'admin') {
                    const { data: allProfData } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
                    if (allProfData) setAllProfiles(allProfData as Profile[]);
                }
            }
        } catch (error: any) {
            console.error("Error fetching clinical data:", error);
            // alert(`Erro ao carregar dados: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeClinicId, currentView, setCurrentView]);

    useEffect(() => {
        if (currentUser) {
            fetchAllData();
        }
    }, [currentUser, activeClinicId, fetchAllData]);

    // CRUD Helpers
    const addPatient = async (newPatient: Omit<Patient, 'id' | 'clinic_id'>) => {
        if (!currentUser) {
            alert("Erro: Usuário não autenticado.");
            return;
        }
        if (!activeClinicId) {
            alert("Erro: Nenhuma clínica selecionada. Selecione ou crie uma clínica para continuar.");
            return;
        }
        const { data, error } = await supabase.from('patients').insert([{
            user_id: currentUser.id,
            clinic_id: activeClinicId,
            name: newPatient.name,
            cpf: newPatient.cpf,
            cns: newPatient.cns,
            phone: newPatient.phone,
            address: newPatient.address,
            birth_date: newPatient.birthDate
        }]).select().single();

        if (error) {
            alert(`Erro ao criar paciente: ${error.message}`);
            return;
        }

        if (data) {
            const formatted = { ...data, birthDate: data.birth_date };
            setPatients(prev => [formatted, ...prev]);
            return formatted;
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
                setPrescriptions(prev => prev.filter(p => p.patientId !== id));
                setEvolutions(prev => prev.filter(e => e.patientId !== id));
            }
        }
    };

    const addMedication = async (med: Omit<Medication, 'id' | 'clinic_id'>) => {
        if (!currentUser || !activeClinicId) return;
        const { data } = await supabase.from('medications').insert([{
            ...med,
            user_id: currentUser.id,
            clinic_id: activeClinicId
        }]).select().single();
        if (data) setMedications(prev => [...prev, data]);
    };

    const savePrescription = async (prescription: Omit<Prescription, 'id' | 'clinic_id'>) => {
        if (!currentUser || !activeClinicId) throw new Error("Usuário não autenticado ou clínica não selecionada.");

        const { data: inserted, error: insertError } = await supabase.from('prescriptions').insert([{
            user_id: currentUser.id,
            clinic_id: activeClinicId,
            patient_id: prescription.patientId,
            date: prescription.date,
            items: prescription.items,
            usage_type: prescription.usageType,
            location: prescription.location,
            doctor_name: prescription.doctorName,
            doctor_crm: prescription.doctorCrm
        }]).select().single();

        if (insertError) throw insertError;

        await fetchAllData();

        // Auto-add medications logic
        const existingNames = new Set(medications.map(m => m.name.trim().toLowerCase()));
        for (const item of prescription.items) {
            if (!item.name) continue;
            const normalizedName = item.name.trim().toLowerCase();
            if (existingNames.has(normalizedName)) continue;

            const { data: dbExisting } = await supabase.from('medications').select('id').ilike('name', item.name.trim()).maybeSingle();
            if (dbExisting) {
                existingNames.add(normalizedName);
                continue;
            }

            await addMedication({
                name: item.name.trim(),
                description: item.dosage,
                category: 'Geral',
                form: 'Outro',
                stock: 0,
                price: 0,
                status: 'Estoque Baixo'
            });
            existingNames.add(normalizedName);
        }
    };

    const updateMedication = async (med: Medication) => {
        const { error } = await supabase.from('medications').update(med).eq('id', med.id);
        if (!error) setMedications(prev => prev.map(m => m.id === med.id ? med : m));
    };

    const deleteMedication = async (id: string) => {
        if (confirm('Deseja remover este item do estoque?')) {
            const { error } = await supabase.from('medications').delete().eq('id', id);
            if (!error) setMedications(prev => prev.filter(m => m.id !== id));
        }
    };

    const saveEvolution = async (evolution: Omit<Evolution, 'id' | 'clinic_id'>) => {
        if (!currentUser || !activeClinicId) return;
        const { data } = await supabase.from('evolutions').insert([{
            user_id: currentUser.id,
            clinic_id: activeClinicId,
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

    const updateProfile = async (updated: Profile) => {
        const { error } = await supabase.from('profiles').update(updated).eq('id', updated.id);
        if (!error) {
            if (updated.id === currentUser?.id) setProfile(updated);
            setAllProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
        }
    };

    const updateProfileRole = async (userId: string, newRole: 'admin' | 'user') => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) {
            setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
            if (userId === currentUser?.id) setProfile(prev => prev ? { ...prev, role: newRole } : null);
        }
    };

    const updateClinic = async (updated: Clinic) => {
        const { error } = await supabase.from('clinics').update({
            name: updated.name,
            email: updated.email,
            phones: updated.phones,
            address: updated.address,
            cnpj: updated.cnpj,
            logo_url: updated.logo_url
        }).eq('id', updated.id);

        if (!error) {
            setClinics(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
    };

    const addClinic = async (clinic: Omit<Clinic, 'id'>) => {
        if (!currentUser) return;
        const { data, error } = await supabase.from('clinics').insert([{
            ...clinic,
            user_id: currentUser.id
        }]).select().single();

        if (data) {
            setClinics(prev => [...prev, data]);
            if (!activeClinicId) {
                setActiveClinicId(data.id);
                localStorage.setItem('medsys_active_clinic', data.id);
            }
            await supabase.from('profile_clinics').insert([{
                profile_id: currentUser.id,
                clinic_id: data.id,
                role: 'admin'
            }]);
            return data;
        }
        if (error) alert(`Erro ao criar clínica: ${error.message}`);
    };

    const joinClinic = async (clinicId: string): Promise<boolean> => {
        if (!currentUser) return false;
        const { data: clinicData } = await supabase.from('clinics').select('id').eq('id', clinicId).maybeSingle();
        if (!clinicData) return false;

        const { error } = await supabase.from('profile_clinics').insert([{
            profile_id: currentUser.id,
            clinic_id: clinicId,
            role: 'user'
        }]);

        if (!error) {
            await fetchAllData();
            return true;
        }
        return false;
    };

    const uploadClinicLogo = async (file: File, clinicId: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${clinicId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('medsys-storage')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('medsys-storage')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            alert(`Erro ao carregar imagem: ${error.message}.`);
            return null;
        }
    };

    return {
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
        loading,
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
        uploadClinicLogo,
        refresh: fetchAllData
    };
};
