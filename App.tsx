
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, Client, CourtMovement, AppNotification, UserSettings, ActivityLog } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import Agenda from './components/Agenda';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Finances from './components/Finances';
import Auth from './components/Auth';
import Hearings from './components/Hearings';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { GoogleCalendarService } from './googleCalendarService';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [clients, setClients] = useState<Client[]>([]);
  const [movements, setMovements] = useState<CourtMovement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);

  const handleNavigation = (section: AppSection, tab?: string) => {
    setActiveSection(section);
    setActiveSubTab(tab);
  };

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
    oabState: 'SP',
    cpf: '',
    address: '',
    profileImage: '',
    logo: '',
    notifyDeadlines: true,
    deadlineThresholdDays: 3,
    googleConnected: false,
    googleEmail: '',
    googleToken: ''
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
          const updatedSettings: UserSettings = {
            name: profileData.name || '',
            email: profileData.email || '',
            role: profileData.role || 'Advogado',
            oab: profileData.oab || '',
            oabState: profileData.oab_state || 'SP',
            cpf: profileData.cpf || '',
            address: profileData.address || '',
            profileImage: profileData.profile_image || '',
            logo: profileData.logo || '',
            notifyDeadlines: profileData.notify_deadlines ?? true,
            deadlineThresholdDays: profileData.deadline_threshold_days || 3,
            googleConnected: profileData.google_connected || false,
            googleEmail: profileData.google_email || '',
            googleToken: profileData.google_token || ''
          };

          // Check if we have a fresh provider token from a recent OAuth redirect
          if ((session as any).provider_token) {
            updatedSettings.googleConnected = true;
            updatedSettings.googleToken = (session as any).provider_token;
            updatedSettings.googleEmail = session.user.email || '';

            // Persist the fresh token to the profile
            await supabase
              .from('profiles')
              .update({
                google_connected: true,
                google_token: (session as any).provider_token,
                google_email: session.user.email
              })
              .eq('id', session.user.id);
          }

          setSettings(updatedSettings);

          // Fallback logo: if current user has no logo, try to find any logo from another profile
          if (!profileData.logo) {
            const { data: anyLogoData } = await supabase
              .from('profiles')
              .select('logo')
              .not('logo', 'is', null)
              .neq('logo', '')
              .limit(1);

            if (anyLogoData && anyLogoData.length > 0) {
              setSettings(prev => ({ ...prev, logo: anyLogoData[0].logo }));
            }
          }
        } else {
          // If profile doesn't exist, also try to fetch a default shared logo
          const { data: anyLogoData } = await supabase
            .from('profiles')
            .select('logo')
            .not('logo', 'is', null)
            .neq('logo', '')
            .limit(1);

          if (anyLogoData && anyLogoData.length > 0) {
            setSettings(prev => ({ ...prev, logo: anyLogoData[0].logo }));
          }
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (clientsError) throw clientsError;

        const mappedClients: Client[] = (clientsData || []).map(c => ({
          id: c.id,
          userId: c.user_id,
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
          type: m.type === 'Hearing' ? 'Audiência' : (m.type as any),
          modality: m.modality as any,
          source: m.source || '',
          syncedToGoogle: m.synced_to_google || false,
          googleEventId: m.google_event_id
        }));

        setMovements(mappedMovements);

        if (mappedClients.length === 0) {
          addNotification('info', 'Sistema LexAI Pronto', `Cadastre seu primeiro cliente para começar.`);
        }

        // Fetch activity logs
        const { data: logsData, error: logsError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!logsError && logsData) {
          const mappedLogs: ActivityLog[] = logsData.map(l => ({
            id: l.id,
            userId: l.user_id,
            userName: l.user_name,
            actionType: l.action_type as any,
            entityType: l.entity_type as any,
            entityId: l.entity_id,
            description: l.description,
            details: l.details,
            createdAt: l.created_at
          }));
          setActivityLogs(mappedLogs);
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

  const logActivity = async (
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN',
    entityType: 'CLIENT' | 'MOVEMENT' | 'PROFILE' | 'SYSTEM',
    entityId: string | undefined,
    description: string,
    details?: any
  ) => {
    try {
      if (!session) return;

      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: session.user.id,
          user_name: settings.name || session.user.email,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          description,
          details
        }]);

      if (error) {
        console.error('Error logging activity:', error);
      } else {
        // Optimistic update for logs if we are on dashboard or just to keep state sync
        const newLog: ActivityLog = {
          id: Math.random().toString(), // Temporary ID for state
          userId: session.user.id,
          userName: settings.name || session.user.email || 'Usuário',
          actionType: actionType,
          entityType: entityType,
          entityId: entityId,
          description: description,
          details: details,
          createdAt: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev].slice(0, 20));
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  const addMovement = async (movementData: CourtMovement) => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .insert([{
          client_id: movementData.clientId || null,
          case_number: movementData.caseNumber,
          date: movementData.date,
          time: movementData.time,
          description: movementData.description,
          type: movementData.type === 'Audiência' ? 'Hearing' : movementData.type,
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
      logActivity('CREATE', 'MOVEMENT', data.id, `Agendou ${movementData.type}: ${movementData.description}`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Agendar', error.message || 'Não foi possível salvar o evento.');
    }
  };

  const updateMovement = async (updatedMovement: CourtMovement) => {
    try {
      const { error } = await supabase
        .from('movements')
        .update({
          client_id: updatedMovement.clientId || null,
          case_number: updatedMovement.caseNumber,
          date: updatedMovement.date,
          time: updatedMovement.time,
          description: updatedMovement.description,
          type: updatedMovement.type === 'Audiência' ? 'Hearing' : updatedMovement.type,
          modality: updatedMovement.modality,
          source: updatedMovement.source
        })
        .eq('id', updatedMovement.id);

      if (error) throw error;

      setMovements(prev => prev.map(m => m.id === updatedMovement.id ? updatedMovement : m));
      addNotification('info', 'Evento Atualizado', 'As alterações na agenda foram salvas.');
      logActivity('UPDATE', 'MOVEMENT', updatedMovement.id, `Atualizou evento: ${updatedMovement.description}`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Atualizar', error.message || 'Não foi possível salvar as alterações.');
    }
  };

  const deleteMovement = async (movement: CourtMovement) => {
    try {
      // 1. Busca a versão MAIS RECENTE do banco para ter certeza se há um ID do Google
      const { data: latestData, error: fetchError } = await supabase
        .from('movements')
        .select('synced_to_google, google_event_id')
        .eq('id', movement.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar versão mais recente do evento:', fetchError);
      }

      const isSynced = latestData?.synced_to_google || movement.syncedToGoogle;
      const gEventId = latestData?.google_event_id || movement.googleEventId;

      let googleDeleted = false;

      // 2. Se estiver sincronizado com o Google e tiver o ID, exclui de lá
      if (isSynced && gEventId) {
        const token = (session as any)?.provider_token || settings.googleToken;
        if (token) {
          const success = await GoogleCalendarService.deleteEvent(gEventId, token);
          googleDeleted = success;
        }
      }

      // 3. Exclui do Supabase
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movement.id);

      if (error) throw error;

      // 4. Atualiza estado local
      setMovements(prev => prev.filter(m => m.id !== movement.id));

      if (isSynced && !googleDeleted) {
        addNotification('info', 'Removido Localmente', 'O evento foi removido do sistema, mas não pudemos confirmar a remoção no Google Agenda (possivelmente devido a uma sincronização antiga ou erro de conexão).');
      } else {
        addNotification('success', 'Evento Removido', 'O evento foi excluído do sistema e da sua agenda.');
      }

      logActivity('DELETE', 'MOVEMENT', movement.id, `Excluiu evento: ${movement.description}`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Remover', error.message || 'Não foi possível excluir o evento.');
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: updatedClient.name,
          email: updatedClient.email || null,
          phone: updatedClient.phone || null,
          cpf_cnpj: updatedClient.cpf_cnpj || null,
          rg: updatedClient.rg || null,
          rg_issuing_body: updatedClient.rgIssuingBody || null,
          nationality: updatedClient.nationality || null,
          birth_date: updatedClient.birthDate || null,
          marital_status: updatedClient.maritalStatus || null,
          profession: updatedClient.profession || null,
          monthly_income: isNaN(Number(updatedClient.monthlyIncome)) ? null : Number(updatedClient.monthlyIncome),
          address: updatedClient.address || null,
          address_number: updatedClient.addressNumber || null,
          complement: updatedClient.complement || null,
          neighborhood: updatedClient.neighborhood || null,
          city: updatedClient.city || null,
          state: updatedClient.state || null,
          zip_code: updatedClient.zipCode || null,
          origin: updatedClient.origin,
          case_number: updatedClient.caseNumber || null,
          case_type: updatedClient.caseType || null,
          case_description: updatedClient.caseDescription || null,
          status: updatedClient.status,
          financials: updatedClient.financials
        })
        .eq('id', updatedClient.id);

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      addNotification('success', 'Cliente Atualizado', 'As informações foram salvas com sucesso.');
      logActivity('UPDATE', 'CLIENT', updatedClient.id, `Atualizou dados do cliente: ${updatedClient.name}`);
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
      logActivity('DELETE', 'CLIENT', id, `Removeu cliente do sistema`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Remover', error.message || 'Não foi possível excluir o cliente.');
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          user_id: session?.user?.id,
          name: clientData.name,
          email: clientData.email || null,
          phone: clientData.phone || null,
          cpf_cnpj: clientData.cpf_cnpj || null,
          rg: clientData.rg || null,
          rg_issuing_body: clientData.rgIssuingBody || null,
          nationality: clientData.nationality || null,
          birth_date: clientData.birthDate || null,
          marital_status: clientData.maritalStatus || null,
          profession: clientData.profession || null,
          monthly_income: isNaN(Number(clientData.monthlyIncome)) ? null : Number(clientData.monthlyIncome),
          address: clientData.address || null,
          address_number: clientData.addressNumber || null,
          complement: clientData.complement || null,
          neighborhood: clientData.neighborhood || null,
          city: clientData.city || null,
          state: clientData.state || null,
          zip_code: clientData.zipCode || null,
          origin: clientData.origin,
          case_number: clientData.caseNumber || null,
          case_type: clientData.caseType || null,
          case_description: clientData.caseDescription || null,
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

      setClients(prev => [newClient, ...prev]);
      addNotification('success', 'Novo Cliente', `${newClient.name} foi cadastrado com sucesso.`);
      logActivity('CREATE', 'CLIENT', data.id, `Cadastrou novo cliente: ${newClient.name}`);
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
          oab_state: newSettings.oabState,
          cpf: newSettings.cpf,
          address: newSettings.address,
          role: newSettings.role,
          profile_image: newSettings.profileImage,
          logo: newSettings.logo,
          notify_deadlines: newSettings.notifyDeadlines,
          deadline_threshold_days: newSettings.deadlineThresholdDays,
          google_connected: newSettings.googleConnected,
          google_email: newSettings.googleEmail,
          google_token: newSettings.googleToken
        });

      if (error) throw error;
      setSettings(newSettings);
      logActivity('UPDATE', 'PROFILE', session.user.id, `Atualizou o perfil profissional`);
    } catch (error: any) {
      addNotification('alert', 'Erro ao Salvar Perfil', error.message || 'Não foi possível salvar as configurações.');
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async () => {
    try {
      if (!session) return;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Log the action before signing out
      logActivity('DELETE', 'PROFILE', session.user.id, `Excluiu sua conta permanentemente`);

      await handleLogout();
    } catch (error: any) {
      addNotification('alert', 'Erro ao Excluir Conta', error.message || 'Não foi possível excluir sua conta.');
      throw error;
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await GoogleCalendarService.authorize();
      // O Supabase redirecionará o usuário para o Google
    } catch (error) {
      addNotification('alert', 'Erro na Conexão', 'Não foi possível iniciar a conexão com o Google Agenda.');
    }
  };

  const handleDisconnectGoogle = async () => {
    const updatedSettings = {
      ...settings,
      googleConnected: false,
      googleEmail: '',
      googleToken: ''
    };
    await updateSettings(updatedSettings);
    addNotification('info', 'Google Agenda Desconectado', 'Sua conta foi desvinculada.');
  };

  const handleSyncMovement = async (movement: CourtMovement) => {
    try {
      // Usa o token salvo nas configurações ou o token da sessão atual se disponível
      const token = (session as any)?.provider_token || settings.googleToken;

      if (!token) {
        addNotification('alert', 'Google não conectado', 'Conecte seu Google Agenda nas configurações primeiro.');
        return;
      }

      const result = await GoogleCalendarService.createEvent(movement, token);
      if (result && typeof result === 'string') {
        const googleEventId = result;
        // Atualiza o banco de dados
        const { error } = await supabase
          .from('movements')
          .update({
            synced_to_google: true,
            google_event_id: googleEventId
          })
          .eq('id', movement.id);

        if (error) throw error;

        setMovements(prev => prev.map(m => m.id === movement.id ? { ...m, syncedToGoogle: true, googleEventId } : m));
        addNotification('success', 'Sincronizado', 'O evento foi adicionado ao seu Google Agenda.');
      }
    } catch (error) {
      addNotification('alert', 'Erro na Sincronização', 'Ocorreu um erro ao enviar para o Google.');
    }
  };

  if (!session) {
    return <Auth onSuccess={() => { }} />;
  }

  return (
    <Layout
      activeSection={activeSection}
      onSelectSection={handleNavigation}
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
            return (
              <Dashboard
                clients={clients}
                movements={movements}
                activities={activityLogs}
                settings={settings}
                currentUserId={session?.user?.id}
                onSelectSection={handleNavigation}
              />
            );
          case AppSection.CLIENTS:
            return (
              <ClientList
                clients={clients}
                settings={settings}
                currentUserId={session?.user?.id}
                onAddClient={addClient}
                onUpdateClient={updateClient}
                onDeleteClient={deleteClient}
              />
            );
          case AppSection.FINANCES:
            return (
              <Finances
                clients={clients}
                currentUserId={session?.user?.id}
                onUpdateClient={updateClient}
                onAddNotification={addNotification}
                initialTab={activeSubTab as any}
              />
            );
          case AppSection.AGENDA:
            return (
              <Agenda
                clients={clients}
                movements={movements}
                onAddMovement={addMovement}
                onUpdateMovement={updateMovement}
                onDeleteMovement={deleteMovement}
                settings={settings}
                onSyncToGoogle={handleSyncMovement}
                googleConnected={settings.googleConnected}
              />
            );
          case AppSection.HEARINGS:
            return (
              <Hearings
                clients={clients}
                movements={movements}
                onAddMovement={addMovement}
                onUpdateMovement={updateMovement}
                onDeleteMovement={deleteMovement}
                settings={settings}
              />
            );
          case AppSection.REPORTS:
            return (
              <Reports
                clients={clients}
                movements={movements}
                settings={settings}
                currentUserId={session?.user?.id}
              />
            );
          case AppSection.SETTINGS:
            return (
              <Settings
                settings={settings}
                onUpdateSettings={updateSettings}
                onAddNotification={addNotification}
                onLogout={handleLogout}
                onDeleteAccount={deleteAccount}
                onConnectGoogle={handleConnectGoogle}
                onDisconnectGoogle={handleDisconnectGoogle}
              />
            );
          default:
            return <Dashboard clients={clients} movements={movements} activities={activityLogs} onSelectSection={handleNavigation} settings={settings} />;
        }
      })()}
    </Layout>
  );
};

export default App;
