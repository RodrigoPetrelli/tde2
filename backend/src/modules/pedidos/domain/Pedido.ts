import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors';
import { Money } from '../../../shared/domain/Money';
import { PedidoCancelado } from './events/PedidoCancelado';
import { PedidoConfirmado } from './events/PedidoConfirmado';
import { PedidoCriado } from './events/PedidoCriado';
import { ItemPedido } from './ItemPedido';
import { StatusPedido } from './StatusPedido';

export interface CriarPedidoProps {
  id: string;
  clienteId: string;
  restauranteId: string;
  itens: readonly ItemPedido[];
}

/** Máquina de estados: CRIADO -> CONFIRMADO -> CANCELADO, ou CRIADO -> CANCELADO. */
const TRANSICOES_PERMITIDAS: Readonly<Record<StatusPedido, readonly StatusPedido[]>> = {
  [StatusPedido.CRIADO]: [StatusPedido.CONFIRMADO, StatusPedido.CANCELADO],
  [StatusPedido.CONFIRMADO]: [StatusPedido.CANCELADO],
  [StatusPedido.CANCELADO]: [],
};

/** Raiz do agregado Pedido: concentra cálculo de valores e transições de status. */
export class Pedido extends AggregateRoot {
  static readonly TAXA_ENTREGA = Money.deCentavos(790); // R$ 7,90
  static readonly MENSAGEM_SEM_ITENS = 'O pedido deve ter pelo menos 1 item';

  private constructor(
    id: string,
    public readonly clienteId: string,
    public readonly restauranteId: string,
    public readonly itens: readonly ItemPedido[],
    public readonly taxaEntrega: Money,
    private statusAtual: StatusPedido,
    public readonly criadoEm: Date,
    private ultimaAtualizacao: Date,
  ) {
    super(id);
  }

  static criar(props: CriarPedidoProps, agora: Date = new Date()): Pedido {
    if (props.itens.length === 0) {
      throw new ValidationError(Pedido.MENSAGEM_SEM_ITENS);
    }
    const pedido = new Pedido(
      props.id,
      props.clienteId,
      props.restauranteId,
      [...props.itens],
      Pedido.TAXA_ENTREGA,
      StatusPedido.CRIADO,
      agora,
      agora,
    );
    pedido.registrarEvento(
      new PedidoCriado(pedido.id, pedido.clienteId, pedido.restauranteId, pedido.total.centavos, agora),
    );
    return pedido;
  }

  get status(): StatusPedido {
    return this.statusAtual;
  }

  get atualizadoEm(): Date {
    return this.ultimaAtualizacao;
  }

  get subtotal(): Money {
    return this.itens.reduce((soma, item) => soma.somar(item.subtotal), Money.zero());
  }

  get total(): Money {
    return this.subtotal.somar(this.taxaEntrega);
  }

  confirmar(agora: Date = new Date()): void {
    this.transicionarPara(StatusPedido.CONFIRMADO, 'confirmar', agora);
    this.registrarEvento(new PedidoConfirmado(this.id, this.restauranteId, agora));
  }

  cancelar(agora: Date = new Date()): void {
    const statusAnterior = this.statusAtual;
    this.transicionarPara(StatusPedido.CANCELADO, 'cancelar', agora);
    this.registrarEvento(new PedidoCancelado(this.id, this.restauranteId, statusAnterior, agora));
  }

  private transicionarPara(destino: StatusPedido, acao: string, agora: Date): void {
    if (!TRANSICOES_PERMITIDAS[this.statusAtual].includes(destino)) {
      throw new BusinessRuleError(`Não é possível ${acao} um pedido com status ${this.statusAtual}`);
    }
    this.statusAtual = destino;
    this.ultimaAtualizacao = agora;
  }
}
