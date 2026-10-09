import { NotFoundError } from '../../../../../../src/shared/domain/errors';
import { PedidoRepository } from '../../../../../../src/modules/pedidos/domain/PedidoRepository';
import { ListarPedidosDoClienteUseCase } from '../../../../../../src/modules/pedidos/features/listar-pedidos-do-cliente/ListarPedidosDoClienteUseCase';
import { InMemoryPedidoRepository } from '../../../../../../src/modules/pedidos/infrastructure/InMemoryPedidoRepository';
import { FakeClientes, FakePedidoRepository, pedidoDeTeste } from '../../../../fakes';

/** LSP: o caso de uso se comporta igual com qualquer implementação de PedidoRepository. */
const implementacoes: Array<[string, () => PedidoRepository]> = [
  ['FakePedidoRepository', () => new FakePedidoRepository()],
  ['InMemoryPedidoRepository', () => new InMemoryPedidoRepository()],
];

describe.each(implementacoes)('ListarPedidosDoClienteUseCase (com %s)', (_nome, criarRepositorio) => {
  async function montar() {
    const repositorio = criarRepositorio();
    await repositorio.salvar(pedidoDeTeste({ id: 'ped-1', clienteId: 'c1' }));
    await repositorio.salvar(pedidoDeTeste({ id: 'ped-2', clienteId: 'c2' }));
    await repositorio.salvar(pedidoDeTeste({ id: 'ped-3', clienteId: 'c1' }));
    const useCase = new ListarPedidosDoClienteUseCase(repositorio, new FakeClientes(['c1', 'c2', 'c3']));
    return { useCase, repositorio };
  }

  it('lista apenas os pedidos do cliente informado', async () => {
    const { useCase } = await montar();

    const saida = await useCase.execute({ clienteId: 'c1' });

    expect(saida.map((p) => p.id).sort()).toEqual(['ped-1', 'ped-3']);
    expect(saida.every((p) => p.clienteId === 'c1')).toBe(true);
  });

  it('não duplica um pedido salvo mais de uma vez', async () => {
    const { useCase, repositorio } = await montar();
    const pedido = await repositorio.buscarPorId('ped-1');
    pedido!.confirmar();
    await repositorio.salvar(pedido!);

    const saida = await useCase.execute({ clienteId: 'c1' });

    expect(saida).toHaveLength(2);
    expect(saida.find((p) => p.id === 'ped-1')?.status).toBe('CONFIRMADO');
  });

  it('retorna lista vazia para cliente existente sem pedidos', async () => {
    const { useCase } = await montar();

    await expect(useCase.execute({ clienteId: 'c3' })).resolves.toEqual([]);
  });

  it('lança NotFoundError para cliente inexistente, sem consultar os pedidos', async () => {
    const { useCase, repositorio } = await montar();
    const listar = jest.spyOn(repositorio, 'listarPorCliente');

    await expect(useCase.execute({ clienteId: 'x' })).rejects.toThrow(new NotFoundError('Cliente não encontrado'));
    expect(listar).not.toHaveBeenCalled();
  });
});
