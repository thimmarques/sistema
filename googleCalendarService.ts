
import { CourtMovement } from './types';

/**
 * Serviço para gerenciar eventos no Google Calendar.
 * Em um cenário de produção, o accessToken seria obtido via fluxo OAuth2 (GSI).
 */
export class GoogleCalendarService {
  private static readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

  /**
   * Cria um evento no Google Calendar para uma movimentação processual.
   */
  static async createEvent(movement: CourtMovement, accessToken: string): Promise<boolean> {
    const isHearing = movement.type === 'Hearing';
    
    // Configura o evento
    const event = {
      summary: `${isHearing ? '🏛️ AUDIÊNCIA' : '📅 PRAZO'}: Proc. ${movement.caseNumber}`,
      location: movement.source || 'Tribunal',
      description: `
        Movimentação detectada via LexAI.
        Processo: ${movement.caseNumber}
        Tipo: ${movement.type === 'Hearing' ? 'Audiência' : 'Prazo/Notificação'}
        Descrição: ${movement.description}
        Fonte: ${movement.source}
      `.trim(),
      start: {
        date: movement.date, // Formato YYYY-MM-DD para eventos de dia inteiro
      },
      end: {
        date: movement.date,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
      colorId: isHearing ? '9' : '5', // Azul para audiências, Amarelo para prazos
    };

    try {
      // Nota: Em um ambiente real, faríamos o fetch abaixo:
      /*
      const response = await fetch(`${this.CALENDAR_API_BASE}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      return response.ok;
      */
      
      // Simulando latência de rede e sucesso da API do Google
      console.log('Enviando evento para Google Calendar:', event);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar com Google Calendar:', error);
      return false;
    }
  }

  /**
   * Mock para simular abertura de popup do Google OAuth
   */
  static async authorize(): Promise<string> {
    return new Promise((resolve) => {
      // Simula o tempo que o usuário levaria para autorizar no popup do Google
      setTimeout(() => {
        resolve('mock_access_token_' + Math.random().toString(36).substr(2));
      }, 2000);
    });
  }
}
