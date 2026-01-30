
export enum ViewType {
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  PRESCRIPTIONS = 'PRESCRIPTIONS',
  MEDICATIONS = 'MEDICATIONS',
  PROFILE = 'PROFILE'
}

export interface Patient {
  id: string;
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
  patientId: string;
  date: string;
  content: string;
  doctorName: string;
  doctorCrm: string;
}
