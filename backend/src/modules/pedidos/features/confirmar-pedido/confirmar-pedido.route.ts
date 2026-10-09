import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ConfirmarPedidoController } from './ConfirmarPedidoController';
import { ConfirmarPedidoInput } from './ConfirmarPedidoUseCase';

export function confirmarPedidoRoute(useCase: UseCase<ConfirmarPedidoInput, PedidoDTO>): HttpRoute {
  return { method: 'patch', path: '/pedidos/:id/confirmar', controller: new ConfirmarPedidoController(useCase) };
}
