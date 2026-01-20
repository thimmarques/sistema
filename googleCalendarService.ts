
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
    const isHearing = movement.type === 'Audiência';

    // Configura o evento no formato da API do Google Calendar
    const event = {
      summary: `${isHearing ? '🏛️ AUDIÊNCIA' : '📅 PRAZO'}: Proc. ${movement.caseNumber}`,
      location: movement.source || 'Tribunal',
      description: `
Processo: ${movement.caseNumber}
Tipo: ${movement.type === 'Audiência' ? 'Audiência' : 'Prazo/Notificação'}
Descrição: ${movement.description}
Fonte: ${movement.source}

Sincronizado via LexAI Management.
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
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 60 },      // 1 hora antes
        ],
      },
      colorId: isHearing ? '9' : '5', // 9 = Mirtilo (Azul), 5 = Banana (Amarelo)
    };

    try {
      // Simulação de chamada real para fins de demonstração técnica
      console.log(`[Google Calendar] Sincronizando: ${event.summary}`);

      // Delay para simular latência de rede
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Em produção, aqui seria o fetch:
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

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar com Google Calendar:', error);
      return false;
    }
  }

  /**
   * Mock para simular abertura de popup do Google OAuth e retorno de e-mail/token.
   */
  static async authorize(): Promise<{ token: string; email: string }> {
    return new Promise((resolve) => {
      // Simula o tempo que o usuário levaria para autorizar no popup do Google
      setTimeout(() => {
        resolve({
          token: 'ya29.a0AfH6SMC...' + Math.random().toString(36).substring(7),
          email: 'usuario.lexai@gmail.com'
        });
      }, 1500);
    });
  }
}
