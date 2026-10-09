// Exceção permitida à regra de isolamento entre módulos: este adaptador importa
// APENAS o tipo da interface RestauranteRepository do módulo restaurantes (nunca
// domínio, implementações ou features). A instância concreta é injetada pelo
// composition root (main/container.ts).
import type { RestauranteRepository } from '../../restaurantes/domain/RestauranteRepository';
import { CatalogoGateway } from '../application/ports/CatalogoGateway';
import { RestauranteInfoGateway } from '../application/ports/RestauranteInfoGateway';
import { ProdutoDoCatalogo } from '../domain/ProdutoDoCatalogo';

/** Anti-corruption layer: traduz o modelo de restaurantes para o modelo de pedidos. */
export class CatalogoGatewayAdapter implements CatalogoGateway, RestauranteInfoGateway {
  constructor(private readonly restaurantes: RestauranteRepository) {}

  async restauranteExiste(restauranteId: string): Promise<boolean> {
    return (await this.restaurantes.buscarPorId(restauranteId)) !== null;
  }

  async buscarProdutosDoRestaurante(
    restauranteId: string,
    produtoIds: readonly string[],
  ): Promise<ProdutoDoCatalogo[]> {
    const produtos = await this.restaurantes.buscarProdutosPorIds(produtoIds);
    return produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      precoCentavos: produto.preco.centavos,
      disponivel: produto.disponivel,
      pertenceAoRestaurante: produto.pertenceAo(restauranteId),
    }));
  }

  async obterNomeDoRestaurante(restauranteId: string): Promise<string | null> {
    const restaurante = await this.restaurantes.buscarPorId(restauranteId);
    return restaurante ? restaurante.nome : null;
  }
}
