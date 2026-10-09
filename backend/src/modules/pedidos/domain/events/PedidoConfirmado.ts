import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class PedidoConfirmado implements DomainEvent {
  static readonly NOME = 'pedidos.PedidoConfirmado';
  readonly nome = PedidoConfirmado.NOME;

  constructor(
    readonly pedidoId: string,
    readonly restauranteId: string,
    readonly ocorridoEm: Date,
  ) {}
}
