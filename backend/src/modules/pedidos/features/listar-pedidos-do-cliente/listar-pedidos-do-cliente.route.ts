import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { ListarPedidosDoClienteController } from './ListarPedidosDoClienteController';
import { ListarPedidosDoClienteInput } from './ListarPedidosDoClienteUseCase';

export function listarPedidosDoClienteRoute(
  useCase: UseCase<ListarPedidosDoClienteInput, PedidoDTO[]>,
): HttpRoute {
  return { method: 'get', path: '/clientes/:id/pedidos', controller: new ListarPedidosDoClienteController(useCase) };
}
