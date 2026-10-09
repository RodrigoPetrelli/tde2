import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ObterPedidoController } from './ObterPedidoController';
import { ObterPedidoInput } from './ObterPedidoUseCase';

export function obterPedidoRoute(useCase: UseCase<ObterPedidoInput, PedidoDTO>): HttpRoute {
  return { method: 'get', path: '/pedidos/:id', controller: new ObterPedidoController(useCase) };
}
