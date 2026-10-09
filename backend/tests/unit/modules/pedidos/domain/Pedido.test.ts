import { BusinessRuleError, ValidationError } from '../../../../../src/shared/domain/errors';
import { PedidoCancelado } from '../../../../../src/modules/pedidos/domain/events/PedidoCancelado';
import { PedidoConfirmado } from '../../../../../src/modules/pedidos/domain/events/PedidoConfirmado';
import { PedidoCriado } from '../../../../../src/modules/pedidos/domain/events/PedidoCriado';
import { ItemPedido } from '../../../../../src/modules/pedidos/domain/ItemPedido';
import { Pedido } from '../../../../../src/modules/pedidos/domain/Pedido';
import { Quantidade } from '../../../../../src/modules/pedidos/domain/Quantidade';
import { StatusPedido } from '../../../../../src/modules/pedidos/domain/StatusPedido';
import { itemPedido, pedidoDeTeste } from '../../../fakes';

const novoPedido = (agora?: Date): Pedido =>
  Pedido.criar(
    { id: 'ped-1', clienteId: 'c1', restauranteId: 'r1', itens: [itemPedido(2), itemPedido(3, { id: 'p2', precoCentavos: 800 })] },
    agora,
  );

describe('Pedido (agregado)', () => {
  describe('criação e cálculo de valores', () => {
    it('calcula subtotal, taxa de entrega de 790 centavos e total', () => {
      const pedido = novoPedido();

      expect(pedido.subtotal.centavos).toBe(2 * 3500 + 3 * 800);
      expect(pedido.taxaEntrega.centavos).toBe(790);
      expect(pedido.total.centavos).toBe(2 * 3500 + 3 * 800 + 790);
      expect(pedido.status).toBe(StatusPedido.CRIADO);
    });

    it('aplica sempre a taxa fixa de 790 centavos, independentemente do valor dos itens', () => {
      const pedido = Pedido.criar({ id: 'x', clienteId: 'c1', restauranteId: 'r1', itens: [itemPedido(1, { precoCentavos: 1 })] });

      expect(Pedido.TAXA_ENTREGA.centavos).toBe(790);
      expect(pedido.total.centavos).toBe(1 + 790);
    });

    it('exige pelo menos um item', () => {
      expect(() => Pedido.criar({ id: 'x', clienteId: 'c1', restauranteId: 'r1', itens: [] })).toThrow(
        new ValidationError(Pedido.MENSAGEM_SEM_ITENS),
      );
    });

    it('não é afetado por alterações posteriores na lista de itens recebida', () => {
      const itens = [itemPedido(1)];
      const pedido = Pedido.criar({ id: 'x', clienteId: 'c1', restauranteId: 'r1', itens });

      itens.push(itemPedido(10));

      expect(pedido.itens).toHaveLength(1);
      expect(pedido.subtotal.centavos).toBe(3500);
    });

    it('define criadoEm e atualizadoEm com o instante da criação', () => {
      const agora = new Date('2026-01-01T10:00:00.000Z');
      const pedido = novoPedido(agora);

      expect(pedido.criadoEm).toEqual(agora);
      expect(pedido.atualizadoEm).toEqual(agora);
    });
  });

  describe('itens e quantidade', () => {
    it.each([0, -1, 1.5, Number.NaN])('rejeita quantidade inválida %p', (quantidade) => {
      expect(() => Quantidade.criar(quantidade)).toThrow(new ValidationError(Quantidade.MENSAGEM_INVALIDA));
    });

    it('aceita quantidade inteira positiva e calcula o subtotal do item', () => {
      const item = itemPedido(3);

      expect(Quantidade.criar(2).valor).toBe(2);
      expect(item.precoUnitario.centavos).toBe(3500);
      expect(item.subtotal.centavos).toBe(3 * 3500);
    });

    it('rejeita produto indisponível ou de outro restaurante', () => {
      expect(() => itemPedido(1, { disponivel: false })).toThrow(BusinessRuleError);
      expect(() => itemPedido(1, { pertenceAoRestaurante: false })).toThrow(BusinessRuleError);
    });

    it('congela nome e preço do produto no item', () => {
      const item = ItemPedido.criar({
        produto: { id: 'p9', nome: 'Pizza', precoCentavos: 4200, disponivel: true, pertenceAoRestaurante: true },
        quantidade: Quantidade.criar(1),
      });

      expect(item).toMatchObject({ produtoId: 'p9', nome: 'Pizza' });
      expect(item.precoUnitario.centavos).toBe(4200);
    });
  });

  describe('transições de status', () => {
    it('CRIADO -> CONFIRMADO', () => {
      const pedido = pedidoDeTeste();

      pedido.confirmar();

      expect(pedido.status).toBe(StatusPedido.CONFIRMADO);
    });

    it.each([StatusPedido.CONFIRMADO, StatusPedido.CANCELADO])('não permite confirmar um pedido %s', (status) => {
      const pedido = pedidoDeTeste({ status });

      expect(() => pedido.confirmar()).toThrow(
        new BusinessRuleError(`Não é possível confirmar um pedido com status ${status}`),
      );
      expect(pedido.status).toBe(status);
      expect(pedido.puxarEventos()).toHaveLength(0);
    });

    it.each([StatusPedido.CRIADO, StatusPedido.CONFIRMADO])('permite cancelar um pedido %s', (status) => {
      const pedido = pedidoDeTeste({ status });

      pedido.cancelar();

      expect(pedido.status).toBe(StatusPedido.CANCELADO);
    });

    it.each(
      Object.values(StatusPedido).filter((s) => s !== StatusPedido.CRIADO && s !== StatusPedido.CONFIRMADO),
    )('proíbe cancelar um pedido %s', (status) => {
      const pedido = pedidoDeTeste({ status });

      expect(() => pedido.cancelar()).toThrow(
        new BusinessRuleError(`Não é possível cancelar um pedido com status ${status}`),
      );
      expect(pedido.status).toBe(status);
      expect(pedido.puxarEventos()).toHaveLength(0);
    });

    it('atualiza atualizadoEm a cada transição, preservando criadoEm', () => {
      const criadoEm = new Date('2026-01-01T10:00:00.000Z');
      const confirmadoEm = new Date('2026-01-01T10:05:00.000Z');
      const canceladoEm = new Date('2026-01-01T10:10:00.000Z');
      const pedido = novoPedido(criadoEm);

      pedido.confirmar(confirmadoEm);
      expect(pedido.atualizadoEm).toEqual(confirmadoEm);

      pedido.cancelar(canceladoEm);
      expect(pedido.atualizadoEm).toEqual(canceladoEm);
      expect(pedido.criadoEm).toEqual(criadoEm);
    });
  });

  describe('eventos de domínio', () => {
    it('registra PedidoCriado com os dados do pedido', () => {
      const agora = new Date('2026-01-01T10:00:00.000Z');
      const pedido = novoPedido(agora);

      const eventos = pedido.puxarEventos();

      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toBeInstanceOf(PedidoCriado);
      expect(eventos[0]).toMatchObject({
        nome: PedidoCriado.NOME,
        pedidoId: 'ped-1',
        clienteId: 'c1',
        restauranteId: 'r1',
        totalCentavos: pedido.total.centavos,
        ocorridoEm: agora,
      });
    });

    it('puxarEventos esvazia a lista de eventos pendentes', () => {
      const pedido = novoPedido();

      pedido.puxarEventos();

      expect(pedido.puxarEventos()).toHaveLength(0);
    });

    it('registra PedidoConfirmado ao confirmar', () => {
      const agora = new Date('2026-01-01T10:05:00.000Z');
      const pedido = pedidoDeTeste();

      pedido.confirmar(agora);

      const eventos = pedido.puxarEventos();
      expect(eventos).toHaveLength(1);
      expect(eventos[0]).toBeInstanceOf(PedidoConfirmado);
      expect(eventos[0]).toMatchObject({ nome: PedidoConfirmado.NOME, pedidoId: 'ped-1', restauranteId: 'r1', ocorridoEm: agora });
    });

    it.each([StatusPedido.CRIADO, StatusPedido.CONFIRMADO])(
      'registra PedidoCancelado com statusAnterior=%s ao cancelar',
      (statusAnterior) => {
        const pedido = pedidoDeTeste({ status: statusAnterior });

        pedido.cancelar();

        const eventos = pedido.puxarEventos();
        expect(eventos).toHaveLength(1);
        expect(eventos[0]).toBeInstanceOf(PedidoCancelado);
        expect(eventos[0]).toMatchObject({ nome: PedidoCancelado.NOME, pedidoId: 'ped-1', restauranteId: 'r1', statusAnterior });
      },
    );

    it('acumula os eventos na ordem em que ocorreram enquanto não forem puxados', () => {
      const pedido = novoPedido();

      pedido.confirmar();
      pedido.cancelar();

      expect(pedido.puxarEventos().map((e) => e.constructor)).toEqual([PedidoCriado, PedidoConfirmado, PedidoCancelado]);
    });
  });
});
