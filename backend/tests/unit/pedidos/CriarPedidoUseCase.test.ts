import { BusinessRuleError, NotFoundError, ValidationError } from '../../../src/shared/domain/errors';
import { PedidoCriado } from '../../../src/modules/pedidos/domain/events/PedidoCriado';
import { CriarPedidoUseCase } from '../../../src/modules/pedidos/features/criar-pedido/CriarPedidoUseCase';
import { FakeCatalogo, FakeClientes, FakeEventBus, FakePedidoRepository, SequentialIdGenerator } from './fakes';

function montar() {
  const pedidos = new FakePedidoRepository();
  const eventos = new FakeEventBus();
  const catalogo = new FakeCatalogo('r1', [
    { id: 'lasanha', nome: 'Lasanha', precoCentavos: 3500, disponivel: true, restauranteId: 'r1' },
    { id: 'pizza', nome: 'Pizza', precoCentavos: 4000, disponivel: false, restauranteId: 'r1' },
    { id: 'sushi', nome: 'Sushi', precoCentavos: 5000, disponivel: true, restauranteId: 'r2' },
  ]);
  const useCase = new CriarPedidoUseCase(pedidos, catalogo, new FakeClientes(['c1']), new SequentialIdGenerator(), eventos);
  return { useCase, pedidos, eventos };
}

describe('CriarPedidoUseCase', () => {
  it('salva o pedido com total calculado e publica PedidoCriado', async () => {
    const { useCase, pedidos, eventos } = montar();

    const saida = await useCase.execute({
      clienteId: 'c1',
      restauranteId: 'r1',
      itens: [{ produtoId: 'lasanha', quantidade: 2 }],
    });

    expect(saida).toMatchObject({ id: 'id-1', status: 'CRIADO', subtotalCentavos: 7000, taxaEntregaCentavos: 790, totalCentavos: 7790 });
    expect(saida.itens).toEqual([
      { produtoId: 'lasanha', nome: 'Lasanha', quantidade: 2, precoUnitarioCentavos: 3500, subtotalCentavos: 7000 },
    ]);
    expect(pedidos.salvos).toHaveLength(1);
    expect(eventos.publicados).toHaveLength(1);
    expect(eventos.publicados[0]).toBeInstanceOf(PedidoCriado);
  });

  it.each([
    ['formato inválido', { clienteId: 'c1', restauranteId: 'r1', itens: [] }, ValidationError],
    ['quantidade inválida', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 0 }] }, ValidationError],
    ['cliente inexistente', { clienteId: 'x', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 1 }] }, NotFoundError],
    ['restaurante inexistente', { clienteId: 'c1', restauranteId: 'x', itens: [{ produtoId: 'lasanha', quantidade: 1 }] }, NotFoundError],
    ['produto inexistente', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'x', quantidade: 1 }] }, NotFoundError],
    ['produto indisponível', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'pizza', quantidade: 1 }] }, BusinessRuleError],
    ['produto de outro restaurante', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'sushi', quantidade: 1 }] }, BusinessRuleError],
  ])('falha com %s sem salvar nem publicar eventos', async (_caso, input, erro) => {
    const { useCase, pedidos, eventos } = montar();

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(erro);
    expect(pedidos.salvos).toHaveLength(0);
    expect(eventos.publicados).toHaveLength(0);
  });
});
