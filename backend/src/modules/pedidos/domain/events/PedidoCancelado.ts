import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { StatusPedido } from '../StatusPedido';

export class PedidoCancelado implements DomainEvent {
  static readonly NOME = 'pedidos.PedidoCancelado';
  readonly nome = PedidoCancelado.NOME;

  constructor(
    readonly pedidoId: string,
    readonly restauranteId: string,
    readonly statusAnterior: StatusPedido,
    readonly ocorridoEm: Date,
  ) {}
}
