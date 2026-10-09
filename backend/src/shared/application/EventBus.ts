import { DomainEvent } from '../domain/DomainEvent';

/** Reação a um evento de domínio. */
export interface EventHandler<E extends DomainEvent> {
  handle(evento: E): Promise<void>;
}

/** Lado de publicação do barramento (o que os casos de uso precisam). */
export interface EventPublisher {
  publicar(eventos: readonly DomainEvent[]): Promise<void>;
}

/** Lado de assinatura do barramento (usado na composição da aplicação). */
export interface EventSubscriber {
  assinar<E extends DomainEvent>(nomeEvento: string, handler: EventHandler<E>): void;
}

/** Porta do barramento de eventos. */
export interface EventBus extends EventPublisher, EventSubscriber {}
