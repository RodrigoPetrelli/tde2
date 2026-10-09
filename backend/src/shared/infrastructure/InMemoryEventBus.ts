import { EventBus, EventHandler } from '../application/EventBus';
import { DomainEvent } from '../domain/DomainEvent';

/**
 * Barramento de eventos em memória. Os handlers rodam em sequência, na ordem
 * de assinatura, e `publicar` só resolve depois que todos terminaram. A falha
 * de um handler é registrada e não interrompe os demais nem o caso de uso
 * que publicou o evento (o agregado já foi persistido).
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler<DomainEvent>[]>();

  assinar<E extends DomainEvent>(nomeEvento: string, handler: EventHandler<E>): void {
    const lista = this.handlers.get(nomeEvento) ?? [];
    lista.push(handler);
    this.handlers.set(nomeEvento, lista);
  }

  async publicar(eventos: readonly DomainEvent[]): Promise<void> {
    for (const evento of eventos) {
      for (const handler of this.handlers.get(evento.nome) ?? []) {
        try {
          await handler.handle(evento);
        } catch (erro) {
          console.error(`[EVENTOS] Falha ao tratar o evento ${evento.nome}`, erro);
        }
      }
    }
  }
}
