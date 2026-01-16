
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
      if (!session) {
        setClients([]);
        setMovements([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch profile settings
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          setSettings({
            name: profileData.name || '',
            email: profileData.email || '',
            role: profileData.role || 'Advogado',
            oab: profileData.oab || '',
            cpf: profileData.cpf || '',
            address: profileData.address || '',
            profileImage: profileData.profile_image || '',
            logo: profileData.logo || '',
            notifyDeadlines: profileData.notify_deadlines ?? true,
            deadlineThresholdDays: profileData.deadline_threshold_days || 3
          });
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;

        const mappedClients: Client[] = (clientsData || []).map(c => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          cpf_cnpj: c.cpf_cnpj || '',
          rg: c.rg || '',
          rgIssuingBody: c.rg_issuing_body || '',
          nationality: c.nationality || '',
          birthDate: c.birth_date || '',
          maritalStatus: c.marital_status || '',
          profession: c.profession || '',
          monthlyIncome: c.monthly_income ? Number(c.monthly_income) : undefined,
          address: c.address || '',
          addressNumber: c.address_number || '',
          complement: c.complement || '',
          neighborhood: c.neighborhood || '',
          city: c.city || '',
          state: c.state || '',
          zipCode: c.zip_code || '',
          origin: c.origin as any,
          caseNumber: c.case_number || '',
          caseType: c.case_type || '',
          caseDescription: c.case_description || '',
          status: c.status as any,
          createdAt: c.created_at,
          financials: c.financials
        }));

        setClients(mappedClients);

        // Fetch movements
        const { data: movementsData, error: movementsError } = await supabase
          .from('movements')
          .select('*')
          .order('date', { ascending: true });

        if (movementsError) throw movementsError;

        const mappedMovements: CourtMovement[] = (movementsData || []).map(m => ({
          id: m.id,
          clientId: m.client_id,
          caseNumber: m.case_number,
          date: m.date,
          time: m.time || '',
          description: m.description,
          type: m.type as any,
          modality: m.modality as any,
          source: m.source || ''
        }));

        setMovements(mappedMovements);

        if (mappedClients.length === 0) {
          addNotification('info', 'Sistema LexAI Pronto', `Cadastre seu primeiro cliente para começar.`);
        }
      } catch (error: any) {
        addNotification('alert', 'Erro de Conexão', error.message || 'Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

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

  const addMovement = async (movementData: Omit<CourtMovement, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          client_id: movementData.clientId,
          case_number: movementData.caseNumber,
          date: movementData.date,
          time: movementData.time,
          description: movementData.description,
          type: movementData.type,
          modality: movementData.modality,
          source: movementData.source
        }])
        .select()
        .single();

      if (error) throw error;

      const newMovement: CourtMovement = {
        ...movementData,
        id: data.id
      };
      setMovements(prev => [newMovement, ...prev]);
      addNotification('success', 'Evento Agendado', `O evento "${movementData.description}" foi salvo.`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Agendar', error.message || 'Não foi possível salvar o evento.');
    }
  };

  const updateMovement = async (updatedMovement: CourtMovement) => {
    try {
      const { error } = await supabase
        .from('movements')
        .update({
          client_id: updatedMovement.clientId,
          case_number: updatedMovement.caseNumber,
          date: updatedMovement.date,
          time: updatedMovement.time,
          description: updatedMovement.description,
          type: updatedMovement.type,
          modality: updatedMovement.modality,
          source: updatedMovement.source
        })
        .eq('id', updatedMovement.id);

      if (error) throw error;

      setMovements(prev => prev.map(m => m.id === updatedMovement.id ? updatedMovement : m));
      addNotification('info', 'Evento Atualizado', 'As alterações na agenda foram salvas.');
    } catch (error: any) {
      addNotification('alert', 'Erro ao Atualizar', error.message || 'Não foi possível salvar as alterações.');
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: updatedClient.name,
          email: updatedClient.email,
          phone: updatedClient.phone,
          cpf_cnpj: updatedClient.cpf_cnpj,
          rg: updatedClient.rg,
          rg_issuing_body: updatedClient.rgIssuingBody,
          nationality: updatedClient.nationality,
          birth_date: updatedClient.birthDate,
          marital_status: updatedClient.maritalStatus,
          profession: updatedClient.profession,
          monthly_income: updatedClient.monthlyIncome,
          address: updatedClient.address,
          address_number: updatedClient.addressNumber,
          complement: updatedClient.complement,
          neighborhood: updatedClient.neighborhood,
          city: updatedClient.city,
          state: updatedClient.state,
          zip_code: updatedClient.zipCode,
          origin: updatedClient.origin,
          case_number: updatedClient.caseNumber,
          case_type: updatedClient.caseType,
          case_description: updatedClient.caseDescription,
          status: updatedClient.status,
          financials: updatedClient.financials
        })
        .eq('id', updatedClient.id);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      addNotification('success', 'Cliente Atualizado', 'As informações foram salvas com sucesso.');
    } catch (error: any) {
      addNotification('alert', 'Erro ao Atualizar', error.message || 'Não foi possível salvar as alterações.');
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      addNotification('alert', 'Cliente Removido', 'Os dados do cliente foram excluídos do sistema.');
    } catch (error: any) {
      addNotification('alert', 'Erro ao Remover', error.message || 'Não foi possível excluir o cliente.');
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          cpf_cnpj: clientData.cpf_cnpj,
          rg: clientData.rg,
          rg_issuing_body: clientData.rgIssuingBody,
          nationality: clientData.nationality,
          birth_date: clientData.birthDate,
          marital_status: clientData.maritalStatus,
          profession: clientData.profession,
          monthly_income: clientData.monthlyIncome,
          address: clientData.address,
          address_number: clientData.addressNumber,
          complement: clientData.complement,
          neighborhood: clientData.neighborhood,
          city: clientData.city,
          state: clientData.state,
          zip_code: clientData.zipCode,
          origin: clientData.origin,
          case_number: clientData.caseNumber,
          case_type: clientData.caseType,
          case_description: clientData.caseDescription,
          status: clientData.status,
          financials: clientData.financials
        }])
        .select()
        .single();

      if (error) throw error;

      const newClient: Client = {
        ...clientData,
        id: data.id,
        createdAt: data.created_at
      } as Client;

      setClients(prev => [...prev, newClient]);
      addNotification('success', 'Novo Cliente', `${newClient.name} foi cadastrado com sucesso.`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Salvar', error.message || 'Não foi possível salvar o cliente.');
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const updateSettings = async (newSettings: UserSettings) => {
    try {
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: newSettings.name,
          email: newSettings.email,
          oab: newSettings.oab,
          cpf: newSettings.cpf,
          address: newSettings.address,
          role: newSettings.role,
          profile_image: newSettings.profileImage,
          logo: newSettings.logo,
          notify_deadlines: newSettings.notifyDeadlines,
          deadline_threshold_days: newSettings.deadlineThresholdDays
        });

      if (error) throw error;
      setSettings(newSettings);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Salvar Perfil', error.message || 'Não foi possível salvar as configurações.');
      throw error;
    }
  };

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
            return <Settings settings={settings} onUpdateSettings={updateSettings} onAddNotification={addNotification} />;
          default:
            return <Dashboard clients={clients} movements={movements} />;
        }
      })()}
    </Layout>
  );
};

export default App;
