
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DOCTOR_INFO } from '../constants';
import { PrescriptionItem, Patient, Prescription, Medication } from '../types';
import { PrescriptionDocument } from '../components/PrescriptionDocument';
import { Modal } from '../components/Modal';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrescriptionViewProps {
  patients: Patient[];
  medications: Medication[];
  onAddPatient: (patient: Omit<Patient, 'id'>) => Promise<Patient | undefined>;
  onSavePrescription: (prescription: Omit<Prescription, 'id'>) => void | Promise<void>;
  initialPatient?: Patient | null;
  initialPrescription?: Prescription | null;
  prescriptions?: Prescription[];
}

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({ patients, medications, onAddPatient, onSavePrescription, initialPatient, initialPrescription, prescriptions = [] }) => {
  // Current Date Helper
  const today = new Date();
  const formattedToday = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const inputToday = today.toISOString().split('T')[0];

  const [patientData, setPatientData] = useState<Omit<Patient, 'id'>>({
    name: '', cpf: '', address: '', phone: '', birthDate: '', cns: ''
  });

  const [items, setItems] = useState<PrescriptionItem[]>([
    { id: '1', name: '', dosage: '', quantity: '' }
  ]);

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<{ itemId: string, index: number } | null>(null);
  const [usageType, setUsageType] = useState<'Oral' | 'Contínuo' | 'Tópico'>('Oral');
  const [issueLocation, setIssueLocation] = useState('Caraguatatuba');
  const [issueDate, setIssueDate] = useState(inputToday);
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('medsys_doctor_name') || DOCTOR_INFO.name);
  const [doctorCrm, setDoctorCrm] = useState(() => localStorage.getItem('medsys_doctor_crm') || DOCTOR_INFO.crm);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Expiring Prescriptions Logic
  const expiringPrescriptions = prescriptions.filter(p => {
    if (!p.date) return false;
    const date = parseISO(p.date);
    const expiryDate = addDays(date, 60);
    const daysUntil = differenceInDays(expiryDate, today);
    return daysUntil <= 7; // Expired or expiring within 7 days
  }).sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

  const handleRenew = (p: Prescription) => {
    setItems(p.items);
    setUsageType(p.usageType as any);
    setIssueLocation(p.location);
    // Find patient
    const pat = patients.find(patient => patient.id === p.patientId);
    if (pat) fillPatientData(pat);
    setIsAlertModalOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('medsys_doctor_name', doctorName);
  }, [doctorName]);

  useEffect(() => {
    localStorage.setItem('medsys_doctor_crm', doctorCrm);
  }, [doctorCrm]);

  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [activePatientIndex, setActivePatientIndex] = useState(0);

  // Helper to format date for display in signature
  const getSignatureDate = () => {
    if (!issueDate) return formattedToday;
    const [y, m, d] = issueDate.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (patientData.cpf.length >= 11) {
      const existing = patients.find(p => p.cpf.replace(/\D/g, '') === patientData.cpf.replace(/\D/g, ''));
      if (existing) {
        fillPatientData(existing);
      } else {
        // Only clear autofill flag, don't clear data user might be typing
        setIsAutoFilled(false);
      }
    }
  }, [patientData.cpf, patients]);

  const fillPatientData = (patient: Patient) => {
    setPatientData({
      name: patient.name,
      cpf: patient.cpf,
      address: patient.address || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      cns: patient.cns || ''
    });
    setIsAutoFilled(true);
  };

  useEffect(() => {
    if (initialPatient) {
      fillPatientData(initialPatient);
    }
  }, [initialPatient]);

  useEffect(() => {
    if (initialPrescription) {
      setItems(initialPrescription.items);
      setUsageType(initialPrescription.usageType as any);
      // If patient is not provided via initialPatient, try to find it
      if (!initialPatient) {
        const p = patients.find(pt => pt.id === initialPrescription.patientId);
        if (p) fillPatientData(p);
      }
    }
  }, [initialPrescription]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', dosage: '', quantity: '' }]);
  };

  const updateItem = (id: string, field: keyof PrescriptionItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (field === 'name') {
      setActiveSuggestionIndex(value.length > 1 ? { itemId: id, index: 0 } : null);
    }
  };

  const selectSuggestion = (itemId: string, med: Medication) => {
    setItems(items.map(item => item.id === itemId ? { ...item, name: med.name, dosage: med.description } : item));
    setActiveSuggestionIndex(null);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: string, itemName: string) => {
    if (activeSuggestionIndex?.itemId === itemId) {
      const filteredMeds = medications.filter(m => m.name.toLowerCase().includes(itemName.toLowerCase()));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => ({
          ...prev!,
          index: Math.min(prev!.index + 1, Math.max(0, filteredMeds.length - 1))
        }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => ({
          ...prev!,
          index: Math.max(prev!.index - 1, 0)
        }));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredMeds.length > 0 && activeSuggestionIndex.index >= 0) {
          e.preventDefault();
          selectSuggestion(itemId, filteredMeds[activeSuggestionIndex.index]);
        }
      } else if (e.key === 'Escape') {
        setActiveSuggestionIndex(null);
      }
    } else if (e.key === 'Enter') {
      // If Enter is pressed and no suggestion is active, just let it be or focus next
      // e.preventDefault(); // Optional: prevent accidental print
    }
  };

  const handleNameChange = (val: string) => {
    setPatientData({ ...patientData, name: val });
    setShowPatientSuggestions(val.length > 0);
    setActivePatientIndex(0);
  };

  const handlePatientKeyDown = (e: React.KeyboardEvent) => {
    if (showPatientSuggestions) {
      const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientData.name.toLowerCase()));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePatientIndex(prev => Math.min(prev + 1, Math.max(0, filteredPatients.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePatientIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredPatients.length > 0) {
          e.preventDefault();
          selectPatientSuggestion(filteredPatients[activePatientIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowPatientSuggestions(false);
      }
    }
  };

  const selectPatientSuggestion = (patient: Patient) => {
    fillPatientData(patient);
    setShowPatientSuggestions(false);
  };

  const handleNewPrescription = () => {
    setPatientData({ name: '', cpf: '', address: '', phone: '', birthDate: '', cns: '' });
    setItems([{ id: Date.now().toString(), name: '', dosage: '', quantity: '' }]);
    setUsageType('Oral');
    setIsAutoFilled(false);
  };

  const processSave = async (): Promise<boolean> => {
    let targetPatientId = '';
    const existing = patients.find(p => p.cpf.replace(/\D/g, '') === patientData.cpf.replace(/\D/g, ''));

    if (!existing && patientData.name && patientData.cpf) {
      // Use the newly created patient's ID
      const newPatient = await onAddPatient(patientData);
      if (newPatient) {
        targetPatientId = newPatient.id;
      } else {
        alert("Erro ao cadastrar paciente automaticamente. Tente cadastrá-lo manualmente na tela de Pacientes.");
        return false;
      }
    } else if (existing) {
      targetPatientId = existing.id;
    }

    if (!targetPatientId) {
      alert("Erro fatal: Identificação do paciente falhou. Não é possível salvar a prescrição sem um paciente vinculado.");
      return false;
    }

    try {
      await onSavePrescription({
        patientId: targetPatientId,
        date: issueDate,
        location: issueLocation,
        usageType,
        items: items.filter(item => item.name.trim() !== ''),
        doctorName,
        doctorCrm
      });
      return true;
    } catch (error) {
      console.error("Error saving prescription:", error);
      alert("Erro ao salvar prescrição. Verifique o console ou tente novamente.");
      return false;
    }
  };

  const handlePrint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patientData.name || !patientData.cpf) {
      alert('Por favor, preencha o nome e CPF do paciente.');
      return;
    }
    const success = await processSave();
    if (success) {
      setTimeout(() => {
        window.print();
      }, 150);
    }
  };

  const handleSaveOnly = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!patientData.name || !patientData.cpf) {
      alert('Por favor, preencha o nome e CPF do paciente.');
      return;
    }
    const success = await processSave();
    if (success) {
      alert('Prescrição salva com sucesso!');
    }
  };

  // --- PRESCRIPTION CARD RENDERER ---
  const renderPrescriptionCard = (isPrintCopy = false) => (
    <PrescriptionDocument
      patient={patientData}
      items={items.filter(i => i.name)}
      usageType={usageType}
      location={issueLocation}
      date={issueDate}
      doctorName={doctorName}
      doctorCrm={doctorCrm}
      isPrintCopy={isPrintCopy}
    />
  );

  return (
    <>
      {/* PRINT LAYOUT - Hidden on screen via CSS, visible on print */}
      <div id="print-area">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px dashed #cbd5e1', padding: '16px', backgroundColor: 'white' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderPrescriptionCard(true)}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'white' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderPrescriptionCard(true)}
          </div>
        </div>
      </div>

      {/* SCREEN LAYOUT (Hidden on print) */}
      <div className="flex-1 flex overflow-hidden bg-slate-50 print:hidden">
        {/* LEFT COLUMN - FORM */}
        <div className="w-1/2 bg-white flex flex-col border-r border-slate-200 overflow-y-auto custom-scrollbar no-print p-8">
          <div className="flex justify-between items-center mb-8 mt-2">
            <h2 className="text-xl font-bold text-slate-900">Sistema de Prescrição Médica</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
              >
                <span className="material-icons-round text-sm text-amber-500">warning</span>
                Alertas
                {expiringPrescriptions.length > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse shadow-sm border border-white">
                    {expiringPrescriptions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleNewPrescription}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              >
                <span className="material-icons-round text-sm">add</span> Nova Receita
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handlePrint}>
            {/* Section: Dados do Paciente */}
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
                <span className="material-icons-round text-base">person_outline</span> Dados do Paciente
              </h3>

              <div className="space-y-4">
                {/* Nome */}
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome Completo *</label>
                  <input
                    required placeholder="Nome do paciente"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    value={patientData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={handlePatientKeyDown}
                    onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 200)}
                    autoComplete="off"
                  />
                  {showPatientSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                      {patients
                        .filter(p => p.name.toLowerCase().includes(patientData.name.toLowerCase()))
                        .map((p, idx) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectPatientSuggestion(p);
                            }}
                            className={`w-full text-left p-3 hover:bg-primary/5 border-b border-slate-50 last:border-0 flex justify-between items-center group ${activePatientIndex === idx ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                          >
                            <div>
                              <p className={`text-sm font-bold ${activePatientIndex === idx ? 'text-primary' : 'text-slate-800'} group-hover:text-primary`}>{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.cpf || 'Sem CPF'}</p>
                            </div>
                            <span className={`material-icons-round text-sm ${activePatientIndex === idx ? 'text-primary' : 'text-slate-300'} group-hover:text-primary`}>north_west</span>
                          </button>
                        ))}
                      {patients.filter(p => p.name.toLowerCase().includes(patientData.name.toLowerCase())).length === 0 && (
                        <div className="p-3 text-xs text-slate-400 text-center italic">Nenhum paciente encontrado</div>
                      )}
                    </div>
                  )}
                </div>

                {/* CNS */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CNS (Cartão Nacional de Saúde)</label>
                  <input
                    placeholder="000.0000.0000.0000"
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    value={patientData.cns} onChange={(e) => setPatientData({ ...patientData, cns: e.target.value })}
                  />
                </div>

                {/* Data Nascimento & CPF */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data de Nascimento</label>
                    <input
                      type="date"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-600"
                      value={patientData.birthDate} onChange={(e) => setPatientData({ ...patientData, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CPF</label>
                    <input
                      required placeholder="000.000.000-00"
                      className={`w-full h-12 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all ${isAutoFilled ? 'bg-blue-50/50 text-blue-800 font-medium' : 'bg-slate-50'}`}
                      value={patientData.cpf} onChange={(e) => setPatientData({ ...patientData, cpf: e.target.value })}
                    />
                  </div>
                </div>

                {/* Local de Emissão */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Local de Emissão</label>
                  <input
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none font-medium text-slate-800"
                    value={issueLocation} onChange={(e) => setIssueLocation(e.target.value)}
                  />
                </div>

                {/* Endereço & Telefone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Endereço</label>
                    <input
                      placeholder="Endereço completo"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={patientData.address} onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Telefone</label>
                    <input
                      placeholder="(00) 00000-0000"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={patientData.phone} onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Data de Emissão */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data de Emissão</label>
                  <input
                    type="date"
                    className="w-1/2 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-700"
                    value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>

                {/* Tipo de Uso - Radio Buttons */}
                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Uso</label>
                  <div className="flex flex-col gap-2">
                    {(['Oral', 'Contínuo', 'Tópico'] as const).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          setUsageType(type);
                        }}
                      >
                        <div className={`size-5 rounded-full border flex items-center justify-center transition-all ${usageType === type ? 'border-primary bg-primary' : 'border-slate-300 bg-white group-hover:border-primary'}`}>
                          {usageType === type && <div className="size-2 rounded-full bg-white" />}
                        </div>
                        <input type="radio" className="hidden" value={type} checked={usageType === type} readOnly />
                        <span className={`text-sm ${usageType === type ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>Uso {type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dados do Médico */}
              <div className="pt-4 border-t border-slate-100 mt-6">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
                  <span className="material-icons-round text-base">medical_services</span> Informações do Médico
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome do Médico</label>
                    <input
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CRM do Médico</label>
                    <input
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={doctorCrm} onChange={(e) => setDoctorCrm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="h-px bg-slate-100 my-6" />

            <button type="button" onClick={addItem} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm">
              Adicionar Medicamento
            </button>

            {items.map((item, index) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Medicamento {index + 1}</span>
                  {items.length > 1 && <button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-colors"><span className="material-icons-round text-base">delete</span></button>}
                </div>
                <div className="relative">
                  <input
                    required placeholder="Nome do Medicamento"
                    className="w-full bg-white rounded-xl border-slate-200 text-sm p-3 focus:ring-primary outline-none text-slate-700"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    onKeyDown={(e) => handleItemKeyDown(e, item.id, item.name)}
                    onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 200)}
                  />
                  {activeSuggestionIndex?.itemId === item.id && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                      {medications.filter(m => m.name.toLowerCase().includes(item.name.toLowerCase())).map((m, idx) => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSuggestion(item.id, m);
                          }}
                          className={`w-full text-left p-3 hover:bg-primary/5 border-b border-slate-50 last:border-0 flex justify-between items-center ${activeSuggestionIndex?.index === idx ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                        >
                          <span className={`text-sm font-bold ${activeSuggestionIndex?.index === idx ? 'text-primary' : 'text-slate-800'}`}>{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{m.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Dosagem / Frequência" className="w-full bg-white rounded-xl border-slate-200 text-sm p-3 outline-none" value={item.dosage} onChange={(e) => updateItem(item.id, 'dosage', e.target.value)} />
                  <input placeholder="Quantidade" className="w-full bg-white rounded-xl border-slate-200 text-sm p-3 outline-none" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                </div>
              </div>
            ))}

            <div className="pt-4 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleSaveOnly}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">save</span> Salvar rascunho
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">print</span> Imprimir
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN - PREVIEW */}
        <div className="w-1/2 flex flex-col p-8 overflow-y-auto bg-slate-100 items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400 mb-6 font-bold text-sm">
            <span className="material-icons-round">print</span> Pré-visualização
          </div>

          {renderPrescriptionCard()}
        </div>
      </div>
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
                          onClick={() => handleRenew(p)}
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
    </>
  );
};
