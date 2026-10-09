import { BusinessRuleError, NotFoundError } from '../../../src/shared/domain/errors';
import { PedidoCancelado } from '../../../src/modules/pedidos/domain/events/PedidoCancelado';
import { PedidoConfirmado } from '../../../src/modules/pedidos/domain/events/PedidoConfirmado';
import { ItemPedido } from '../../../src/modules/pedidos/domain/ItemPedido';
import { Pedido } from '../../../src/modules/pedidos/domain/Pedido';
import { Quantidade } from '../../../src/modules/pedidos/domain/Quantidade';
import { CancelarPedidoUseCase } from '../../../src/modules/pedidos/features/cancelar-pedido/CancelarPedidoUseCase';
import { ConfirmarPedidoUseCase } from '../../../src/modules/pedidos/features/confirmar-pedido/ConfirmarPedidoUseCase';
import { FakeEventBus, FakePedidoRepository } from './fakes';

async function repositorioComPedido(): Promise<FakePedidoRepository> {
  const repo = new FakePedidoRepository();
  const item = ItemPedido.criar({
    produto: { id: 'p1', nome: 'Lasanha', precoCentavos: 3500, disponivel: true, pertenceAoRestaurante: true },
    quantidade: Quantidade.criar(1),
  });
  const pedido = Pedido.criar({ id: 'ped-1', clienteId: 'c1', restauranteId: 'r1', itens: [item] });
  pedido.puxarEventos();
  await repo.salvar(pedido);
  return repo;
}

describe('ConfirmarPedidoUseCase / CancelarPedidoUseCase', () => {
  it('confirma, salva e publica PedidoConfirmado', async () => {
    const repo = await repositorioComPedido();
    const eventos = new FakeEventBus();

    const saida = await new ConfirmarPedidoUseCase(repo, eventos).execute({ pedidoId: 'ped-1' });

    expect(saida.status).toBe('CONFIRMADO');
    expect(eventos.publicados[0]).toBeInstanceOf(PedidoConfirmado);
  });

  it('cancela e depois rejeita novo cancelamento com regra de negócio', async () => {
    const repo = await repositorioComPedido();
    const eventos = new FakeEventBus();
    const cancelar = new CancelarPedidoUseCase(repo, eventos);

    expect((await cancelar.execute({ pedidoId: 'ped-1' })).status).toBe('CANCELADO');
    await expect(cancelar.execute({ pedidoId: 'ped-1' })).rejects.toBeInstanceOf(BusinessRuleError);
    expect(eventos.publicados.filter((e) => e instanceof PedidoCancelado)).toHaveLength(1);
  });

  it('retorna NotFoundError para pedido inexistente', async () => {
    const repo = new FakePedidoRepository();
    await expect(new CancelarPedidoUseCase(repo, new FakeEventBus()).execute({ pedidoId: 'x' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
