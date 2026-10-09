import { NotFoundError } from '../../../../../../src/shared/domain/errors';
import { Produto } from '../../../../../../src/modules/restaurantes/domain/Produto';
import { Restaurante } from '../../../../../../src/modules/restaurantes/domain/Restaurante';
import { RestauranteRepository } from '../../../../../../src/modules/restaurantes/domain/RestauranteRepository';
import { ListarCardapioUseCase } from '../../../../../../src/modules/restaurantes/features/listar-cardapio/ListarCardapioUseCase';
import { InMemoryRestauranteRepository } from '../../../../../../src/modules/restaurantes/infrastructure/InMemoryRestauranteRepository';
import { FakeRestauranteRepository } from '../../../../fakes';

/** LSP: o caso de uso se comporta igual com qualquer implementação de RestauranteRepository. */
const implementacoes: Array<[string, () => RestauranteRepository]> = [
  ['FakeRestauranteRepository', () => new FakeRestauranteRepository()],
  ['InMemoryRestauranteRepository', () => new InMemoryRestauranteRepository()],
];

describe.each(implementacoes)('ListarCardapioUseCase (com %s)', (_nome, criarRepositorio) => {
  async function montar() {
    const restaurantes = criarRepositorio();
    await restaurantes.salvar(Restaurante.criar({ id: 'r1', nome: 'Cantina', categoria: 'Italiana' }));
    await restaurantes.salvar(Restaurante.criar({ id: 'r2', nome: 'Sushi Bar', categoria: 'Japonesa' }));
    await restaurantes.salvar(Restaurante.criar({ id: 'r3', nome: 'Vazio', categoria: 'Outros' }));
    await restaurantes.salvarProduto(Produto.criar({ id: 'p1', restauranteId: 'r1', nome: 'Lasanha', precoCentavos: 3500 }));
    await restaurantes.salvarProduto(Produto.criar({ id: 'p2', restauranteId: 'r2', nome: 'Sushi', precoCentavos: 5000 }));
    await restaurantes.salvarProduto(
      Produto.criar({ id: 'p3', restauranteId: 'r1', nome: 'Pizza', precoCentavos: 4000, disponivel: false }),
    );
    return { restaurantes, useCase: new ListarCardapioUseCase(restaurantes) };
  }

  it('lista apenas os produtos do restaurante, na ordem de cadastro, incluindo indisponíveis', async () => {
    const { useCase } = await montar();

    const saida = await useCase.execute({ restauranteId: 'r1' });

    expect(saida.map(({ id, nome, precoCentavos, disponivel }) => ({ id, nome, precoCentavos, disponivel }))).toEqual([
      { id: 'p1', nome: 'Lasanha', precoCentavos: 3500, disponivel: true },
      { id: 'p3', nome: 'Pizza', precoCentavos: 4000, disponivel: false },
    ]);
    expect(saida.every((p) => p.restauranteId === 'r1')).toBe(true);
  });

  it('retorna lista vazia para restaurante sem produtos', async () => {
    const { useCase } = await montar();

    await expect(useCase.execute({ restauranteId: 'r3' })).resolves.toEqual([]);
  });

  it('lança NotFoundError para restaurante inexistente, sem consultar produtos', async () => {
    const { useCase, restaurantes } = await montar();
    const listarProdutos = jest.spyOn(restaurantes, 'listarProdutosDoRestaurante');

    await expect(useCase.execute({ restauranteId: 'x' })).rejects.toThrow(new NotFoundError('Restaurante não encontrado'));
    expect(listarProdutos).not.toHaveBeenCalled();
  });
});
