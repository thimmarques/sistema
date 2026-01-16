
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, Client, CourtMovement, AppNotification, UserSettings } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import Agenda from './components/Agenda';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Finances from './components/Finances';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [clients, setClients] = useState<Client[]>([]);
  const [movements, setMovements] = useState<CourtMovement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    role: 'Advogado',
    oab: '',
    cpf: '',
    address: '',
    profileImage: '',
    logo: '',
    notifyDeadlines: true,
    deadlineThresholdDays: 3
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        const initialClients: Client[] = [
          {
            id: 'c_1',
            name: 'Roberto Mendonça de Alvarenga',
            email: 'roberto.mendonca@email.com',
            phone: '16998887766',
            cpf_cnpj: '111.222.333-44',
            rg: '12.345.678-0',
            rgIssuingBody: 'SSP/SP',
            nationality: 'brasileiro',
            maritalStatus: 'casado',
            profession: 'Engenheiro Civil',
            address: 'Rua das Flores',
            addressNumber: '120',
            neighborhood: 'Centro',
            zipCode: '14.160-000',
            city: 'Sertãozinho',
            state: 'São Paulo',
            origin: 'Particular',
            caseNumber: '1002233-44.2024.8.26.0597',
            caseType: 'Cível',
            caseDescription: 'Ação de Indenização por Danos Morais e Materiais contra concessionária de energia.',
            status: 'Active',
            createdAt: '2024-03-10T09:00:00.000Z',
            financials: {
              totalAgreed: 5000,
              initialPayment: 2000,
              initialPaymentStatus: 'paid',
              method: 'PIX',
              plan: 'Installments',
              installments: [
                { id: 'inst_r1', number: 1, value: 1500, dueDate: '2024-04-10', status: 'paid', paidAt: '2024-04-09' },
                { id: 'inst_r2', number: 2, value: 1500, dueDate: '2024-05-10', status: 'pending' }
              ]
            }
          },
          {
            id: 'c_2',
            name: 'Luciana Ferreira da Costa',
            email: 'luciana.costa@provedor.net',
            phone: '16997776655',
            cpf_cnpj: '555.666.777-88',
            rg: '23.456.789-1',
            origin: 'Defensoria',
            caseNumber: '0005566-77.2024.8.26.0597',
            caseType: 'Cível',
            caseDescription: 'Ação de Alimentos e Regulamentação de Guarda.',
            status: 'Active',
            createdAt: '2024-04-05T14:20:00.000Z',
            financials: {
              totalAgreed: 1845.50,
              method: 'Certidão Estadual',
              plan: 'DefensoriaStandard',
              installments: [],
              defensoriaStatus100: 'Aguardando Sentença',
              appointmentDate: '2024-04-01'
            }
          },
          {
            id: 'c_3',
            name: 'Carlos Alberto Souza',
            email: 'carlos.alberto@gmail.com',
            phone: '16991112233',
            cpf_cnpj: '222.333.444-55',
            origin: 'Particular',
            caseNumber: '0001234-55.2024.8.26.0597',
            caseType: 'Trabalhista',
            caseDescription: 'Reclamação Trabalhista - Horas Extras e Verbas Rescisórias.',
            status: 'Active',
            createdAt: '2024-01-15T10:00:00.000Z',
            financials: {
              totalAgreed: 10000,
              method: 'Transferência',
              plan: 'OnSuccess',
              successFeePercentage: 30,
              successFeeStatus: 'pending',
              installments: []
            }
          },
          {
            id: 'c_4',
            name: 'Marcos Paulo de Oliveira',
            email: 'marcos.paulo@outlook.com',
            phone: '16995554433',
            cpf_cnpj: '333.444.555-66',
            origin: 'Defensoria',
            caseNumber: '1500600-11.2024.8.26.0597',
            caseType: 'Criminal',
            caseDescription: 'Defesa Criminal - Rito Comum Ordinário.',
            status: 'Active',
            createdAt: '2024-02-20T16:45:00.000Z',
            financials: {
              totalAgreed: 3500,
              method: 'Certidão Estadual',
              plan: 'DefensoriaStandard',
              hasRecourse: true,
              defensoriaStatus70: 'Certidão Emitida',
              defensoriaValue70: 2450,
              defensoriaPaymentMonth70: '2024-06',
              defensoriaStatus30: 'Pendente',
              defensoriaValue30: 1050,
              appointmentDate: '2024-02-15',
              installments: []
            }
          },
          {
            id: 'c_5',
            name: 'Fernanda Lima Duarte',
            email: 'fernanda.duarte@empresa.com.br',
            phone: '16994445566',
            cpf_cnpj: '44.555.666/0001-77',
            origin: 'Particular',
            caseNumber: '1008899-22.2024.8.26.0597',
            caseType: 'Tributário',
            caseDescription: 'Anulação de Débito Fiscal - ICMS.',
            status: 'Active',
            createdAt: '2024-05-01T11:30:00.000Z',
            financials: {
              totalAgreed: 15000,
              initialPayment: 5000,
              initialPaymentStatus: 'paid',
              method: 'Boleto',
              plan: 'Installments',
              installments: [
                { id: 'inst_f1', number: 1, value: 2500, dueDate: '2024-06-01', status: 'pending' },
                { id: 'inst_f2', number: 2, value: 2500, dueDate: '2024-07-01', status: 'pending' },
                { id: 'inst_f3', number: 3, value: 2500, dueDate: '2024-08-01', status: 'pending' },
                { id: 'inst_f4', number: 4, value: 2500, dueDate: '2024-09-01', status: 'pending' }
              ]
            }
          }
        ];

        const initialMovements: CourtMovement[] = [
          { id: 'm1', clientId: 'c_1', caseNumber: '1002233-44.2024.8.26.0597', date: '2024-05-28', description: 'Prazo para réplica à contestação', type: 'Deadline', source: 'TJSP' },
          { id: 'm2', clientId: 'c_2', caseNumber: '0005566-77.2024.8.26.0597', date: '2024-06-15', description: 'Audiência de Conciliação - CEJUSC', type: 'Hearing', modality: 'Online', source: 'Portal e-SAJ', time: '14:00' },
          { id: 'm3', clientId: 'c_4', caseNumber: '1500600-11.2024.8.26.0597', date: '2024-05-30', description: 'Audiência de Instrução e Julgamento', type: 'Hearing', modality: 'Presencial', source: 'Fórum de Sertãozinho', time: '13:30' },
          { id: 'm4', clientId: 'c_3', caseNumber: '0001234-55.2024.8.26.0597', date: '2024-06-05', description: 'Prazo para manifestação sobre Laudo Pericial', type: 'Deadline', source: 'TRT15' }
        ];

        setClients(initialClients);
        setMovements(initialMovements);
        addNotification('info', 'Sistema LexAI Pronto', `Configure seu perfil para começar.`);
      } catch (error) {
        addNotification('alert', 'Erro de Conexão', 'Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const addNotification = (type: 'success' | 'info' | 'alert', title: string, message: string) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addMovement = async (movement: CourtMovement) => {
    setMovements(prev => [movement, ...prev]);
    addNotification('success', 'Evento Agendado', `O evento "${movement.description}" foi salvo.`);
  };

  const updateMovement = async (updatedMovement: CourtMovement) => {
    setMovements(prev => prev.map(m => m.id === updatedMovement.id ? updatedMovement : m));
    addNotification('info', 'Evento Atualizado', 'As alterações na agenda foram salvas.');
  };

  const updateClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    addNotification('alert', 'Cliente Removido', 'Os dados do cliente foram excluídos do sistema.');
  };

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: 'c_' + Date.now(),
      createdAt: new Date().toISOString()
    } as Client;
    setClients(prev => [...prev, newClient]);
    addNotification('success', 'Novo Cliente', `${newClient.name} foi cadastrado com sucesso.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onSuccess={() => { }} />;
  }

  return (
    <Layout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      settings={settings}
      notifications={notifications}
      unreadCount={unreadCount}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      markNotificationRead={markNotificationRead}
      isLoading={isLoading}
      onLogout={handleLogout}
    >
      {(() => {
        switch (activeSection) {
          case AppSection.DASHBOARD:
            return <Dashboard clients={clients} movements={movements} />;
          case AppSection.CLIENTS:
            return <ClientList clients={clients} onAddClient={addClient} onUpdateClient={updateClient} onDeleteClient={deleteClient} settings={settings} />;
          case AppSection.FINANCES:
            return <Finances clients={clients} onUpdateClient={updateClient} onAddNotification={addNotification} />;
          case AppSection.AGENDA:
            return <Agenda movements={movements} onAddMovement={addMovement} onUpdateMovement={updateMovement} clients={clients} />;
          case AppSection.REPORTS:
            return <Reports clients={clients} movements={movements} settings={settings} />;
          case AppSection.SETTINGS:
            return <Settings settings={settings} onUpdateSettings={setSettings} onAddNotification={addNotification} />;
          default:
            return <Dashboard clients={clients} movements={movements} />;
        }
      })()}
    </Layout>
  );
};

export default App;
