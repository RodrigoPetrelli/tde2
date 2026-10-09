import { UseCase } from '../../../../shared/application/UseCase';
import { HttpRoute } from '../../../../shared/http/HttpController';
import { PedidoDTO } from '../../application/PedidoDTO';
import { CriarPedidoController } from './CriarPedidoController';
import { CriarPedidoInput } from './criar-pedido.dto';

export function criarPedidoRoute(useCase: UseCase<CriarPedidoInput, PedidoDTO>): HttpRoute {
  return { method: 'post', path: '/pedidos', controller: new CriarPedidoController(useCase) };
}
