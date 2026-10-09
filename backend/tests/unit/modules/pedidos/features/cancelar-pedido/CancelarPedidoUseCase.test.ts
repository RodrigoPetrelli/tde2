import { EventPublisher } from '../../../../../../src/shared/application/EventBus';
import { DomainEvent } from '../../../../../../src/shared/domain/DomainEvent';
import { BusinessRuleError, NotFoundError } from '../../../../../../src/shared/domain/errors';
import { PedidoCancelado } from '../../../../../../src/modules/pedidos/domain/events/PedidoCancelado';
import { StatusPedido } from '../../../../../../src/modules/pedidos/domain/StatusPedido';
import { CancelarPedidoUseCase } from '../../../../../../src/modules/pedidos/features/cancelar-pedido/CancelarPedidoUseCase';
import { FakeEventBus, FakePedidoRepository, pedidoDeTeste } from '../../../../fakes';

function montar(status: StatusPedido = StatusPedido.CRIADO) {
  const pedidos = new FakePedidoRepository([pedidoDeTeste({ id: 'ped-1', status })]);
  const eventos = new FakeEventBus();
  return { useCase: new CancelarPedidoUseCase(pedidos, eventos), pedidos, eventos };
}

describe('CancelarPedidoUseCase', () => {
  it.each([StatusPedido.CRIADO, StatusPedido.CONFIRMADO])(
    'cancela um pedido %s, salva e publica PedidoCancelado',
    async (statusAnterior) => {
      const { useCase, pedidos, eventos } = montar(statusAnterior);

      const saida = await useCase.execute({ pedidoId: 'ped-1' });

      expect(saida).toMatchObject({ id: 'ped-1', status: StatusPedido.CANCELADO });
      expect(pedidos.salvos).toHaveLength(1);
      expect(pedidos.salvos[0].status).toBe(StatusPedido.CANCELADO);
      expect(eventos.publicados).toHaveLength(1);
      expect(eventos.publicados[0]).toBeInstanceOf(PedidoCancelado);
      expect(eventos.publicados[0]).toMatchObject({ pedidoId: 'ped-1', statusAnterior });
    },
  );

  it('rejeita cancelar um pedido já CANCELADO sem salvar nem publicar', async () => {
    const { useCase, pedidos, eventos } = montar(StatusPedido.CANCELADO);

    await expect(useCase.execute({ pedidoId: 'ped-1' })).rejects.toThrow(
      new BusinessRuleError('Não é possível cancelar um pedido com status CANCELADO'),
    );
    expect(pedidos.salvos).toHaveLength(0);
    expect(eventos.publicados).toHaveLength(0);
  });

  it('cancela uma vez e rejeita o segundo cancelamento', async () => {
    const { useCase, eventos } = montar();

    await useCase.execute({ pedidoId: 'ped-1' });
    await expect(useCase.execute({ pedidoId: 'ped-1' })).rejects.toBeInstanceOf(BusinessRuleError);

    expect(eventos.publicados.filter((e) => e instanceof PedidoCancelado)).toHaveLength(1);
  });

  it('lança NotFoundError para pedido inexistente', async () => {
    const { useCase, pedidos, eventos } = montar();

    await expect(useCase.execute({ pedidoId: 'x' })).rejects.toThrow(new NotFoundError('Pedido não encontrado'));
    expect(pedidos.salvos).toHaveLength(0);
    expect(eventos.publicados).toHaveLength(0);
  });

  it('depende só do lado de publicação do barramento (ISP/DIP): aceita um EventPublisher mínimo', async () => {
    const recebidos: DomainEvent[] = [];
    const publicador: EventPublisher = { publicar: async (eventos) => void recebidos.push(...eventos) };
    const useCase = new CancelarPedidoUseCase(new FakePedidoRepository([pedidoDeTeste()]), publicador);

    await useCase.execute({ pedidoId: 'ped-1' });

    expect(recebidos.map((e) => e.nome)).toEqual([PedidoCancelado.NOME]);
  });
});
