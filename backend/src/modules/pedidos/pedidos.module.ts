import { UseCase } from '../../shared/application/UseCase';
import { HttpRouter, montarRouter } from '../../shared/http/expressAdapter';
import { PedidoDTO } from './application/PedidoDTO';
import { cancelarPedidoRoute } from './features/cancelar-pedido/cancelar-pedido.route';
import { CancelarPedidoInput } from './features/cancelar-pedido/CancelarPedidoUseCase';
import { confirmarPedidoRoute } from './features/confirmar-pedido/confirmar-pedido.route';
import { ConfirmarPedidoInput } from './features/confirmar-pedido/ConfirmarPedidoUseCase';
import { criarPedidoRoute } from './features/criar-pedido/criar-pedido.route';
import { CriarPedidoInput } from './features/criar-pedido/criar-pedido.dto';
import { listarPedidosDoClienteRoute } from './features/listar-pedidos-do-cliente/listar-pedidos-do-cliente.route';
import { ListarPedidosDoClienteInput } from './features/listar-pedidos-do-cliente/ListarPedidosDoClienteUseCase';
import { obterPedidoRoute } from './features/obter-pedido/obter-pedido.route';
import { ObterPedidoInput } from './features/obter-pedido/ObterPedidoUseCase';

/** Casos de uso que o módulo expõe via HTTP (instanciados no composition root). */
export interface PedidosUseCases {
  criarPedido: UseCase<CriarPedidoInput, PedidoDTO>;
  obterPedido: UseCase<ObterPedidoInput, PedidoDTO>;
  listarPedidosDoCliente: UseCase<ListarPedidosDoClienteInput, PedidoDTO[]>;
  confirmarPedido: UseCase<ConfirmarPedidoInput, PedidoDTO>;
  cancelarPedido: UseCase<CancelarPedidoInput, PedidoDTO>;
}

export function pedidosModule(useCases: PedidosUseCases): HttpRouter {
  return montarRouter([
    criarPedidoRoute(useCases.criarPedido),
    obterPedidoRoute(useCases.obterPedido),
    listarPedidosDoClienteRoute(useCases.listarPedidosDoCliente),
    confirmarPedidoRoute(useCases.confirmarPedido),
    cancelarPedidoRoute(useCases.cancelarPedido),
  ]);
}
