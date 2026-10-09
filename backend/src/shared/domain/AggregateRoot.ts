import { DomainEvent } from './DomainEvent';
import { Entity } from './Entity';

/**
 * Raiz de agregado: registra eventos de domínio que serão publicados
 * pela camada de aplicação depois que o agregado for persistido.
 */
export abstract class AggregateRoot extends Entity {
  private eventosPendentes: DomainEvent[] = [];

  protected registrarEvento(evento: DomainEvent): void {
    this.eventosPendentes.push(evento);
  }

  /** Retorna os eventos pendentes e limpa a lista. */
  puxarEventos(): DomainEvent[] {
    const eventos = this.eventosPendentes;
    this.eventosPendentes = [];
    return eventos;
  }
}
