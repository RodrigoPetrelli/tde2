import { EventPublisher } from '../../../../shared/application/EventBus';
import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { PedidoDTO, paraPedidoDTO } from '../../application/PedidoDTO';
import { PedidoRepository } from '../../domain/PedidoRepository';

export interface ConfirmarPedidoInput {
  pedidoId: string;
}

export class ConfirmarPedidoUseCase implements UseCase<ConfirmarPedidoInput, PedidoDTO> {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly eventos: EventPublisher,
  ) {}

  async execute(input: ConfirmarPedidoInput): Promise<PedidoDTO> {
    const pedido = await this.pedidos.buscarPorId(input.pedidoId);
    if (!pedido) {
      throw new NotFoundError('Pedido não encontrado');
    }

    pedido.confirmar();

    await this.pedidos.salvar(pedido);
    await this.eventos.publicar(pedido.puxarEventos());
    return paraPedidoDTO(pedido);
  }
}
