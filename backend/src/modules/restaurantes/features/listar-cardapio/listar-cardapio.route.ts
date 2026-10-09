import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { ProdutoDTO } from '../../application/RestaurantesDTO';
import { ListarCardapioController } from './ListarCardapioController';
import { ListarCardapioInput } from './ListarCardapioUseCase';

export function listarCardapioRoute(useCase: UseCase<ListarCardapioInput, ProdutoDTO[]>): HttpRoute {
  return { method: 'get', path: '/restaurantes/:id/produtos', controller: new ListarCardapioController(useCase) };
}
