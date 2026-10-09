import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { ProdutoDTO } from '../../application/RestaurantesDTO';
import { AdicionarProdutoController } from './AdicionarProdutoController';
import { AdicionarProdutoInput } from './adicionar-produto.dto';

export function adicionarProdutoRoute(useCase: UseCase<AdicionarProdutoInput, ProdutoDTO>): HttpRoute {
  return { method: 'post', path: '/restaurantes/:id/produtos', controller: new AdicionarProdutoController(useCase) };
}
