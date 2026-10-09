import { CatalogoGateway } from '../../../src/modules/pedidos/application/ports/CatalogoGateway';
import { ClienteGateway } from '../../../src/modules/pedidos/application/ports/ClienteGateway';
import { ItemPedido } from '../../../src/modules/pedidos/domain/ItemPedido';
import { Pedido } from '../../../src/modules/pedidos/domain/Pedido';
import { PedidoRepository } from '../../../src/modules/pedidos/domain/PedidoRepository';
import { ProdutoDoCatalogo } from '../../../src/modules/pedidos/domain/ProdutoDoCatalogo';
import { Quantidade } from '../../../src/modules/pedidos/domain/Quantidade';
import { StatusPedido } from '../../../src/modules/pedidos/domain/StatusPedido';

/** Fakes em memória das portas usadas pelos casos de uso de pedidos. */

export class FakePedidoRepository implements PedidoRepository {
  /** Histórico das chamadas a `salvar` (para asserções); pedidos semeados no construtor não entram aqui. */
  readonly salvos: Pedido[] = [];
  private readonly porId = new Map<string, Pedido>();

  constructor(iniciais: readonly Pedido[] = []) {
    iniciais.forEach((pedido) => this.porId.set(pedido.id, pedido));
  }

  async salvar(pedido: Pedido): Promise<void> {
    this.salvos.push(pedido);
    this.porId.set(pedido.id, pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    return this.porId.get(id) ?? null;
  }

  async listarPorCliente(clienteId: string): Promise<Pedido[]> {
    return [...this.porId.values()].filter((p) => p.clienteId === clienteId);
  }
}

/** Produto do catálogo fake: informa o restaurante dono para o fake calcular `pertenceAoRestaurante`. */
export type ProdutoFake = Omit<ProdutoDoCatalogo, 'pertenceAoRestaurante'> & { restauranteId: string };

export class FakeCatalogo implements CatalogoGateway {
  constructor(
    private readonly restauranteId: string,
    private readonly produtos: readonly ProdutoFake[],
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
  constructor(private readonly ids: readonly string[]) {}

  async clienteExiste(clienteId: string): Promise<boolean> {
    return this.ids.includes(clienteId);
  }
}

/* ---------- Builders de domínio para os testes ---------- */

export function produtoDoCatalogo(sobrescrever: Partial<ProdutoDoCatalogo> = {}): ProdutoDoCatalogo {
  return {
    id: 'p1',
    nome: 'Lasanha',
    precoCentavos: 3500,
    disponivel: true,
    pertenceAoRestaurante: true,
    ...sobrescrever,
  };
}

export function itemPedido(quantidade: number, sobrescrever: Partial<ProdutoDoCatalogo> = {}): ItemPedido {
  return ItemPedido.criar({ produto: produtoDoCatalogo(sobrescrever), quantidade: Quantidade.criar(quantidade) });
}

export interface PedidoDeTesteProps {
  id?: string;
  clienteId?: string;
  restauranteId?: string;
  itens?: readonly ItemPedido[];
  status?: StatusPedido;
}

/**
 * Cria um pedido já no status desejado e com os eventos de criação/transição
 * descartados, simulando um agregado recém-carregado do repositório.
 */
export function pedidoDeTeste({
  id = 'ped-1',
  clienteId = 'c1',
  restauranteId = 'r1',
  itens = [itemPedido(1)],
  status = StatusPedido.CRIADO,
}: PedidoDeTesteProps = {}): Pedido {
  const pedido = Pedido.criar({ id, clienteId, restauranteId, itens });
  if (status === StatusPedido.CONFIRMADO) {
    pedido.confirmar();
  } else if (status === StatusPedido.CANCELADO) {
    pedido.cancelar();
  }
  pedido.puxarEventos();
  return pedido;
}
