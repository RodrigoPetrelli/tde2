import { Produto } from '../domain/Produto';
import { Restaurante } from '../domain/Restaurante';
import { RestauranteRepository } from '../domain/RestauranteRepository';

/** Implementação em memória (Map preserva a ordem de inserção usada nas listagens). */
export class InMemoryRestauranteRepository implements RestauranteRepository {
  private readonly restaurantes = new Map<string, Restaurante>();
  private readonly produtos = new Map<string, Produto>();

  async salvar(restaurante: Restaurante): Promise<void> {
    this.restaurantes.set(restaurante.id, restaurante);
  }

  async buscarPorId(id: string): Promise<Restaurante | null> {
    return this.restaurantes.get(id) ?? null;
  }

  async listarTodos(): Promise<Restaurante[]> {
    return [...this.restaurantes.values()];
  }

  async salvarProduto(produto: Produto): Promise<void> {
    this.produtos.set(produto.id, produto);
  }

  async listarProdutosDoRestaurante(restauranteId: string): Promise<Produto[]> {
    return [...this.produtos.values()].filter((produto) => produto.pertenceAo(restauranteId));
  }

  async buscarProdutosPorIds(ids: readonly string[]): Promise<Produto[]> {
    return ids.flatMap((id) => {
      const produto = this.produtos.get(id);
      return produto ? [produto] : [];
    });
  }
}
