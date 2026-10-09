import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { CancelarPedidoController } from './CancelarPedidoController';
import { CancelarPedidoInput } from './CancelarPedidoUseCase';

export function cancelarPedidoRoute(useCase: UseCase<CancelarPedidoInput, PedidoDTO>): HttpRoute {
  return { method: 'patch', path: '/pedidos/:id/cancelar', controller: new CancelarPedidoController(useCase) };
}
