import { EventBus, EventHandler } from '../../../src/shared/application/EventBus';
import { IdGenerator } from '../../../src/shared/application/IdGenerator';
import { DomainEvent } from '../../../src/shared/domain/DomainEvent';

/**
 * Fakes em memória das portas compartilhadas (`shared/application`).
 * Os casos de uso dependem apenas das interfaces (DIP); estes dublês as
 * implementam sem infraestrutura real e podem substituí-las sem quebrar
 * nenhum comportamento esperado (LSP).
 */

/** Barramento que apenas registra o que foi publicado, na ordem. */
export class FakeEventBus implements EventBus {
  readonly publicados: DomainEvent[] = [];
  readonly assinaturas: string[] = [];

  assinar<E extends DomainEvent>(nomeEvento: string, _handler: EventHandler<E>): void {
    this.assinaturas.push(nomeEvento);
  }

  async publicar(eventos: readonly DomainEvent[]): Promise<void> {
    this.publicados.push(...eventos);
  }
}

/** Gerador determinístico: id-1, id-2, ... */
export class SequentialIdGenerator implements IdGenerator {
  private proximo = 1;

  constructor(private readonly prefixo = 'id') {}

  gerar(): string {
    return `${this.prefixo}-${this.proximo++}`;
  }
}
