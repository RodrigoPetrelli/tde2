import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export class PedidoCriado implements DomainEvent {
  static readonly NOME = 'pedidos.PedidoCriado';
  readonly nome = PedidoCriado.NOME;

  constructor(
    readonly pedidoId: string,
    readonly clienteId: string,
    readonly restauranteId: string,
    readonly totalCentavos: number,
    readonly ocorridoEm: Date,
  ) {}
}
