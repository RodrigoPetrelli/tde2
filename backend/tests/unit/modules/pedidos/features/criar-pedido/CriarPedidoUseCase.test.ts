import { EventPublisher } from '../../../../../../src/shared/application/EventBus';
import { DomainEvent } from '../../../../../../src/shared/domain/DomainEvent';
import { BusinessRuleError, NotFoundError, ValidationError } from '../../../../../../src/shared/domain/errors';
import { Cliente } from '../../../../../../src/modules/clientes/domain/Cliente';
import { CatalogoGateway } from '../../../../../../src/modules/pedidos/application/ports/CatalogoGateway';
import { ClienteGateway } from '../../../../../../src/modules/pedidos/application/ports/ClienteGateway';
import { PedidoCriado } from '../../../../../../src/modules/pedidos/domain/events/PedidoCriado';
import { CriarPedidoUseCase } from '../../../../../../src/modules/pedidos/features/criar-pedido/CriarPedidoUseCase';
import { CatalogoGatewayAdapter } from '../../../../../../src/modules/pedidos/infrastructure/CatalogoGatewayAdapter';
import { ClienteGatewayAdapter } from '../../../../../../src/modules/pedidos/infrastructure/ClienteGatewayAdapter';
import { Produto } from '../../../../../../src/modules/restaurantes/domain/Produto';
import { Restaurante } from '../../../../../../src/modules/restaurantes/domain/Restaurante';
import {
  FakeCatalogo,
  FakeClienteRepository,
  FakeClientes,
  FakeEventBus,
  FakePedidoRepository,
  FakeRestauranteRepository,
  SequentialIdGenerator,
} from '../../../../fakes';

function montar() {
  const pedidos = new FakePedidoRepository();
  const eventos = new FakeEventBus();
  const catalogo = new FakeCatalogo('r1', [
    { id: 'lasanha', nome: 'Lasanha', precoCentavos: 3500, disponivel: true, restauranteId: 'r1' },
    { id: 'suco', nome: 'Suco', precoCentavos: 900, disponivel: true, restauranteId: 'r1' },
    { id: 'pizza', nome: 'Pizza', precoCentavos: 4000, disponivel: false, restauranteId: 'r1' },
    { id: 'sushi', nome: 'Sushi', precoCentavos: 5000, disponivel: true, restauranteId: 'r2' },
  ]);
  const clientes = new FakeClientes(['c1']);
  const useCase = new CriarPedidoUseCase(pedidos, catalogo, clientes, new SequentialIdGenerator(), eventos);
  return { useCase, pedidos, eventos, catalogo, clientes };
}

describe('CriarPedidoUseCase', () => {
  it('salva o pedido com total calculado (subtotal + taxa de 790 centavos)', async () => {
    const { useCase, pedidos } = montar();

    const saida = await useCase.execute({
      clienteId: 'c1',
      restauranteId: 'r1',
      itens: [{ produtoId: 'lasanha', quantidade: 2 }],
    });

    expect(saida).toMatchObject({
      id: 'id-1',
      clienteId: 'c1',
      restauranteId: 'r1',
      status: 'CRIADO',
      subtotalCentavos: 7000,
      taxaEntregaCentavos: 790,
      totalCentavos: 7790,
    });
    expect(saida.itens).toEqual([
      { produtoId: 'lasanha', nome: 'Lasanha', quantidade: 2, precoUnitarioCentavos: 3500, subtotalCentavos: 7000 },
    ]);
    expect(pedidos.salvos).toHaveLength(1);
    expect(pedidos.salvos[0].id).toBe('id-1');
  });

  it('publica exatamente um PedidoCriado no EventBus, com os dados do pedido', async () => {
    const { useCase, eventos } = montar();

    const saida = await useCase.execute({ clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 2 }] });

    expect(eventos.publicados).toHaveLength(1);
    expect(eventos.publicados[0]).toBeInstanceOf(PedidoCriado);
    expect(eventos.publicados[0]).toMatchObject({
      nome: PedidoCriado.NOME,
      pedidoId: saida.id,
      clienteId: 'c1',
      restauranteId: 'r1',
      totalCentavos: 7790,
    });
  });

  it('publica os eventos somente depois de salvar o pedido e não os deixa pendentes no agregado', async () => {
    const pedidos = new FakePedidoRepository();
    const ordem: string[] = [];
    jest.spyOn(pedidos, 'salvar').mockImplementation(async () => void ordem.push('salvar'));
    const publicador: EventPublisher = { publicar: async (e: readonly DomainEvent[]) => void ordem.push(`publicar:${e.length}`) };
    const useCase = new CriarPedidoUseCase(
      pedidos,
      new FakeCatalogo('r1', [{ id: 'lasanha', nome: 'Lasanha', precoCentavos: 3500, disponivel: true, restauranteId: 'r1' }]),
      new FakeClientes(['c1']),
      new SequentialIdGenerator(),
      publicador,
    );

    await useCase.execute({ clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 1 }] });

    expect(ordem).toEqual(['salvar', 'publicar:1']);
  });

  it('soma vários itens e consulta o catálogo uma única vez, sem ids repetidos', async () => {
    const { useCase, catalogo } = montar();
    const busca = jest.spyOn(catalogo, 'buscarProdutosDoRestaurante');

    const saida = await useCase.execute({
      clienteId: 'c1',
      restauranteId: 'r1',
      itens: [
        { produtoId: 'lasanha', quantidade: 1 },
        { produtoId: 'suco', quantidade: 2 },
        { produtoId: 'lasanha', quantidade: 2 },
      ],
    });

    expect(busca).toHaveBeenCalledTimes(1);
    expect(busca).toHaveBeenCalledWith('r1', ['lasanha', 'suco']);
    expect(saida.itens).toHaveLength(3);
    expect(saida.subtotalCentavos).toBe(3 * 3500 + 2 * 900);
    expect(saida.totalCentavos).toBe(3 * 3500 + 2 * 900 + 790);
  });

  it.each([
    ['clienteId ausente', { restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 1 }] }, ValidationError],
    ['pedido sem itens', { clienteId: 'c1', restauranteId: 'r1', itens: [] }, ValidationError],
    ['itens que não são lista', { clienteId: 'c1', restauranteId: 'r1', itens: 'lasanha' }, ValidationError],
    ['quantidade zero', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 0 }] }, ValidationError],
    ['quantidade fracionária', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 1.5 }] }, ValidationError],
    ['quantidade não numérica', { clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: '2' }] }, ValidationError],
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

  it('valida o formato da entrada antes de consultar as portas (400 antes de 404)', async () => {
    const { useCase, catalogo, clientes } = montar();
    const consultaCliente = jest.spyOn(clientes, 'clienteExiste');
    const consultaRestaurante = jest.spyOn(catalogo, 'restauranteExiste');

    await expect(useCase.execute({ clienteId: 'x', restauranteId: 'x', itens: [] })).rejects.toBeInstanceOf(ValidationError);
    expect(consultaCliente).not.toHaveBeenCalled();
    expect(consultaRestaurante).not.toHaveBeenCalled();
  });

  describe('LSP: qualquer implementação das portas pode substituir os fakes', () => {
    it('produz o mesmo resultado usando os adaptadores reais sobre repositórios fake', async () => {
      const restaurantes = new FakeRestauranteRepository();
      await restaurantes.salvar(Restaurante.criar({ id: 'r1', nome: 'Cantina', categoria: 'Italiana' }));
      await restaurantes.salvarProduto(Produto.criar({ id: 'lasanha', restauranteId: 'r1', nome: 'Lasanha', precoCentavos: 3500 }));
      const clientesRepo = new FakeClienteRepository([Cliente.criar({ id: 'c1', nome: 'Maria', email: 'maria@exemplo.com' })]);

      const catalogo: CatalogoGateway = new CatalogoGatewayAdapter(restaurantes);
      const clientes: ClienteGateway = new ClienteGatewayAdapter(clientesRepo);
      const eventos = new FakeEventBus();
      const useCase = new CriarPedidoUseCase(new FakePedidoRepository(), catalogo, clientes, new SequentialIdGenerator(), eventos);

      const saida = await useCase.execute({ clienteId: 'c1', restauranteId: 'r1', itens: [{ produtoId: 'lasanha', quantidade: 2 }] });

      expect(saida).toMatchObject({ subtotalCentavos: 7000, taxaEntregaCentavos: 790, totalCentavos: 7790 });
      expect(eventos.publicados[0]).toBeInstanceOf(PedidoCriado);
    });
  });
});
