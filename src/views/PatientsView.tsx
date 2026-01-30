
import React, { useState, useEffect } from 'react';
import { Patient, Prescription, Evolution } from '../types';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { PrescriptionDocument } from '../components/PrescriptionDocument';
import { EvolutionDocument } from '../components/EvolutionDocument';

interface PatientsViewProps {
  patients: Patient[];
  prescriptions: Prescription[];
  onAddPatient: (patient: Omit<Patient, 'id'>) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  isInitialFormOpen?: boolean;
  onCloseForm?: () => void;
  onNewPrescription: (patient: Patient) => void;
  onRepeatPrescription: (prescription: Prescription) => void;
  onSaveEvolution: (evolution: Omit<Evolution, 'id'>) => void;
  evolutions: Evolution[];
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  prescriptions,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  isInitialFormOpen = false,
  onCloseForm,
  onNewPrescription,
  onRepeatPrescription,
  onSaveEvolution,
  evolutions
}) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(isInitialFormOpen);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    name: '', cpf: '', phone: '', birthDate: '', cns: '', address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos os Registros');
  const [viewingPrescription, setViewingPrescription] = useState<any>(null); // For modal visualization
  const [printingPrescription, setPrintingPrescription] = useState<any>(null); // For printing

  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [evolutionContent, setEvolutionContent] = useState('');
  const [viewingEvolution, setViewingEvolution] = useState<any>(null);
  const [printingEvolution, setPrintingEvolution] = useState<any>(null);

  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('medsys_doctor_name') || '');
  const [doctorCrm, setDoctorCrm] = useState(() => localStorage.getItem('medsys_doctor_crm') || '');

  useEffect(() => {
    if (isInitialFormOpen) setIsModalOpen(true);
  }, [isInitialFormOpen]);

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingPatientId(null);
    if (onCloseForm) onCloseForm();
    setFormData({ name: '', cpf: '', phone: '', birthDate: '', cns: '', address: '' });
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setFormData({
      name: patient.name,
      cpf: patient.cpf,
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      cns: patient.cns || '',
      address: patient.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('DETAILS');
  };

  const handleBackToList = () => {
    setViewMode('LIST');
    setSelectedPatient(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf) return;

    if (editingPatientId) {
      onUpdatePatient({ ...formData, id: editingPatientId });
    } else {
      onAddPatient(formData);
    }
    handleClose();
  };

  // Helper to calculate age
  const getAge = (dateString?: string) => {
    if (!dateString) return '--';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- DETAIL VIEW RENDERER ---
  const renderDetails = () => {
    if (!selectedPatient) return null;

    const patientPrescriptions = prescriptions.filter(p => p.patientId === selectedPatient.id);

    // Mocking some other history events (Exams) for the visual demo
    const mockEvents = [
      ...patientPrescriptions.map(p => ({
        id: p.id,
        type: 'Prescrição',
        date: p.date,
        title: `Prescrição #${p.id.slice(-4)}`,
        status: new Date(p.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'Ativo' : 'Expirado',
        details: p.items.map(i => `${i.name} ${i.dosage} - ${i.quantity}`),
        usageType: p.usageType,
        doctorName: p.doctorName,
        doctorCrm: p.doctorCrm
      })),
      ...evolutions.filter(e => e.patientId === selectedPatient.id).map(e => ({
        id: e.id,
        type: 'Evolução',
        date: e.date,
        title: 'Evolução Clínica',
        status: 'Registrado',
        details: [e.content.length > 100 ? e.content.substring(0, 100) + '...' : e.content],
        doctorName: e.doctorName,
        doctorCrm: e.doctorCrm,
        fullContent: e.content
      })),
      {
        id: 'exam-1',
        type: 'Exame',
        date: '2025-12-12',
        title: 'Resultados de Exames',
        status: 'Concluído',
        details: ['Hemograma Completo', 'Perfil Lipídico']
      },
      {
        id: 'note-1',
        type: 'Anotação',
        date: '2025-12-10',
        title: 'Anotação Clínica (Evolução)',
        status: 'Registrado',
        details: ['Paciente apresenta melhora significativa no quadro de dor.', 'Mantida a medicação atual.']
      }
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredEvents = activeTab === 'Todos os Registros'
      ? mockEvents
      : mockEvents.filter(e => {
        if (activeTab === 'Prescrições') return e.type === 'Prescrição';
        if (activeTab === 'Resultados de Exames') return e.type === 'Exame';
        if (activeTab === 'Anotações Clínicas') return e.type === 'Anotação' || e.type === 'Evolução';
        return true;
      });

    return (
      <div className="flex h-full gap-6 p-6 bg-slate-100 overflow-hidden">
        {/* LEFT SIDEBAR - PROFILE */}
        <div className="w-[340px] bg-[#0F2640] rounded-[32px] p-8 text-white flex flex-col shrink-0 shadow-2xl relative overflow-hidden">
          {/* Decorative Background Circle */}
          <div className="absolute -right-20 -top-20 size-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-slate-200 text-[#0F2640] flex items-center justify-center font-bold text-2xl">
                {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">{selectedPatient.name}</h2>
                <p className="text-slate-400 text-xs mt-1">{getAge(selectedPatient.birthDate)} anos • --</p>
              </div>
            </div>
            <button onClick={() => handleEditClick(selectedPatient)} className="text-slate-400 hover:text-white transition-colors">
              <span className="material-icons-round">edit</span>
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">CNS (Cartão Nacional de Saúde)</p>
              <p className="font-medium text-lg">{selectedPatient.cns || '--'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">CPF</p>
                <p className="font-medium text-sm">{selectedPatient.cpf}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Telefone</p>
                <p className="font-medium text-sm">{selectedPatient.phone || '--'}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Endereço</p>
              <p className="font-medium text-sm leading-relaxed text-slate-300">{selectedPatient.address || '--'}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex gap-3 relative z-10">
            <button onClick={() => onNewPrescription(selectedPatient)} className="flex-1 bg-primary hover:bg-primary-dark text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
              <span className="material-icons-round text-base">add</span> Nova Prescrição
            </button>
            <button onClick={handleBackToList} className="size-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" title="Voltar para lista">
              <span className="material-icons-round">folder_open</span>
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT - TIMELINE */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <button onClick={handleBackToList} className="md:hidden mr-2 text-slate-400"><span className="material-icons-round">arrow_back</span></button>
              Histórico e Prontuário
            </h1>
            <div className="flex gap-2">
              <div className="w-64 bg-white h-10 rounded-xl border border-slate-200 flex items-center px-3 shadow-sm">
                <span className="material-icons-round text-slate-400 text-lg mr-2">search</span>
                <input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Buscar registros..." />
              </div>
              <button onClick={() => { setEvolutionContent(''); setIsEvolutionModalOpen(true); }} className="h-10 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors shadow-sm">
                <span className="material-icons-round text-base">add_notes</span> Nova Evolução
              </button>
              <button className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-colors shadow-sm">
                <span className="material-icons-round">filter_list</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            {['Todos os Registros', 'Prescrições', 'Anotações Clínicas', 'Resultados de Exames'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
            {filteredEvents.map((event, idx) => (
              <div key={idx} className="flex gap-4 group">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className={`size-3 rounded-full border-2 ${idx === 0 ? 'bg-primary border-primary' : 'bg-slate-300 border-slate-300'} z-10`} />
                  {idx !== mockEvents.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                </div>

                <div className="flex-1 pb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                        {event.type === 'Prescrição' && <p className="text-sm text-slate-500 mt-0.5">Diagnóstico: -- (Não informado)</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${event.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                        event.status === 'Concluído' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {event.status}
                      </span>
                    </div>

                    {event.details && (
                      <ul className="space-y-2 mb-6">
                        {event.details.map((detail: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                      {event.type === 'Prescrição' && (
                        <>
                          <button
                            onClick={() => {
                              // Reconstruct prescription object from event for visualization
                              const presc = {
                                patient: selectedPatient,
                                items: event.details.map((d: string) => {
                                  // Very rough parsing for demo visualization from string details
                                  // Real implementation would pass full prescription object in event
                                  const parts = d.split(' - ');
                                  const subParts = parts[0].split(' ');
                                  const quantity = parts[1] || '';
                                  const dosage = subParts.pop() || '';
                                  const name = subParts.join(' ');
                                  return { name, dosage, quantity };
                                }),
                                usageType: event.usageType,
                                doctorName: (event as any).doctorName,
                                doctorCrm: (event as any).doctorCrm,
                                location: 'Caraguatatuba', // Mock
                                date: event.date
                              };
                              setViewingPrescription(presc);
                            }}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <span className="material-icons-round text-sm">visibility</span> Visualizar
                          </button>
                          <button
                            onClick={() => {
                              const presc = prescriptions.find(p => p.id === event.id);
                              if (presc) onRepeatPrescription(presc);
                            }}
                            className="text-slate-500 text-xs font-bold flex items-center gap-1 hover:text-slate-800 transition-colors"
                          >
                            <span className="material-icons-round text-sm">replay</span> Repetir Prescrição
                          </button>
                          <button
                            onClick={() => {
                              // Reconstruct for printing
                              const presc = {
                                patient: selectedPatient,
                                items: event.details.map((d: string) => {
                                  const parts = d.split(' - ');
                                  const subParts = parts[0].split(' ');
                                  const quantity = parts[1] || '';
                                  const dosage = subParts.pop() || '';
                                  const name = subParts.join(' ');
                                  return { name, dosage, quantity };
                                }),
                                usageType: event.usageType,
                                doctorName: (event as any).doctorName,
                                doctorCrm: (event as any).doctorCrm,
                                location: 'Caraguatatuba',
                                date: event.date
                              };
                              setPrintingPrescription(presc);
                              setTimeout(() => {
                                window.print();
                                // Resetting immediately after print dialog opens/closes might be too fast, 
                                // but usually acts as cleanup.
                                setPrintingPrescription(null);
                              }, 100);
                            }}
                            className="ml-auto text-slate-400 text-xs font-bold flex items-center gap-1 hover:text-slate-600 transition-colors"
                          >
                            <span className="material-icons-round text-sm">print</span> Imprimir
                          </button>
                        </>
                      )}
                      {event.type === 'Evolução' && (
                        <>
                          <button
                            onClick={() => setViewingEvolution({
                              patient: selectedPatient,
                              content: (event as any).fullContent,
                              date: event.date,
                              doctorName: (event as any).doctorName,
                              doctorCrm: (event as any).doctorCrm
                            })}
                            className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                          >
                            <span className="material-icons-round text-sm">visibility</span> Visualizar
                          </button>
                          <button
                            onClick={() => {
                              setPrintingEvolution({
                                patient: selectedPatient,
                                content: (event as any).fullContent,
                                date: event.date,
                                doctorName: (event as any).doctorName,
                                doctorCrm: (event as any).doctorCrm
                              });
                              setTimeout(() => { window.print(); setPrintingEvolution(null); }, 100);
                            }}
                            className="ml-auto text-slate-400 text-xs font-bold flex items-center gap-1 hover:text-slate-600 transition-colors"
                          >
                            <span className="material-icons-round text-sm">print</span> Imprimir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400">Nenhum registro encontrado.</p>
              </div>
            )}

            <div className="text-center py-8">
              <p className="text-xs text-slate-300">Fim dos registros disponíveis online.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- LIST LIST RENDERER (Original modified) ---
  const renderList = () => (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Pacientes</h1>
          <p className="text-slate-500 text-sm mt-1">Total de {patients.length} pacientes cadastrados</p>
        </div>
        <button
          onClick={() => {
            setEditingPatientId(null);
            setFormData({ name: '', cpf: '', phone: '', birthDate: '', cns: '', address: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
        >
          <span className="material-icons-round text-lg">person_add</span> Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black tracking-widest text-slate-400 uppercase border-b bg-slate-50/50">
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">CPF / CNS</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-medium">Nenhum paciente encontrado</p>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleSelectPatient(p)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p className="font-medium">{p.cpf}</p>
                      <p className="text-[10px] text-slate-400">CNS: {p.cns || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {p.phone}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectPatient(p); }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100"
                      >
                        Prontuário
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(p); }}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <span className="material-icons-round text-lg">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePatient(p.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <span className="material-icons-round text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {viewMode === 'LIST' ? renderList() : renderDetails()}

      {/* Modal Cadastro/Edição de Paciente */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingPatientId ? 'Editar Paciente' : 'Cadastrar Paciente'}
        subtitle="Preencha os dados do prontuário"
        icon={editingPatientId ? 'edit' : 'person_add'}
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CPF"
                required
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
              />
              <Input
                label="Data Nasc."
                required
                type="date"
                value={formData.birthDate}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Telefone"
                type="text"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="CNS (Opcional)"
                type="text"
                value={formData.cns}
                onChange={e => setFormData({ ...formData, cns: e.target.value })}
              />
            </div>

            <Input
              label="Endereço"
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-12 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              {editingPatientId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE VISUALIZAÇÃO DE PRESCRIÇÃO */}
      {
        viewingPrescription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setViewingPrescription(null)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-icons-round text-slate-400">close</span>
              </button>
              <div className="flex justify-center">
                <PrescriptionDocument
                  patient={viewingPrescription.patient}
                  items={viewingPrescription.items}
                  usageType={viewingPrescription.usageType}
                  location={viewingPrescription.location}
                  date={viewingPrescription.date}
                  doctorName={viewingPrescription.doctorName}
                  doctorCrm={viewingPrescription.doctorCrm}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* FORMULÁRIO DE EVOLUÇÃO CLÍNICA */}
      <Modal
        isOpen={isEvolutionModalOpen}
        onClose={() => setIsEvolutionModalOpen(false)}
        title="Ficha de Evolução Clínica"
        subtitle={`Registrando evolução para ${selectedPatient?.name}`}
        icon="history_edu"
      >
        <div className="flex overflow-hidden h-[80vh] w-[90vw] max-w-6xl">
          {/* Left: Input */}
          <div className="w-1/2 p-8 border-r border-slate-100 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-white">
            <div className="flex-1 min-h-[300px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Conteúdo da Evolução</label>
              <textarea
                className="w-full h-[calc(100%-40px)] p-6 bg-slate-50 border-none rounded-2xl text-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none shadow-inner"
                placeholder="Descreva o estado clínico, evolução e conduta do paciente..."
                value={evolutionContent}
                onChange={(e) => setEvolutionContent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Médico Responsável</label>
                <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Conselho Profissional</label>
                <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xs font-bold" value={doctorCrm} onChange={e => setDoctorCrm(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                onClick={() => {
                  if (!evolutionContent) return;
                  onSaveEvolution({
                    patientId: selectedPatient?.id!,
                    date: new Date().toISOString().split('T')[0],
                    content: evolutionContent,
                    doctorName,
                    doctorCrm
                  });
                  setIsEvolutionModalOpen(false);
                  alert('Evolução salva!');
                }}
                className="flex-1 h-12 bg-primary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">save</span> Salvar
              </button>
              <button
                onClick={() => {
                  setPrintingEvolution({
                    patient: selectedPatient,
                    content: evolutionContent,
                    date: new Date().toISOString().split('T')[0],
                    doctorName,
                    doctorCrm
                  });
                  setTimeout(() => { window.print(); setPrintingEvolution(null); }, 100);
                }}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">print</span> Imprimir
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 bg-slate-100 p-8 overflow-y-auto hidden md:flex flex-col items-center custom-scrollbar">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center w-full">Pré-visualização do Documento</p>
            {selectedPatient && (
              <EvolutionDocument
                patient={selectedPatient}
                content={evolutionContent}
                date={new Date().toISOString().split('T')[0]}
                doctorName={doctorName}
                doctorCrm={doctorCrm}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL DE VISUALIZAÇÃO DE EVOLUÇÃO */}
      {viewingEvolution && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl p-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setViewingEvolution(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="material-icons-round text-slate-400">close</span>
            </button>
            <div className="flex justify-center">
              <EvolutionDocument
                patient={viewingEvolution.patient}
                content={viewingEvolution.content}
                date={viewingEvolution.date}
                doctorName={viewingEvolution.doctorName}
                doctorCrm={viewingEvolution.doctorCrm}
              />
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT DE IMPRESSÃO DE EVOLUÇÃO (ATIVADO SOB DEMANDA) */}
      {printingEvolution && (
        <>
          <style>
            {`
            @media print {
                @page { size: portrait; margin: 20mm; }
                body { margin: 0 !important; padding: 0 !important; }
                body > *:not(#root) { display: none !important; }
            }
            `}
          </style>
          <div className="hidden print:flex w-full min-h-screen fixed inset-0 bg-white z-[9999] items-start justify-center p-0 top-0 left-0">
            <EvolutionDocument
              patient={printingEvolution.patient}
              content={printingEvolution.content}
              date={printingEvolution.date}
              doctorName={printingEvolution.doctorName}
              doctorCrm={printingEvolution.doctorCrm}
              isPrintCopy
            />
          </div>
        </>
      )}
      {/* LAYOUT DE IMPRESSÃO DE PRESCRIÇÃO (ATIVADO SOB DEMANDA) */}
      {printingPrescription && (
        <div id="print-area">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px dashed #cbd5e1', padding: '16px', backgroundColor: 'white' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PrescriptionDocument
                patient={printingPrescription.patient}
                items={printingPrescription.items}
                usageType={printingPrescription.usageType}
                location={printingPrescription.location}
                date={printingPrescription.date}
                doctorName={printingPrescription.doctorName}
                doctorCrm={printingPrescription.doctorCrm}
                isPrintCopy
              />
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'white' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PrescriptionDocument
                patient={printingPrescription.patient}
                items={printingPrescription.items}
                usageType={printingPrescription.usageType}
                location={printingPrescription.location}
                date={printingPrescription.date}
                doctorName={printingPrescription.doctorName}
                doctorCrm={printingPrescription.doctorCrm}
                isPrintCopy
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
};
