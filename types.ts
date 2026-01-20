
export type PaymentMethod = 'PIX' | 'Boleto' | 'Cartão' | 'Transferência' | 'Dinheiro' | 'Certidão Estadual';
export type PaymentPlan = 'Upfront' | 'Installments' | 'OnSuccess' | 'DefensoriaStandard' | 'PrevidenciarioMix';
export type ClientOrigin = 'Particular' | 'Defensoria';
export type VoucherStatus = 'Aguardando Sentença' | 'Certidão Emitida' | 'Aguardando Recurso' | 'Pago pelo Estado' | 'Pendente';

export interface Installment {
  id: string;
  number: number;
  value: number;
  dueDate: string;
  paidAt?: string;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
}

export interface ClientFinancials {
  totalAgreed: number;
  initialPayment?: number;
  initialPaymentStatus?: 'pending' | 'paid';
  successFeePercentage?: number;
  successFeeStatus?: 'pending' | 'paid';
  benefitInstallmentsCount?: number; // Específico para Previdenciário
  method: PaymentMethod;
  plan: PaymentPlan;
  installments: Installment[];
  defensoriaVoucher70?: string;
  defensoriaStatus70?: VoucherStatus;
  defensoriaValue70?: number;
  defensoriaPaymentMonth70?: string;
  defensoriaVoucher30?: string;
  defensoriaStatus30?: VoucherStatus;
  defensoriaValue30?: number;
  defensoriaPaymentMonth30?: string;
  defensoriaVoucher100?: string;
  defensoriaStatus100?: VoucherStatus;
  defensoriaValue100?: number;
  defensoriaPaymentMonth100?: string;
  hasRecourse?: boolean;
  appointmentDate?: string;
  dueDay?: number;
  laborFinalValue?: number;
  laborPaymentDate?: string;
}

export interface Client {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  rg?: string;
  rgIssuingBody?: string;
  nationality?: string;
  birthDate?: string;
  maritalStatus?: string;
  profession?: string;
  monthlyIncome?: number;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  origin: ClientOrigin;
  caseNumber: string;
  caseType: string;
  caseDescription: string;
  status: 'Active' | 'Pending' | 'Closed';
  createdAt: string;
  financials?: ClientFinancials;
}

export interface CourtMovement {
  id: string;
  clientId?: string;
  caseNumber: string;
  date: string;
  time?: string;
  description: string;
  type: 'Audiência' | 'Deadline' | 'Notification';
  modality?: 'Online' | 'Presencial';
  source: string;
  syncedToGoogle?: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: any[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success';
  date: string;
  read: boolean;
}

export interface UserSettings {
  name: string;
  email: string;
  role: string;
  oab: string;
  oabState: string;
  cpf: string;
  address: string;
  profileImage?: string;
  logo?: string;
  notifyDeadlines: boolean;
  deadlineThresholdDays: number;
  googleConnected?: boolean;
  googleEmail?: string;
  googleToken?: string;
}

export enum AppSection {
  DASHBOARD = 'dashboard',
  CLIENTS = 'clients',
  FINANCES = 'finances',
  AGENDA = 'agenda',
  HEARINGS = 'audiencias',
  REPORTS = 'reports',
  SETTINGS = 'settings'
}

export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  hasAttachments: boolean;
  status: 'new' | 'processed';
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  entityType: 'CLIENT' | 'MOVEMENT' | 'PROFILE' | 'SYSTEM';
  entityId?: string;
  description: string;
  details?: any;
  createdAt: string;
}
