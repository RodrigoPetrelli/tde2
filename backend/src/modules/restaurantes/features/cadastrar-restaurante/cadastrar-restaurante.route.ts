import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { RestauranteDTO } from '../../application/RestaurantesDTO';
import { CadastrarRestauranteController } from './CadastrarRestauranteController';
import { CadastrarRestauranteInput } from './cadastrar-restaurante.dto';

export function cadastrarRestauranteRoute(
  useCase: UseCase<CadastrarRestauranteInput, RestauranteDTO>,
): HttpRoute {
  return { method: 'post', path: '/restaurantes', controller: new CadastrarRestauranteController(useCase) };
}
