import { BusinessRuleError, NotFoundError } from '../../../../../../src/shared/domain/errors';
import { PedidoConfirmado } from '../../../../../../src/modules/pedidos/domain/events/PedidoConfirmado';
import { StatusPedido } from '../../../../../../src/modules/pedidos/domain/StatusPedido';
import { ConfirmarPedidoUseCase } from '../../../../../../src/modules/pedidos/features/confirmar-pedido/ConfirmarPedidoUseCase';
import { FakeEventBus, FakePedidoRepository, pedidoDeTeste } from '../../../../fakes';

function montar(status: StatusPedido = StatusPedido.CRIADO) {
  const pedidos = new FakePedidoRepository([pedidoDeTeste({ id: 'ped-1', restauranteId: 'r1', status })]);
  const eventos = new FakeEventBus();
  return { useCase: new ConfirmarPedidoUseCase(pedidos, eventos), pedidos, eventos };
}

describe('ConfirmarPedidoUseCase', () => {
  it('confirma um pedido CRIADO, salva e publica PedidoConfirmado', async () => {
    const { useCase, pedidos, eventos } = montar();

    const saida = await useCase.execute({ pedidoId: 'ped-1' });

    expect(saida).toMatchObject({ id: 'ped-1', status: StatusPedido.CONFIRMADO });
    expect(pedidos.salvos).toHaveLength(1);
    expect(pedidos.salvos[0].status).toBe(StatusPedido.CONFIRMADO);
    expect(eventos.publicados).toHaveLength(1);
    expect(eventos.publicados[0]).toBeInstanceOf(PedidoConfirmado);
    expect(eventos.publicados[0]).toMatchObject({ pedidoId: 'ped-1', restauranteId: 'r1' });
  });

  it.each([StatusPedido.CONFIRMADO, StatusPedido.CANCELADO])(
    'rejeita confirmar um pedido %s sem salvar nem publicar',
    async (status) => {
      const { useCase, pedidos, eventos } = montar(status);

      await expect(useCase.execute({ pedidoId: 'ped-1' })).rejects.toThrow(
        new BusinessRuleError(`Não é possível confirmar um pedido com status ${status}`),
      );
      expect(pedidos.salvos).toHaveLength(0);
      expect(eventos.publicados).toHaveLength(0);
    },
  );

  it('lança NotFoundError para pedido inexistente', async () => {
    const { useCase, pedidos, eventos } = montar();

    await expect(useCase.execute({ pedidoId: 'x' })).rejects.toThrow(new NotFoundError('Pedido não encontrado'));
    expect(pedidos.salvos).toHaveLength(0);
    expect(eventos.publicados).toHaveLength(0);
  });
});
