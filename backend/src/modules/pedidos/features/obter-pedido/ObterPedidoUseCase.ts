import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { PedidoDTO, paraPedidoDTO } from '../../application/PedidoDTO';
import { PedidoRepository } from '../../domain/PedidoRepository';

export interface ObterPedidoInput {
  pedidoId: string;
}

export class ObterPedidoUseCase implements UseCase<ObterPedidoInput, PedidoDTO> {
  constructor(private readonly pedidos: PedidoRepository) {}

  async execute(input: ObterPedidoInput): Promise<PedidoDTO> {
    const pedido = await this.pedidos.buscarPorId(input.pedidoId);
    if (!pedido) {
      throw new NotFoundError('Pedido não encontrado');
    }
    return paraPedidoDTO(pedido);
  }
}
