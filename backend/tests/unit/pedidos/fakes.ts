import { EventBus, EventHandler } from '../../../src/shared/application/EventBus';
import { IdGenerator } from '../../../src/shared/application/IdGenerator';
import { DomainEvent } from '../../../src/shared/domain/DomainEvent';
import { CatalogoGateway } from '../../../src/modules/pedidos/application/ports/CatalogoGateway';
import { ClienteGateway } from '../../../src/modules/pedidos/application/ports/ClienteGateway';
import { Pedido } from '../../../src/modules/pedidos/domain/Pedido';
import { PedidoRepository } from '../../../src/modules/pedidos/domain/PedidoRepository';
import { ProdutoDoCatalogo } from '../../../src/modules/pedidos/domain/ProdutoDoCatalogo';

/** Fakes em memória das portas usadas pelos casos de uso de pedidos. */

export class FakePedidoRepository implements PedidoRepository {
  readonly salvos: Pedido[] = [];

  async salvar(pedido: Pedido): Promise<void> {
    this.salvos.push(pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    return [...this.salvos].reverse().find((p) => p.id === id) ?? null;
  }

  async listarPorCliente(clienteId: string): Promise<Pedido[]> {
    return this.salvos.filter((p) => p.clienteId === clienteId);
  }
}

export class FakeEventBus implements EventBus {
  readonly publicados: DomainEvent[] = [];

  assinar<E extends DomainEvent>(_nomeEvento: string, _handler: EventHandler<E>): void {}

  async publicar(eventos: readonly DomainEvent[]): Promise<void> {
    this.publicados.push(...eventos);
  }
}

export class FakeCatalogo implements CatalogoGateway {
  constructor(
    private readonly restauranteId: string,
    private readonly produtos: Array<Omit<ProdutoDoCatalogo, 'pertenceAoRestaurante'> & { restauranteId: string }>,
  ) {}

  async restauranteExiste(restauranteId: string): Promise<boolean> {
    return restauranteId === this.restauranteId;
  }

  async buscarProdutosDoRestaurante(restauranteId: string, ids: readonly string[]): Promise<ProdutoDoCatalogo[]> {
    return this.produtos
      .filter((p) => ids.includes(p.id))
      .map(({ restauranteId: dono, ...p }) => ({ ...p, pertenceAoRestaurante: dono === restauranteId }));
  }
}

export class FakeClientes implements ClienteGateway {
  constructor(private readonly ids: string[]) {}

  async clienteExiste(clienteId: string): Promise<boolean> {
    return this.ids.includes(clienteId);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private proximo = 1;

  gerar(): string {
    return `id-${this.proximo++}`;
  }
}
