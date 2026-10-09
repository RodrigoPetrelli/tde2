import { ProdutoDoCatalogo } from '../../domain/ProdutoDoCatalogo';

/** Porta para consultar o catálogo (módulo restaurantes) apenas no que pedidos precisa. */
export interface CatalogoGateway {
  restauranteExiste(restauranteId: string): Promise<boolean>;

  /**
   * Busca os produtos com os ids informados, sinalizando em `pertenceAoRestaurante`
   * se cada um é do restaurante indicado. Ids inexistentes são omitidos do resultado.
   */
  buscarProdutosDoRestaurante(restauranteId: string, produtoIds: readonly string[]): Promise<ProdutoDoCatalogo[]>;
}
