import { BusinessRuleError, ValidationError } from '../../../src/shared/domain/errors';
import { PedidoCancelado } from '../../../src/modules/pedidos/domain/events/PedidoCancelado';
import { PedidoConfirmado } from '../../../src/modules/pedidos/domain/events/PedidoConfirmado';
import { PedidoCriado } from '../../../src/modules/pedidos/domain/events/PedidoCriado';
import { ItemPedido } from '../../../src/modules/pedidos/domain/ItemPedido';
import { Pedido } from '../../../src/modules/pedidos/domain/Pedido';
import { ProdutoDoCatalogo } from '../../../src/modules/pedidos/domain/ProdutoDoCatalogo';
import { Quantidade } from '../../../src/modules/pedidos/domain/Quantidade';
import { StatusPedido } from '../../../src/modules/pedidos/domain/StatusPedido';

const produto = (sobrescrever: Partial<ProdutoDoCatalogo> = {}): ProdutoDoCatalogo => ({
  id: 'p1',
  nome: 'Lasanha',
  precoCentavos: 3500,
  disponivel: true,
  pertenceAoRestaurante: true,
  ...sobrescrever,
});

const item = (quantidade: number, sobrescrever: Partial<ProdutoDoCatalogo> = {}): ItemPedido =>
  ItemPedido.criar({ produto: produto(sobrescrever), quantidade: Quantidade.criar(quantidade) });

const novoPedido = (): Pedido =>
  Pedido.criar({ id: 'ped-1', clienteId: 'c1', restauranteId: 'r1', itens: [item(2), item(3, { id: 'p2', precoCentavos: 800 })] });

describe('Pedido (agregado)', () => {
  it('calcula subtotal, taxa de entrega de 790 centavos e total', () => {
    const pedido = novoPedido();

    expect(pedido.subtotal.centavos).toBe(2 * 3500 + 3 * 800);
    expect(pedido.taxaEntrega.centavos).toBe(790);
    expect(pedido.total.centavos).toBe(2 * 3500 + 3 * 800 + 790);
    expect(pedido.status).toBe(StatusPedido.CRIADO);
  });

  it('registra PedidoCriado e esvazia a lista ao puxar os eventos', () => {
    const pedido = novoPedido();

    const eventos = pedido.puxarEventos();
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toBeInstanceOf(PedidoCriado);
    expect(eventos[0]).toMatchObject({ pedidoId: 'ped-1', restauranteId: 'r1', totalCentavos: pedido.total.centavos });
    expect(pedido.puxarEventos()).toHaveLength(0);
  });

  it('exige pelo menos um item', () => {
    expect(() => Pedido.criar({ id: 'x', clienteId: 'c1', restauranteId: 'r1', itens: [] })).toThrow(ValidationError);
  });

  it('valida a quantidade dos itens', () => {
    expect(() => Quantidade.criar(0)).toThrow(ValidationError);
    expect(() => Quantidade.criar(1.5)).toThrow(ValidationError);
    expect(Quantidade.criar(2).valor).toBe(2);
  });

  it('rejeita produto indisponível ou de outro restaurante', () => {
    expect(() => item(1, { disponivel: false })).toThrow(BusinessRuleError);
    expect(() => item(1, { pertenceAoRestaurante: false })).toThrow(BusinessRuleError);
  });

  it('CRIADO -> CONFIRMADO -> CANCELADO', () => {
    const pedido = novoPedido();
    pedido.puxarEventos();

    pedido.confirmar();
    expect(pedido.status).toBe(StatusPedido.CONFIRMADO);
    expect(pedido.puxarEventos()[0]).toBeInstanceOf(PedidoConfirmado);

    pedido.cancelar();
    expect(pedido.status).toBe(StatusPedido.CANCELADO);
    expect(pedido.puxarEventos()[0]).toMatchObject({ statusAnterior: StatusPedido.CONFIRMADO });
  });

  it('não permite transições inválidas', () => {
    const pedido = novoPedido();
    pedido.cancelar();

    expect(() => pedido.cancelar()).toThrow(new BusinessRuleError('Não é possível cancelar um pedido com status CANCELADO'));
    expect(() => pedido.confirmar()).toThrow(new BusinessRuleError('Não é possível confirmar um pedido com status CANCELADO'));
    expect(pedido.puxarEventos().filter((e) => e instanceof PedidoCancelado)).toHaveLength(1);
  });

  it('atualiza atualizadoEm a cada transição', () => {
    const criadoEm = new Date('2026-01-01T10:00:00.000Z');
    const confirmadoEm = new Date('2026-01-01T10:05:00.000Z');
    const pedido = Pedido.criar({ id: 'x', clienteId: 'c1', restauranteId: 'r1', itens: [item(1)] }, criadoEm);

    pedido.confirmar(confirmadoEm);

    expect(pedido.criadoEm).toEqual(criadoEm);
    expect(pedido.atualizadoEm).toEqual(confirmadoEm);
  });
});
