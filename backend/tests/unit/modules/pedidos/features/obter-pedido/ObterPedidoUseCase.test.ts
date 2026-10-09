import { NotFoundError } from '../../../../../../src/shared/domain/errors';
import { PedidoRepository } from '../../../../../../src/modules/pedidos/domain/PedidoRepository';
import { StatusPedido } from '../../../../../../src/modules/pedidos/domain/StatusPedido';
import { ObterPedidoUseCase } from '../../../../../../src/modules/pedidos/features/obter-pedido/ObterPedidoUseCase';
import { InMemoryPedidoRepository } from '../../../../../../src/modules/pedidos/infrastructure/InMemoryPedidoRepository';
import { FakePedidoRepository, itemPedido, pedidoDeTeste } from '../../../../fakes';

/** LSP: o caso de uso se comporta igual com qualquer implementação de PedidoRepository. */
const implementacoes: Array<[string, () => PedidoRepository]> = [
  ['FakePedidoRepository', () => new FakePedidoRepository()],
  ['InMemoryPedidoRepository', () => new InMemoryPedidoRepository()],
];

describe.each(implementacoes)('ObterPedidoUseCase (com %s)', (_nome, criarRepositorio) => {
  it('retorna o pedido como DTO', async () => {
    const repositorio = criarRepositorio();
    const pedido = pedidoDeTeste({ id: 'ped-1', status: StatusPedido.CONFIRMADO, itens: [itemPedido(2)] });
    await repositorio.salvar(pedido);

    const saida = await new ObterPedidoUseCase(repositorio).execute({ pedidoId: 'ped-1' });

    expect(saida).toEqual({
      id: 'ped-1',
      clienteId: 'c1',
      restauranteId: 'r1',
      itens: [{ produtoId: 'p1', nome: 'Lasanha', quantidade: 2, precoUnitarioCentavos: 3500, subtotalCentavos: 7000 }],
      subtotalCentavos: 7000,
      taxaEntregaCentavos: 790,
      totalCentavos: 7790,
      status: StatusPedido.CONFIRMADO,
      criadoEm: pedido.criadoEm.toISOString(),
      atualizadoEm: pedido.atualizadoEm.toISOString(),
    });
  });

  it('lança NotFoundError para pedido inexistente', async () => {
    await expect(new ObterPedidoUseCase(criarRepositorio()).execute({ pedidoId: 'x' })).rejects.toThrow(
      new NotFoundError('Pedido não encontrado'),
    );
  });
});
