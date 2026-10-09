import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { RestauranteDTO } from '../../application/RestaurantesDTO';
import { ListarRestaurantesController } from './ListarRestaurantesController';

export function listarRestaurantesRoute(useCase: UseCase<void, RestauranteDTO[]>): HttpRoute {
  return { method: 'get', path: '/restaurantes', controller: new ListarRestaurantesController(useCase) };
}
