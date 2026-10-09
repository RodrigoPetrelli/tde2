import { Produto } from '../../../src/modules/restaurantes/domain/Produto';
import { Restaurante } from '../../../src/modules/restaurantes/domain/Restaurante';
import { RestauranteRepository } from '../../../src/modules/restaurantes/domain/RestauranteRepository';

/** Fake em memória da porta de persistência de restaurantes e cardápios (listas preservam a ordem de inserção). */
export class FakeRestauranteRepository implements RestauranteRepository {
  readonly restaurantes: Restaurante[] = [];
  readonly produtos: Produto[] = [];

  async salvar(restaurante: Restaurante): Promise<void> {
    substituirOuAdicionar(this.restaurantes, restaurante);
  }

  async buscarPorId(id: string): Promise<Restaurante | null> {
    return this.restaurantes.find((r) => r.id === id) ?? null;
  }

  async listarTodos(): Promise<Restaurante[]> {
    return [...this.restaurantes];
  }

  async salvarProduto(produto: Produto): Promise<void> {
    substituirOuAdicionar(this.produtos, produto);
  }

  async listarProdutosDoRestaurante(restauranteId: string): Promise<Produto[]> {
    return this.produtos.filter((p) => p.restauranteId === restauranteId);
  }

  async buscarProdutosPorIds(ids: readonly string[]): Promise<Produto[]> {
    return ids.flatMap((id) => this.produtos.filter((p) => p.id === id));
  }
}

function substituirOuAdicionar<T extends { id: string }>(lista: T[], item: T): void {
  const indice = lista.findIndex((existente) => existente.id === item.id);
  if (indice >= 0) {
    lista[indice] = item;
  } else {
    lista.push(item);
  }
}
