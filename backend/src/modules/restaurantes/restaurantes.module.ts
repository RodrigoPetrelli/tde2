import { UseCase } from '../../shared/application/UseCase';
import { HttpRouter, montarRouter } from '../../shared/http/expressAdapter';
import { ProdutoDTO, RestauranteDTO } from './application/RestaurantesDTO';
import { adicionarProdutoRoute } from './features/adicionar-produto/adicionar-produto.route';
import { AdicionarProdutoInput } from './features/adicionar-produto/adicionar-produto.dto';
import { cadastrarRestauranteRoute } from './features/cadastrar-restaurante/cadastrar-restaurante.route';
import { CadastrarRestauranteInput } from './features/cadastrar-restaurante/cadastrar-restaurante.dto';
import { listarCardapioRoute } from './features/listar-cardapio/listar-cardapio.route';
import { ListarCardapioInput } from './features/listar-cardapio/ListarCardapioUseCase';
import { listarRestaurantesRoute } from './features/listar-restaurantes/listar-restaurantes.route';

/** Casos de uso que o módulo expõe via HTTP (instanciados no composition root). */
export interface RestaurantesUseCases {
  cadastrarRestaurante: UseCase<CadastrarRestauranteInput, RestauranteDTO>;
  listarRestaurantes: UseCase<void, RestauranteDTO[]>;
  adicionarProduto: UseCase<AdicionarProdutoInput, ProdutoDTO>;
  listarCardapio: UseCase<ListarCardapioInput, ProdutoDTO[]>;
}

export function restaurantesModule(useCases: RestaurantesUseCases): HttpRouter {
  return montarRouter([
    cadastrarRestauranteRoute(useCases.cadastrarRestaurante),
    listarRestaurantesRoute(useCases.listarRestaurantes),
    adicionarProdutoRoute(useCases.adicionarProduto),
    listarCardapioRoute(useCases.listarCardapio),
  ]);
}
