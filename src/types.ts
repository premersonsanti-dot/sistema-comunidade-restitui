
export enum ViewType {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  PRESCRIPTIONS = 'PRESCRIPTIONS',
  MEDICATIONS = 'MEDICATIONS',
  PROFILE = 'PROFILE',
  ONBOARDING = 'ONBOARDING'
}

export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phones?: string;
  address?: string;
  logo_url?: string;
  user_id?: string;
}

export interface ClinicMembership {
  id: string;
  profile_id: string;
  clinic_id: string;
  role: 'admin' | 'user';
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  cns: string;
  birthDate: string;
  cpf: string;
  address: string;
  phone: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
}

export interface Prescription {
  id: string;
  clinic_id: string;
  patientId: string;
  date: string;
  location: string;
  usageType: 'Oral' | 'Contínuo' | 'Tópico';
  items: PrescriptionItem[];
  doctorName?: string;
  doctorCrm?: string;
}

export interface Medication {
  id: string;
  clinic_id: string;
  name: string;
  description: string;
  category: string;
  form: string;
  stock: number;
  price: number;
  status: 'Em Estoque' | 'Estoque Baixo' | 'Pedido Solicitado';
}

export interface HistoryEvent {
  id: string;
  type: 'Prescrição' | 'Exame' | 'Nota' | 'Evolução';
  date: string;
  title: string;
  description: string;
  status?: string;
  details?: string[];
}

export interface Evolution {
  id: string;
  clinic_id: string;
  patientId: string;
  date: string;
  content: string;
  doctorName: string;
  doctorCrm: string;
}

export type ProfessionType = 'Médico' | 'Enfermeiro' | 'Psicólogo' | 'Terapeuta' | 'Outro';
export type RoleType = 'admin' | 'user';

export interface Profile {
  id: string;
  full_name: string;
  profession: ProfessionType;
  council_type: string;
  council_number: string;
  specialty: string;
  signature_url?: string;
  role: RoleType;
}

// Deprecated in favor of Clinic
export interface ClinicSettings {
  id: string;
  name: string;
  email: string;
  phones: string;
  address: string;
  cnpj: string;
  logo_url?: string;
}
