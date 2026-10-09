import { UseCase } from '../../../../shared/application/UseCase';
import { NotFoundError } from '../../../../shared/domain/errors';
import { PedidoDTO, paraPedidoDTO } from '../../application/PedidoDTO';
import { ClienteGateway } from '../../application/ports/ClienteGateway';
import { PedidoRepository } from '../../domain/PedidoRepository';

export interface ListarPedidosDoClienteInput {
  clienteId: string;
}

export class ListarPedidosDoClienteUseCase implements UseCase<ListarPedidosDoClienteInput, PedidoDTO[]> {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly clientes: ClienteGateway,
  ) {}

  async execute(input: ListarPedidosDoClienteInput): Promise<PedidoDTO[]> {
    if (!(await this.clientes.clienteExiste(input.clienteId))) {
      throw new NotFoundError('Cliente não encontrado');
    }
    const pedidos = await this.pedidos.listarPorCliente(input.clienteId);
    return pedidos.map(paraPedidoDTO);
  }
}
