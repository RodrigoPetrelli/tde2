import { EventPublisher } from '../../../../shared/application/EventBus';
import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { PedidoDTO, paraPedidoDTO } from '../../application/PedidoDTO';
import { PedidoRepository } from '../../domain/PedidoRepository';

export interface CancelarPedidoInput {
  pedidoId: string;
}

export class CancelarPedidoUseCase implements UseCase<CancelarPedidoInput, PedidoDTO> {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly eventos: EventPublisher,
  ) {}

  async execute(input: CancelarPedidoInput): Promise<PedidoDTO> {
    const pedido = await this.pedidos.buscarPorId(input.pedidoId);
    if (!pedido) {
      throw new NotFoundError('Pedido não encontrado');
    }

    pedido.cancelar();

    await this.pedidos.salvar(pedido);
    await this.eventos.publicar(pedido.puxarEventos());
    return paraPedidoDTO(pedido);
  }
}
