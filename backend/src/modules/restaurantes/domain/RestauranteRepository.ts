import { Produto } from './Produto';
import { Restaurante } from './Restaurante';

/** Porta de persistência de restaurantes e seus cardápios. */
export interface RestauranteRepository {
  salvar(restaurante: Restaurante): Promise<void>;
  buscarPorId(id: string): Promise<Restaurante | null>;
  listarTodos(): Promise<Restaurante[]>;

  salvarProduto(produto: Produto): Promise<void>;
  listarProdutosDoRestaurante(restauranteId: string): Promise<Produto[]>;
  buscarProdutosPorIds(ids: readonly string[]): Promise<Produto[]>;
}
